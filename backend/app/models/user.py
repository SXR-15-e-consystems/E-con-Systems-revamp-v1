from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import PyObjectId


class UserRole(str, Enum):
    ADMIN = "admin"
    MARKETING = "marketing"
    INVENTORY = "inventory"


class UserInDB(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    id: PyObjectId = Field(default=None, alias="_id")
    email: EmailStr
    hashed_password: str
    role: UserRole
    is_active: bool = True
    failed_login_attempts: int = 0
    locked_until: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12, max_length=128)
    role: UserRole

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        errors: list[str] = []
        if not any(c.isupper() for c in v):
            errors.append("one uppercase letter")
        if not any(c.islower() for c in v):
            errors.append("one lowercase letter")
        if not any(c.isdigit() for c in v):
            errors.append("one digit")
        if not any(c in "!@#$%^&*()-_=+[]{}|;:',.<>?/`~" for c in v):
            errors.append("one special character")
        if errors:
            raise ValueError(f"Password must contain at least: {', '.join(errors)}")
        return v


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=12, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        errors: list[str] = []
        if not any(c.isupper() for c in v):
            errors.append("one uppercase letter")
        if not any(c.islower() for c in v):
            errors.append("one lowercase letter")
        if not any(c.isdigit() for c in v):
            errors.append("one digit")
        if not any(c in "!@#$%^&*()-_=+[]{}|;:',.<>?/`~" for c in v):
            errors.append("one special character")
        if errors:
            raise ValueError(f"Password must contain at least: {', '.join(errors)}")
        return v
