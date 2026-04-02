from datetime import datetime, timezone
from typing import Any
import uuid

from bson import ObjectId

from app.models.template import (
    TemplateCreate,
    TemplateListItem,
    TemplateResponse,
    TemplateStatus,
    TemplateUpdate,
)
from app.services.page_service import ServiceError
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _to_template_response(document: dict[str, Any]) -> TemplateResponse:
    return TemplateResponse(
        id=str(document["_id"]),
        name=document["name"],
        slug=document["slug"],
        description=document.get("description", ""),
        thumbnail_url=document.get("thumbnail_url"),
        category=document.get("category", "general"),
        grid=document.get("grid", {"columns": 12, "row_height": 40, "gap": 16}),
        components=document.get("components", []),
        status=document.get("status", "active"),
        created_by=document.get("created_by", "designer"),
        created_at=document["created_at"],
        updated_at=document["updated_at"],
    )


async def list_templates(db: Any) -> list[TemplateListItem]:
    cursor = db.templates.find(
        {},
        {
            "name": 1,
            "slug": 1,
            "description": 1,
            "category": 1,
            "status": 1,
            "components": 1,
            "updated_at": 1,
        },
    ).sort("updated_at", -1)
    items: list[TemplateListItem] = []
    async for row in cursor:
        items.append(
            TemplateListItem(
                id=str(row["_id"]),
                name=row["name"],
                slug=row["slug"],
                description=row.get("description", ""),
                category=row.get("category", "general"),
                status=row.get("status", "active"),
                component_count=len(row.get("components", [])),
                updated_at=row["updated_at"],
            )
        )
    return items


async def get_template(db: Any, template_id: str) -> TemplateResponse:
    if not ObjectId.is_valid(template_id):
        raise ServiceError("VALIDATION_ERROR", "Invalid template ID", 400)
    document = await db.templates.find_one({"_id": ObjectId(template_id)})
    if document is None:
        raise ServiceError("NOT_FOUND", "Template not found", 404)
    return _to_template_response(document)


async def get_template_by_slug(db: Any, slug: str) -> TemplateResponse:
    document = await db.templates.find_one({"slug": slug.strip().lower()})
    if document is None:
        raise ServiceError("NOT_FOUND", "Template not found", 404)
    return _to_template_response(document)


async def create_template(db: Any, payload: TemplateCreate) -> TemplateResponse:
    now = datetime.now(timezone.utc)
    slug = payload.slug.strip().lower()

    existing = await db.templates.find_one({"slug": slug}, {"_id": 1})
    if existing is not None:
        raise ServiceError("CONFLICT", "Template slug already exists", 409)

    document: dict[str, Any] = {
        "name": payload.name,
        "slug": slug,
        "description": payload.description,
        "thumbnail_url": payload.thumbnail_url,
        "category": payload.category,
        "grid": payload.grid.model_dump(),
        "components": [comp.model_dump() for comp in payload.components],
        "status": TemplateStatus.ACTIVE.value,
        "created_by": "designer",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.templates.insert_one(document)
    document["_id"] = result.inserted_id
    return _to_template_response(document)


async def update_template(
    db: Any, template_id: str, payload: TemplateUpdate
) -> TemplateResponse:
    if not ObjectId.is_valid(template_id):
        raise ServiceError("VALIDATION_ERROR", "Invalid template ID", 400)
    existing = await db.templates.find_one({"_id": ObjectId(template_id)})
    if existing is None:
        raise ServiceError("NOT_FOUND", "Template not found", 404)

    update_dict: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if payload.name is not None:
        update_dict["name"] = payload.name
    if payload.description is not None:
        update_dict["description"] = payload.description
    if payload.thumbnail_url is not None:
        update_dict["thumbnail_url"] = payload.thumbnail_url
    if payload.category is not None:
        update_dict["category"] = payload.category
    if payload.grid is not None:
        update_dict["grid"] = payload.grid.model_dump()
    if payload.components is not None:
        update_dict["components"] = [comp.model_dump() for comp in payload.components]
    if payload.status is not None:
        update_dict["status"] = payload.status.value

    await db.templates.update_one(
        {"_id": ObjectId(template_id)}, {"$set": update_dict}
    )
    updated = await db.templates.find_one({"_id": ObjectId(template_id)})
    if updated is None:
        raise ServiceError("INTERNAL_ERROR", "Template update failed", 500)

    # Propagate structural changes to pages using this template
    if payload.components is not None:
        await _sync_pages_with_template(db, template_id, updated.get("components", []))

    return _to_template_response(updated)


async def _sync_pages_with_template(
    db: Any, template_id: str, template_components: list[dict[str, Any]]
) -> None:
    """Sync all pages linked to this template when components change.

    For each linked page:
    - New components → add empty blocks (preserves user content).
    - Removed components → delete blocks (component no longer in template).
    - Existing components → update order and meta from template.
    """
    cursor = db.pages.find({"template_id": template_id})
    pages_updated = 0

    async for page in cursor:
        existing_blocks: list[dict[str, Any]] = page.get("blocks", [])

        synced_blocks: list[dict[str, Any]] = []

        # Walk through template components in order to build synced block list
        for order_idx, comp in enumerate(template_components):
            cid = comp["component_id"]
            matching_block = next(
                (b for b in existing_blocks if b.get("component_id") == cid), None
            )

            if matching_block is not None:
                # Existing block — update order and meta, preserve content
                matching_block["order"] = order_idx
                if "data" in matching_block and isinstance(matching_block["data"], dict):
                    matching_block["data"]["meta"] = comp.get("meta", {})
                synced_blocks.append(matching_block)
            else:
                # New component — create empty block
                synced_blocks.append({
                    "block_id": str(uuid.uuid4()),
                    "component_id": cid,
                    "type": comp["type"],
                    "order": order_idx,
                    "visible": True,
                    "data": {"meta": comp.get("meta", {}), "content": {}},
                    "content_status": "empty",
                })

        # Blocks with no component_id (manually added) keep their position at the end
        non_template_blocks = [
            b for b in existing_blocks if not b.get("component_id")
        ]
        for extra_block in non_template_blocks:
            extra_block["order"] = len(synced_blocks)
            synced_blocks.append(extra_block)

        await db.pages.update_one(
            {"_id": page["_id"]},
            {"$set": {
                "blocks": synced_blocks,
                "updated_at": datetime.now(timezone.utc),
            }},
        )
        pages_updated += 1

    if pages_updated > 0:
        logger.info(
            "Template %s propagated to %d pages (%d components)",
            template_id,
            pages_updated,
            len(template_components),
        )


async def delete_template(db: Any, template_id: str) -> None:
    if not ObjectId.is_valid(template_id):
        raise ServiceError("VALIDATION_ERROR", "Invalid template ID", 400)
    result = await db.templates.delete_one({"_id": ObjectId(template_id)})
    if result.deleted_count == 0:
        raise ServiceError("NOT_FOUND", "Template not found", 404)
