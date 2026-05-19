import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from app.models.block import BlockEnvelope, BlockType
from app.models.page import (
    PageCreate,
    PageListItem,
    PageResponse,
    PageStatus,
    PageSummary,
    PageUpdate,
)
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
    # Hub page blocks use template-based meta+content structure;
    # validation is handled by Pydantic in the frontend types.
    # No server-side deep validation needed beyond envelope check.
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


async def _to_page_response(document: dict[str, Any], db: Any) -> PageResponse:
    template_config = None
    template_id = document.get("template_id")
    
    # If page was created from a template, embed the template config for public rendering
    if template_id:
        try:
            from bson import ObjectId
            from app.models.page import TemplateConfigForPage
            
            template = await db.templates.find_one({"_id": ObjectId(template_id)})
            if template:
                template_config = TemplateConfigForPage(
                    grid=template.get("grid", {}),
                    components=template.get("components", []),
                )
        except Exception:
            # If template fetch fails, continue without it (graceful degradation)
            pass
    
    return PageResponse(
        id=str(document["_id"]),
        slug=document["slug"],
        title=document["title"],
        meta_description=document.get("meta_description", ""),
        og_image_url=document.get("og_image_url"),
        product_name=document.get("product_name", ""),
        template_id=template_id,
        template_config=template_config,
        status=document["status"],
        blocks=document.get("blocks", []),
        og_title=document.get("og_title", ""),
        og_description=document.get("og_description", ""),
        og_type=document.get("og_type", "website"),
        twitter_card=document.get("twitter_card", "summary_large_image"),
        twitter_site=document.get("twitter_site", ""),
        schema_json=document.get("schema_json", ""),
        canonical_url=document.get("canonical_url"),
        custom_js_head=document.get("custom_js_head", ""),
        custom_js_body=document.get("custom_js_body", ""),
        locales=document.get("locales", {}),
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


async def list_page_summaries(db: Any) -> list[PageSummary]:
    """Lightweight summaries for product picker dropdowns in hub pages."""
    cursor = db.pages.find(
        {},
        {"slug": 1, "title": 1, "meta_description": 1, "og_image_url": 1, "status": 1},
    ).sort("title", 1)
    items: list[PageSummary] = []
    async for row in cursor:
        items.append(
            PageSummary(
                id=str(row["_id"]),
                slug=row["slug"],
                title=row["title"],
                meta_description=row.get("meta_description", ""),
                og_image_url=row.get("og_image_url"),
                status=row["status"],
            )
        )
    return items


async def get_page(db: Any, slug: str) -> PageResponse:
    normalized_slug = slug.strip("/").lower()
    document = await db.pages.find_one({"slug": normalized_slug})
    if document is None:
        raise ServiceError("NOT_FOUND", "Page not found", 404)
    return await _to_page_response(document, db)


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
        "product_name": payload.product_name if hasattr(payload, "product_name") and payload.product_name else "",
        "template_id": payload.template_id if hasattr(payload, "template_id") else None,
        "status": PageStatus.DRAFT.value,
        "blocks": [],
        "og_title": payload.og_title if hasattr(payload, "og_title") else "",
        "og_description": payload.og_description if hasattr(payload, "og_description") else "",
        "og_type": payload.og_type if hasattr(payload, "og_type") else "website",
        "twitter_card": payload.twitter_card if hasattr(payload, "twitter_card") else "summary_large_image",
        "twitter_site": payload.twitter_site if hasattr(payload, "twitter_site") else "",
        "schema_json": payload.schema_json if hasattr(payload, "schema_json") else "",
        "canonical_url": payload.canonical_url if hasattr(payload, "canonical_url") else None,
        "custom_js_head": payload.custom_js_head if hasattr(payload, "custom_js_head") else "",
        "custom_js_body": payload.custom_js_body if hasattr(payload, "custom_js_body") else "",
        "locales": {},
        "created_by": "poc-user",
        "created_at": now,
        "updated_at": now,
    }

    if payload.template_id:
        from bson import ObjectId
        if not ObjectId.is_valid(payload.template_id):
            raise ServiceError("VALIDATION_ERROR", "Invalid template ID", 400)
        template = await db.templates.find_one({"_id": ObjectId(payload.template_id)})
        if not template:
            raise ServiceError("NOT_FOUND", "Template not found", 404)
        
        # Clone components into boilerplate blocks
        import uuid
        blocks = []
        for i, comp in enumerate(template.get("components", [])):
            blocks.append({
                "block_id": str(uuid.uuid4()),
                "component_id": comp["component_id"],
                "type": comp["type"],
                "order": i,
                "visible": True,
                "data": {"meta": comp.get("meta", {}), "content": {}},
                "content_status": "empty"
            })
        document["blocks"] = blocks

    result = await db.pages.insert_one(document)
    document["_id"] = result.inserted_id
    return await _to_page_response(document, db)


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
    if payload.product_name is not None:
        update_dict["product_name"] = payload.product_name
    if payload.og_image_url is not None:
        update_dict["og_image_url"] = payload.og_image_url
    if payload.status is not None:
        update_dict["status"] = payload.status.value
    if payload.blocks is not None:
        blocks = validate_blocks(payload.blocks)
        update_dict["blocks"] = [block.model_dump() for block in blocks]
    if payload.og_title is not None:
        update_dict["og_title"] = payload.og_title
    if payload.og_description is not None:
        update_dict["og_description"] = payload.og_description
    if payload.og_type is not None:
        update_dict["og_type"] = payload.og_type
    if payload.twitter_card is not None:
        update_dict["twitter_card"] = payload.twitter_card
    if payload.twitter_site is not None:
        update_dict["twitter_site"] = payload.twitter_site
    if payload.schema_json is not None:
        update_dict["schema_json"] = payload.schema_json
    if payload.canonical_url is not None:
        update_dict["canonical_url"] = payload.canonical_url
    if payload.custom_js_head is not None:
        update_dict["custom_js_head"] = payload.custom_js_head
    if payload.custom_js_body is not None:
        update_dict["custom_js_body"] = payload.custom_js_body
    if payload.locales is not None:
        update_dict["locales"] = payload.locales

    await db.pages.update_one({"_id": ObjectId(existing["_id"])}, {"$set": update_dict})
    updated = await db.pages.find_one({"_id": ObjectId(existing["_id"])})
    if updated is None:
        raise ServiceError("INTERNAL_ERROR", "Page update failed", 500)
    return await _to_page_response(updated, db)


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


async def get_public_page(db: Any, slug: str, locale: str = "en") -> PageResponse:
    normalized_slug = slug.strip("/").lower()
    document = await db.pages.find_one(
        {"slug": normalized_slug, "status": PageStatus.PUBLISHED.value}
    )
    if document is None:
        raise ServiceError("NOT_FOUND", "Page not found", 404)

    # Apply locale variant overlay — silently falls back to EN if locale missing
    normalized_locale = (locale or "en").strip().lower()
    if normalized_locale not in ("en", ""):
        variant = document.get("locales", {}).get(normalized_locale)
        if variant and isinstance(variant, dict):
            if variant.get("title"):
                document["title"] = variant["title"]
            if variant.get("meta_description"):
                document["meta_description"] = variant["meta_description"]
            if variant.get("og_title"):
                document["og_title"] = variant["og_title"]
            if variant.get("og_description"):
                document["og_description"] = variant["og_description"]

    visible_blocks = [block for block in document.get("blocks", []) if block.get("visible", True)]
    # Apply per-block locale overlay when a non-EN locale is requested
    if normalized_locale not in ("en", ""):
        for block in visible_blocks:
            block_variant = block.get("locales", {}).get(normalized_locale)
            if block_variant and isinstance(block_variant, dict):
                # Shallow-merge: only override keys that are non-empty strings
                merged = dict(block.get("data", {}))
                for key, val in block_variant.items():
                    if val not in (None, ""):
                        merged[key] = val
                block["data"] = merged
    document["blocks"] = visible_blocks
    return await _to_page_response(document, db)


async def get_public_pages_batch(db: Any, slugs: list[str]) -> list[PageResponse]:
    """Fetch multiple published pages by slug list. Returns in requested order."""
    normalized = [s.strip("/").lower() for s in slugs]
    cursor = db.pages.find(
        {"slug": {"$in": normalized}, "status": PageStatus.PUBLISHED.value}
    )
    docs_by_slug: dict[str, dict[str, Any]] = {}
    async for doc in cursor:
        visible_blocks = [b for b in doc.get("blocks", []) if b.get("visible", True)]
        doc["blocks"] = visible_blocks
        docs_by_slug[doc["slug"]] = doc

    results: list[PageResponse] = []
    for slug in normalized:
        if slug in docs_by_slug:
            results.append(await _to_page_response(docs_by_slug[slug], db))
    return results
