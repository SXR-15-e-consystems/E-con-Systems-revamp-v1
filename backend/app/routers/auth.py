import os
from datetime import datetime, timedelta, timezone

import jwt as pyjwt
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

from app.database import get_db
from app.models.user import PasswordChange, UserResponse
from app.security.dependencies import get_current_user
from app.security.hashing import hash_password, verify_password
from app.security.jwt import create_access_token, create_refresh_token, decode_token
from app.security.rate_limit import is_rate_limited
from app.services.audit_service import fire_audit_event
from app.services.token_service import revoke_token
from app.services.user_service import (
    increment_failed_attempts,
    reset_failed_attempts,
    change_password,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

_bearer_scheme = HTTPBearer(auto_error=False)

# Precomputed dummy hash for constant-time rejection when user is not found
_DUMMY_HASH: str = hash_password("__dummy_timing_equalization__")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _is_secure_cookie() -> bool:
    return os.getenv("SECURE_COOKIES", "false").lower() == "true"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=_is_secure_cookie(),
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.set_cookie(
        key="refresh_token",
        value="",
        httponly=True,
        secure=_is_secure_cookie(),
        samesite="lax",
        max_age=0,
        path="/api/v1/auth",
    )


def _is_password_expired(user: dict) -> bool:
    """Return True if the user's password has exceeded PASSWORD_MAX_AGE_DAYS."""
    max_age_days = int(os.getenv("PASSWORD_MAX_AGE_DAYS", "0"))
    if max_age_days <= 0:
        return False  # Expiry disabled when set to 0
    changed_at = user.get("password_changed_at") or user.get("created_at")
    if changed_at is None:
        return False
    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    if changed_at.tzinfo is None:
        changed_at = changed_at.replace(tzinfo=timezone.utc)
    return changed_at < cutoff


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, body: LoginRequest):
    client_ip = _get_client_ip(request)

    # Rate limit: 5 attempts per minute per IP
    if is_rate_limited(f"login:{client_ip}", max_requests=5, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMITED", "message": "Too many login attempts. Try again later."},
        )

    db = get_db()
    user = await db.users.find_one({"email": body.email.lower()})

    # Generic error — never reveal whether email exists
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "UNAUTHORIZED", "message": "Invalid email or password"},
    )

    if user is None:
        # Always run bcrypt to prevent timing-based user enumeration
        verify_password(body.password, _DUMMY_HASH)
        raise generic_error

    user_id_str = str(user["_id"])

    # Check account lockout
    locked_until = user.get("locked_until")
    if locked_until and datetime.now(timezone.utc) < locked_until:
        fire_audit_event("LOGIN_FAILURE_LOCKED", user_id=user_id_str, ip_address=client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Account temporarily locked. Try again later."},
        )

    # If lock period expired, reset
    if locked_until and datetime.now(timezone.utc) >= locked_until:
        await reset_failed_attempts(db, user["_id"])

    # Verify password
    if not verify_password(body.password, user["hashed_password"]):
        attempts = await increment_failed_attempts(db, user["_id"])
        fire_audit_event(
            "LOGIN_FAILURE",
            user_id=user_id_str,
            details={"attempts": attempts},
            ip_address=client_ip,
        )
        if attempts >= 10:
            # Account just locked on this attempt — return locked message immediately
            fire_audit_event("LOGIN_FAILURE_LOCKED", user_id=user_id_str, ip_address=client_ip)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "UNAUTHORIZED", "message": "Account temporarily locked. Try again later."},
            )
        raise generic_error

    # Success — reset counters
    await reset_failed_attempts(db, user["_id"])

    # Enforce password rotation policy
    if _is_password_expired(user):
        fire_audit_event("LOGIN_FAILURE_PASSWORD_EXPIRED", user_id=user_id_str, ip_address=client_ip)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "PASSWORD_EXPIRED", "message": "Your password has expired. Please reset it."},
        )

    access_token = create_access_token(subject=user_id_str, role=user["role"])
    refresh_token = create_refresh_token(subject=user_id_str)

    fire_audit_event("LOGIN_SUCCESS", user_id=user_id_str, ip_address=client_ip)

    response = Response(
        content=TokenResponse(access_token=access_token).model_dump_json(),
        media_type="application/json",
    )
    _set_refresh_cookie(response, refresh_token)
    return response


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request):
    client_ip = _get_client_ip(request)

    # Rate limit refresh calls to prevent token-chaining abuse
    if is_rate_limited(f"refresh:{client_ip}", max_requests=20, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "RATE_LIMITED", "message": "Too many refresh attempts. Try again later."},
        )

    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Missing refresh token"},
        )

    try:
        payload = decode_token(token)
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Refresh token has expired"},
        )
    except pyjwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid refresh token"},
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid token type"},
        )

    db = get_db()

    # Check refresh token blacklist
    jti = payload.get("jti")
    if jti:
        from app.services.token_service import is_token_revoked
        if await is_token_revoked(db, jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "UNAUTHORIZED", "message": "Refresh token has been revoked"},
            )

    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if user is None or not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "User not found or inactive"},
        )

    # Reject refresh for locked accounts
    locked_until = user.get("locked_until")
    if locked_until and datetime.now(timezone.utc) < locked_until:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Account temporarily locked."},
        )

    user_id_str = str(user["_id"])

    # Enforce password rotation policy at token refresh too
    if _is_password_expired(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "PASSWORD_EXPIRED", "message": "Your password has expired. Please reset it."},
        )

    new_access = create_access_token(subject=user_id_str, role=user["role"])
    new_refresh = create_refresh_token(subject=user_id_str)

    response = Response(
        content=TokenResponse(access_token=new_access).model_dump_json(),
        media_type="application/json",
    )
    _set_refresh_cookie(response, new_refresh)
    return response


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()

    # Revoke the current access token so it cannot be reused after logout
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            acc_payload = decode_token(auth_header[7:])
            acc_jti = acc_payload.get("jti")
            acc_exp = acc_payload.get("exp")
            if acc_jti and acc_exp:
                await revoke_token(
                    db, acc_jti,
                    datetime.fromtimestamp(acc_exp, tz=timezone.utc),
                )
        except Exception:
            pass

    # Revoke the refresh token so it cannot generate new access tokens
    refresh_tok = request.cookies.get("refresh_token")
    if refresh_tok:
        try:
            ref_payload = decode_token(refresh_tok)
            ref_jti = ref_payload.get("jti")
            ref_exp = ref_payload.get("exp")
            if ref_jti and ref_exp:
                await revoke_token(
                    db, ref_jti,
                    datetime.fromtimestamp(ref_exp, tz=timezone.utc),
                )
        except Exception:
            pass

    _clear_refresh_cookie(response)
    fire_audit_event("LOGOUT", user_id=str(current_user["_id"]))
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        role=current_user["role"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"],
        updated_at=current_user.get("updated_at", current_user["created_at"]),
    )


@router.put("/password")
async def update_password(
    body: PasswordChange,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Current password is incorrect"},
        )

    db = get_db()
    new_hash = hash_password(body.new_password)
    await change_password(db, current_user["_id"], new_hash)

    # Revoke current access token so re-authentication is required after password change
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            acc_payload = decode_token(auth_header[7:])
            acc_jti = acc_payload.get("jti")
            acc_exp = acc_payload.get("exp")
            if acc_jti and acc_exp:
                await revoke_token(
                    db, acc_jti,
                    datetime.fromtimestamp(acc_exp, tz=timezone.utc),
                )
        except Exception:
            pass

    fire_audit_event("PASSWORD_CHANGE", user_id=str(current_user["_id"]))
    return {"message": "Password updated successfully"}
