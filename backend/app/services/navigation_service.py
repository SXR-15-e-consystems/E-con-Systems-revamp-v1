"""Navigation service — CRUD for the single navigation config document."""

from datetime import datetime, timezone
from typing import Any

from app.models.navigation import (
    NavigationConfig,
    NavigationPublicResponse,
    NavigationResponse,
    NavigationStatus,
    NavigationUpdate,
)
from app.services.page_service import ServiceError
from app.utils.logger import get_logger

logger = get_logger(__name__)

COLLECTION = "navigation"


def _to_response(doc: dict[str, Any]) -> NavigationResponse:
    return NavigationResponse(
        header=doc.get("header", {}),
        menus=doc.get("menus", []),
        status=doc.get("status", NavigationStatus.DRAFT.value),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
        updated_by=doc.get("updated_by", ""),
    )


def _to_public_response(doc: dict[str, Any]) -> NavigationPublicResponse:
    return NavigationPublicResponse(
        header=doc.get("header", {}),
        menus=doc.get("menus", []),
    )


async def _get_or_create_draft(db: Any) -> dict[str, Any]:
    """Get the navigation doc, creating a default draft if none exists."""
    doc = await db[COLLECTION].find_one({})
    if doc is not None:
        return doc

    now = datetime.now(timezone.utc)
    default = NavigationConfig(
        status=NavigationStatus.DRAFT,
        updated_at=now,
        updated_by="system",
    )
    insert_doc = default.model_dump()
    result = await db[COLLECTION].insert_one(insert_doc)
    insert_doc["_id"] = result.inserted_id
    return insert_doc


async def get_navigation(db: Any) -> NavigationResponse:
    """Get the navigation config for CMS editing (draft or published)."""
    doc = await _get_or_create_draft(db)
    return _to_response(doc)


async def update_navigation(
    db: Any,
    payload: NavigationUpdate,
    updated_by: str,
) -> NavigationResponse:
    """Update navigation config fields. Sets status back to draft."""
    doc = await _get_or_create_draft(db)
    now = datetime.now(timezone.utc)

    update_fields: dict[str, Any] = {
        "updated_at": now,
        "updated_by": updated_by,
        "status": NavigationStatus.DRAFT.value,
    }

    if payload.header is not None:
        update_fields["header"] = payload.header.model_dump()
    if payload.menus is not None:
        update_fields["menus"] = [m.model_dump() for m in payload.menus]

    await db[COLLECTION].update_one(
        {"_id": doc["_id"]},
        {"$set": update_fields},
    )

    updated = await db[COLLECTION].find_one({"_id": doc["_id"]})
    if updated is None:
        raise ServiceError("INTERNAL_ERROR", "Navigation update failed", 500)
    return _to_response(updated)


async def publish_navigation(db: Any, published_by: str) -> NavigationResponse:
    """Mark navigation as published."""
    doc = await _get_or_create_draft(db)
    now = datetime.now(timezone.utc)

    await db[COLLECTION].update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "status": NavigationStatus.PUBLISHED.value,
            "updated_at": now,
            "updated_by": published_by,
        }},
    )

    updated = await db[COLLECTION].find_one({"_id": doc["_id"]})
    if updated is None:
        raise ServiceError("INTERNAL_ERROR", "Navigation publish failed", 500)
    return _to_response(updated)


async def get_public_navigation(db: Any) -> NavigationPublicResponse:
    """Get published navigation for the public website."""
    doc = await db[COLLECTION].find_one(
        {"status": NavigationStatus.PUBLISHED.value},
    )
    if doc is None:
        # Fallback: return whatever exists (even draft) so site doesn't break
        doc = await db[COLLECTION].find_one({})
        if doc is None:
            # Return empty defaults
            default = NavigationConfig()
            return NavigationPublicResponse(
                header=default.header,
                menus=default.menus,
            )

    # Filter to visible menus only, sorted by order
    menus = doc.get("menus", [])
    visible_menus = sorted(
        [m for m in menus if m.get("visible", True)],
        key=lambda m: m.get("order", 0),
    )

    return NavigationPublicResponse(
        header=doc.get("header", {}),
        menus=visible_menus,
    )
