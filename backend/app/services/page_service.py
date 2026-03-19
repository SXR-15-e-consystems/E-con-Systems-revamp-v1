import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from app.models.block import BlockEnvelope, BlockType
from app.models.page import PageCreate, PageListItem, PageResponse, PageStatus, PageUpdate
from app.utils.validators import sanitize_html


class ServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _require_keys(data: dict[str, Any], keys: list[str]) -> None:
    for key in keys:
        if key not in data or data[key] in (None, ""):
            raise ServiceError("VALIDATION_ERROR", f"Missing required field: {key}", 400)


def _validate_url(url: Any, field_name: str) -> None:
    if not isinstance(url, str) or not (url.startswith("https://") or url.startswith("http://")):
        raise ServiceError("VALIDATION_ERROR", f"{field_name} must be a valid URL", 400)


def _validate_link(value: Any, field_name: str) -> None:
    if not isinstance(value, str):
        raise ServiceError("VALIDATION_ERROR", f"{field_name} must be a string", 400)
    if value.startswith("/"):
        return
    if value.startswith("https://") or value.startswith("http://"):
        return
    raise ServiceError(
        "VALIDATION_ERROR",
        f"{field_name} must be a relative path or HTTP/HTTPS URL",
        400,
    )


def _validate_hero(data: dict[str, Any]) -> None:
    _require_keys(data, ["title", "image_url"])
    _validate_url(data["image_url"], "image_url")
    if "cta_link" in data and data["cta_link"]:
        _validate_link(data["cta_link"], "cta_link")


def _validate_rich_text(data: dict[str, Any]) -> None:
    _require_keys(data, ["html"])
    html = data["html"]
    if not isinstance(html, str):
        raise ServiceError("VALIDATION_ERROR", "html must be a string", 400)
    if len(html) > 50_000:
        raise ServiceError("VALIDATION_ERROR", "RichText html exceeds 50,000 character limit", 400)
    data["html"] = sanitize_html(html)


def _validate_product_grid(data: dict[str, Any]) -> None:
    _require_keys(data, ["heading", "category", "max_items"])
    max_items = data["max_items"]
    if not isinstance(max_items, int) or not (1 <= max_items <= 50):
        raise ServiceError("VALIDATION_ERROR", "max_items must be integer 1-50", 400)


def _validate_image_banner(data: dict[str, Any]) -> None:
    _require_keys(data, ["image_url", "alt_text"])
    _validate_url(data["image_url"], "image_url")
    alt_text = data["alt_text"]
    if not isinstance(alt_text, str) or len(alt_text) > 300:
        raise ServiceError("VALIDATION_ERROR", "alt_text must be <= 300 chars", 400)


def _validate_video_embed(data: dict[str, Any]) -> None:
    _require_keys(data, ["provider", "video_id", "title"])
    provider = data["provider"]
    video_id = data["video_id"]
    if provider not in ("youtube", "vimeo"):
        raise ServiceError("VALIDATION_ERROR", "provider must be 'youtube' or 'vimeo'", 400)
    if not isinstance(video_id, str) or not re.match(r"^[a-zA-Z0-9_-]+$", video_id):
        raise ServiceError("VALIDATION_ERROR", "video_id must be alphanumeric", 400)


def _validate_faq(data: dict[str, Any]) -> None:
    _require_keys(data, ["heading", "items"])
    items = data["items"]
    if not isinstance(items, list) or not (1 <= len(items) <= 30):
        raise ServiceError("VALIDATION_ERROR", "FAQ items must be array of 1-30 items", 400)
    for item in items:
        if not isinstance(item, dict) or "question" not in item or "answer" not in item:
            raise ServiceError(
                "VALIDATION_ERROR",
                "Each FAQ item must have 'question' and 'answer'",
                400,
            )


def _validate_cta_strip(data: dict[str, Any]) -> None:
    _require_keys(data, ["text", "button_label", "button_link"])
    _validate_link(data["button_link"], "button_link")
    bg_color = data.get("bg_color")
    if bg_color and (not isinstance(bg_color, str) or not re.match(r"^#[0-9a-fA-F]{6}$", bg_color)):
        raise ServiceError("VALIDATION_ERROR", "bg_color must be hex format #RRGGBB", 400)


def _validate_testimonials(data: dict[str, Any]) -> None:
    _require_keys(data, ["items"])
    items = data["items"]
    if not isinstance(items, list) or not (1 <= len(items) <= 20):
        raise ServiceError("VALIDATION_ERROR", "Testimonials items must be array of 1-20 items", 400)
    for item in items:
        if not isinstance(item, dict) or "quote" not in item or "author" not in item:
            raise ServiceError(
                "VALIDATION_ERROR",
                "Each testimonial must have 'quote' and 'author'",
                400,
            )


BLOCK_VALIDATORS = {
    BlockType.HERO: _validate_hero,
    BlockType.RICH_TEXT: _validate_rich_text,
    BlockType.PRODUCT_GRID: _validate_product_grid,
    BlockType.IMAGE_BANNER: _validate_image_banner,
    BlockType.VIDEO_EMBED: _validate_video_embed,
    BlockType.FAQ: _validate_faq,
    BlockType.CTA_STRIP: _validate_cta_strip,
    BlockType.TESTIMONIALS: _validate_testimonials,
}


def validate_blocks(blocks: list[BlockEnvelope]) -> list[BlockEnvelope]:
    normalized: list[BlockEnvelope] = []
    for index, block in enumerate(blocks):
        block.order = index
        validator = BLOCK_VALIDATORS.get(block.type)
        if validator:
            validator(block.data)
        normalized.append(block)
    return normalized


def _to_page_response(document: dict[str, Any]) -> PageResponse:
    return PageResponse(
        id=str(document["_id"]),
        slug=document["slug"],
        title=document["title"],
        meta_description=document.get("meta_description", ""),
        og_image_url=document.get("og_image_url"),
        status=document["status"],
        blocks=document.get("blocks", []),
        created_by=document.get("created_by", "poc-user"),
        created_at=document["created_at"],
        updated_at=document["updated_at"],
    )


async def list_pages(db: Any) -> list[PageListItem]:
    cursor = db.pages.find({}, {"slug": 1, "title": 1, "status": 1, "updated_at": 1}).sort(
        "updated_at", -1
    )
    items: list[PageListItem] = []
    async for row in cursor:
        items.append(
            PageListItem(
                id=str(row["_id"]),
                slug=row["slug"],
                title=row["title"],
                status=row["status"],
                updated_at=row["updated_at"],
            )
        )
    return items


async def get_page(db: Any, slug: str) -> PageResponse:
    normalized_slug = slug.strip("/").lower()
    document = await db.pages.find_one({"slug": normalized_slug})
    if document is None:
        raise ServiceError("NOT_FOUND", "Page not found", 404)
    return _to_page_response(document)


async def create_page(db: Any, payload: PageCreate) -> PageResponse:
    now = datetime.now(timezone.utc)
    slug = payload.slug.strip("/").lower()

    existing = await db.pages.find_one({"slug": slug}, {"_id": 1})
    if existing is not None:
        raise ServiceError("CONFLICT", "Slug already exists", 409)

    document: dict[str, Any] = {
        "slug": slug,
        "title": payload.title,
        "meta_description": payload.meta_description,
        "og_image_url": payload.og_image_url,
        "status": PageStatus.DRAFT.value,
        "blocks": [],
        "created_by": "poc-user",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.pages.insert_one(document)
    document["_id"] = result.inserted_id
    return _to_page_response(document)


async def update_page(db: Any, slug: str, payload: PageUpdate) -> PageResponse:
    normalized_slug = slug.strip("/").lower()
    existing = await db.pages.find_one({"slug": normalized_slug})
    if existing is None:
        raise ServiceError("NOT_FOUND", "Page not found", 404)

    update_dict: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if payload.title is not None:
        update_dict["title"] = payload.title
    if payload.meta_description is not None:
        update_dict["meta_description"] = payload.meta_description
    if payload.og_image_url is not None:
        update_dict["og_image_url"] = payload.og_image_url
    if payload.status is not None:
        update_dict["status"] = payload.status.value
    if payload.blocks is not None:
        blocks = validate_blocks(payload.blocks)
        update_dict["blocks"] = [block.model_dump() for block in blocks]

    await db.pages.update_one({"_id": ObjectId(existing["_id"])}, {"$set": update_dict})
    updated = await db.pages.find_one({"_id": ObjectId(existing["_id"])})
    if updated is None:
        raise ServiceError("INTERNAL_ERROR", "Page update failed", 500)
    return _to_page_response(updated)


async def delete_page(db: Any, slug: str) -> None:
    normalized_slug = slug.strip("/").lower()
    result = await db.pages.delete_one({"slug": normalized_slug})
    if result.deleted_count == 0:
        raise ServiceError("NOT_FOUND", "Page not found", 404)


async def list_public_pages(db: Any) -> list[PageListItem]:
    cursor = db.pages.find(
        {"status": PageStatus.PUBLISHED.value},
        {"slug": 1, "title": 1, "status": 1, "updated_at": 1},
    ).sort("updated_at", -1)
    items: list[PageListItem] = []
    async for row in cursor:
        items.append(
            PageListItem(
                id=str(row["_id"]),
                slug=row["slug"],
                title=row["title"],
                status=row["status"],
                updated_at=row["updated_at"],
            )
        )
    return items


async def get_public_page(db: Any, slug: str) -> PageResponse:
    normalized_slug = slug.strip("/").lower()
    document = await db.pages.find_one(
        {"slug": normalized_slug, "status": PageStatus.PUBLISHED.value}
    )
    if document is None:
        raise ServiceError("NOT_FOUND", "Page not found", 404)

    visible_blocks = [block for block in document.get("blocks", []) if block.get("visible", True)]
    document["blocks"] = visible_blocks
    return _to_page_response(document)
