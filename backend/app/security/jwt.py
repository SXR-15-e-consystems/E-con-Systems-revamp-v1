import os
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt  # PyJWT


def _get_algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")


def _get_access_expire_minutes() -> int:
    return int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))


def _get_refresh_expire_days() -> int:
    return int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def _require_secret() -> str:
    secret = os.getenv("JWT_SECRET_KEY", "")
    if not secret or len(secret) < 32:
        raise RuntimeError(
            "JWT_SECRET_KEY must be set and at least 32 characters. "
            "Generate one with: openssl rand -hex 32"
        )
    return secret


def create_access_token(subject: str, role: str, extra: dict[str, Any] | None = None) -> str:
    """Create a short-lived access token (default 15 min)."""
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=_get_access_expire_minutes()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, _require_secret(), algorithm=_get_algorithm())


def create_refresh_token(subject: str) -> str:
    """Create a long-lived refresh token (default 7 days)."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=_get_refresh_expire_days()),
    }
    return jwt.encode(payload, _require_secret(), algorithm=_get_algorithm())


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises jwt.InvalidTokenError on failure."""
    return jwt.decode(token, _require_secret(), algorithms=[_get_algorithm()])
