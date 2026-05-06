from datetime import datetime, timedelta, timezone
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import UserCreate, UserResponse, UserRole, UserUpdate
from app.security.hashing import hash_password


class UserServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _user_to_response(user: dict[str, Any]) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
        updated_at=user["updated_at"],
    )


async def create_user(db: AsyncIOMotorDatabase, payload: UserCreate) -> UserResponse:
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise UserServiceError("CONFLICT", "A user with this email already exists", 409)

    now = datetime.now(timezone.utc)
    doc = {
        "email": payload.email.lower(),
        "hashed_password": hash_password(payload.password),
        "role": payload.role.value,
        "is_active": True,
        "failed_login_attempts": 0,
        "locked_until": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _user_to_response(doc)


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> dict[str, Any] | None:
    return await db.users.find_one({"email": email.lower()})


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> dict[str, Any] | None:
    if not ObjectId.is_valid(user_id):
        return None
    return await db.users.find_one({"_id": ObjectId(user_id)})


async def list_users(db: AsyncIOMotorDatabase) -> list[UserResponse]:
    cursor = db.users.find().sort("created_at", -1)
    users = await cursor.to_list(length=500)
    return [_user_to_response(u) for u in users]


async def update_user(db: AsyncIOMotorDatabase, user_id: str, payload: UserUpdate) -> UserResponse:
    if not ObjectId.is_valid(user_id):
        raise UserServiceError("NOT_FOUND", "User not found", 404)

    updates: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if payload.role is not None:
        updates["role"] = payload.role.value
    if payload.is_active is not None:
        updates["is_active"] = payload.is_active

    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": updates},
        return_document=True,
    )
    if result is None:
        raise UserServiceError("NOT_FOUND", "User not found", 404)
    return _user_to_response(result)


async def deactivate_user(db: AsyncIOMotorDatabase, user_id: str) -> UserResponse:
    if not ObjectId.is_valid(user_id):
        raise UserServiceError("NOT_FOUND", "User not found", 404)

    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if result is None:
        raise UserServiceError("NOT_FOUND", "User not found", 404)
    return _user_to_response(result)


async def increment_failed_attempts(db: AsyncIOMotorDatabase, user_id: ObjectId) -> int:
    """Increment failed login attempts. Returns new count. Locks account at 10 failures."""
    result = await db.users.find_one_and_update(
        {"_id": user_id},
        {"$inc": {"failed_login_attempts": 1}},
        return_document=True,
    )
    if result is None:
        return 0

    attempts = result["failed_login_attempts"]
    if attempts >= 10:
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"locked_until": datetime.now(timezone.utc) + timedelta(minutes=15)}},
        )
    return attempts


async def reset_failed_attempts(db: AsyncIOMotorDatabase, user_id: ObjectId) -> None:
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"failed_login_attempts": 0, "locked_until": None}},
    )


async def change_password(db: AsyncIOMotorDatabase, user_id: ObjectId, new_hashed_password: str) -> None:
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {
            "hashed_password": new_hashed_password,
            "updated_at": datetime.now(timezone.utc),
            "password_changed_at": datetime.now(timezone.utc),
        }},
    )
