"""Navigation service — CRUD for the single navigation config document."""

from datetime import datetime, timezone
from typing import Any

from app.models.navigation import (
    FooterConfig,
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
        footer=doc.get("footer", FooterConfig().model_dump()),
        menus=doc.get("menus", []),
        status=doc.get("status", NavigationStatus.DRAFT.value),
        updated_at=doc.get("updated_at", datetime.now(timezone.utc)),
        updated_by=doc.get("updated_by", ""),
        locales=doc.get("locales", {}),
    )


def _to_public_response(doc: dict[str, Any], locale: str = "en") -> NavigationPublicResponse:
    """Build public response, applying flat-key locale overrides when locale != en."""
    import copy
    header = copy.deepcopy(doc.get("header", {}))
    footer = copy.deepcopy(doc.get("footer", FooterConfig().model_dump()))
    menus = copy.deepcopy(doc.get("menus", []))
    locales_store = doc.get("locales", {})

    normalized = (locale or "en").strip().lower()
    if normalized not in ("en", ""):
        flat = locales_store.get(normalized, {})
        if flat:
            # Header overrides
            if flat.get("h_phone") and isinstance(header.get("phone"), dict):
                header["phone"]["label"] = flat["h_phone"]
            if flat.get("h_contact") and isinstance(header.get("contact_link"), dict):
                header["contact_link"]["label"] = flat["h_contact"]
            if flat.get("h_cta") and isinstance(header.get("cta_button"), dict):
                header["cta_button"]["label"] = flat["h_cta"]

            # Footer overrides: f_heading, f_placeholder, f_btn, f_copyright,
            # fc_{col_id} (column title), fci_{col_id}_{idx} (item label)
            if isinstance(footer, dict):
                sub = footer.get("subscribe") or {}
                if flat.get("f_heading") and isinstance(sub, dict):
                    sub["heading"] = flat["f_heading"]
                if flat.get("f_placeholder") and isinstance(sub, dict):
                    sub["placeholder"] = flat["f_placeholder"]
                if flat.get("f_btn") and isinstance(sub, dict):
                    sub["button_label"] = flat["f_btn"]
                if flat.get("f_copyright"):
                    footer["copyright_text"] = flat["f_copyright"]
                for col in footer.get("columns", []):
                    cid = col.get("col_id", "")
                    if flat.get(f"fc_{cid}"):
                        col["title"] = flat[f"fc_{cid}"]
                    for idx, item in enumerate(col.get("items", [])):
                        key = f"fci_{cid}_{idx}"
                        if flat.get(key):
                            item["label"] = flat[key]

            # Menu tree overrides
            for menu in menus:
                mid = menu.get("menu_id", "")
                if flat.get(f"m_{mid}"):
                    menu["label"] = flat[f"m_{mid}"]
                # Promo banner
                pb = menu.get("promo_banner") or {}
                if pb:
                    if flat.get(f"pb_{mid}_title"): pb["title"] = flat[f"pb_{mid}_title"]
                    if flat.get(f"pb_{mid}_desc"): pb["description"] = flat[f"pb_{mid}_desc"]
                    if flat.get(f"pb_{mid}_cta"): pb["cta_label"] = flat[f"pb_{mid}_cta"]
                # Tabs
                for tab in menu.get("tabs", []):
                    tid = tab.get("tab_id", "")
                    if flat.get(f"t_{tid}"): tab["label"] = flat[f"t_{tid}"]
                    bs = tab.get("bottom_section") or {}
                    if bs and flat.get(f"bs_{tid}"): bs["title"] = flat[f"bs_{tid}"]
                    for col in tab.get("columns", []):
                        cid = col.get("col_id", "")
                        if flat.get(f"c_{cid}"): col["title"] = flat[f"c_{cid}"]
                        for idx, item in enumerate(col.get("items", [])):
                            key = f"ci_{cid}_{idx}"
                            if flat.get(key): item["label"] = flat[key]
                # Top-level columns
                for col in menu.get("columns", []):
                    cid = col.get("col_id", "")
                    if flat.get(f"c_{cid}"): col["title"] = flat[f"c_{cid}"]
                    for idx, item in enumerate(col.get("items", [])):
                        key = f"ci_{cid}_{idx}"
                        if flat.get(key): item["label"] = flat[key]
                # Dropdown children
                for child in menu.get("children", []):
                    did = child.get("item_id", "")
                    if flat.get(f"d_{did}"): child["label"] = flat[f"d_{did}"]

    return NavigationPublicResponse(
        header=header,
        footer=footer,
        menus=menus,
        locales=locales_store,
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
    if payload.footer is not None:
        update_fields["footer"] = payload.footer.model_dump()
    if payload.menus is not None:
        update_fields["menus"] = [m.model_dump() for m in payload.menus]
    if payload.locales is not None:
        update_fields["locales"] = payload.locales

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


async def get_public_navigation(db: Any, locale: str = "en") -> NavigationPublicResponse:
    """Get published navigation for the public website, with optional locale overlay."""
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
    doc["menus"] = visible_menus
    return _to_public_response(doc, locale)
