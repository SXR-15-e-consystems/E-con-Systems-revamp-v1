from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase


async def revoke_token(db: AsyncIOMotorDatabase, jti: str, expires_at: datetime) -> None:
    """Add a token JTI to the blacklist. The TTL index auto-expires the entry."""
    await db.token_blacklist.update_one(
        {"jti": jti},
        {"$set": {"jti": jti, "expires_at": expires_at}},
        upsert=True,
    )


async def is_token_revoked(db: AsyncIOMotorDatabase, jti: str) -> bool:
    """Return True if the token JTI has been explicitly revoked."""
    doc = await db.token_blacklist.find_one({"jti": jti}, {"_id": 1})
    return doc is not None
