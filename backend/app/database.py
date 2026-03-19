import os
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: Any = None
_db: Any = None


async def connect_db() -> None:
    global _client, _db
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "econ_platform_poc")
    _client = AsyncIOMotorClient(uri, maxPoolSize=50, minPoolSize=10)
    _db = _client[db_name]
    await _ensure_indexes()


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()


def get_db() -> Any:
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return _db


async def _ensure_indexes() -> None:
    db = get_db()
    await db.pages.create_index("slug", unique=True)
    await db.pages.create_index("status")
    await db.pages.create_index("updated_at")
