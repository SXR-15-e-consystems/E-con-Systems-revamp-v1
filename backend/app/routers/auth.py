import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field

from app.database import get_db
from app.models.user import PasswordChange, UserResponse
from app.security.dependencies import get_current_user
from app.security.hashing import hash_password, verify_password
from app.security.jwt import create_access_token, create_refresh_token, decode_token
from app.security.rate_limit import is_rate_limited
from app.services.audit_service import fire_audit_event
from app.services.user_service import (
    increment_failed_attempts,
    reset_failed_attempts,
    change_password,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


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
        raise generic_error

    # Success — reset counters
    await reset_failed_attempts(db, user["_id"])

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
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Missing refresh token"},
        )

    import jwt as pyjwt

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

    from bson import ObjectId

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if user is None or not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "User not found or inactive"},
        )

    user_id_str = str(user["_id"])
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
    response: Response,
    current_user: dict = Depends(get_current_user),
):
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

    fire_audit_event("PASSWORD_CHANGE", user_id=str(current_user["_id"]))
    return {"message": "Password updated successfully"}
