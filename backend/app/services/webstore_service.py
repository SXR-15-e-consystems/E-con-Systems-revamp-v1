"""Webstore service — reads/writes webstore_config collection and extracts product data from pages."""
from typing import Any

from app.models.webstore import (
    OrderRowSummary,
    WebstoreConfig,
    WebstoreCountryConfigResponse,
    WebstoreDistributor,
    WebstoreProductItem,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

_COLLECTION = "webstore_config"
_DOC_ID = "global"  # single-document config


# ── Config CRUD ────────────────────────────────────────────────────────────────

async def get_webstore_config(db: Any) -> WebstoreConfig:
    doc = await db[_COLLECTION].find_one({"_id": _DOC_ID})
    if not doc:
        return WebstoreConfig()
    doc.pop("_id", None)
    return WebstoreConfig(**doc)


async def save_webstore_config(db: Any, config: WebstoreConfig) -> WebstoreConfig:
    doc = config.model_dump()
    await db[_COLLECTION].replace_one({"_id": _DOC_ID}, {"_id": _DOC_ID, **doc}, upsert=True)
    return config


# ── Country lookup ─────────────────────────────────────────────────────────────

async def get_country_config(db: Any, country_code: str) -> WebstoreCountryConfigResponse:
    config = await get_webstore_config(db)
    upper = country_code.upper()
    entry = next((c for c in config.countries if c.country_code.upper() == upper), None)
    if entry:
        cart = entry.cart_url.strip() or config.default_cart_url
        dist = entry.distributor if entry.purchase_mode == "contact" else None
        return WebstoreCountryConfigResponse(
            country=upper,
            purchase_mode=entry.purchase_mode,
            cart_url=cart,
            distributor=dist,
            message=entry.distributor.message if (entry.purchase_mode == "contact" and entry.distributor) else "",
        )
    # Default: allow purchase with global cart URL
    return WebstoreCountryConfigResponse(
        country=upper,
        purchase_mode="buy",
        cart_url=config.default_cart_url,
        distributor=None,
        message="",
    )


# ── Product data extraction ────────────────────────────────────────────────────

def _extract_webstore_item(page_doc: dict, config: WebstoreConfig, taxonomy_category: str = "", url_path: str = "") -> WebstoreProductItem | None:
    """Extract WebstoreProductItem from a raw MongoDB page document."""
    blocks: list[dict] = page_doc.get("blocks", [])

    # Pull data from ProductHeroNew block
    hero_content: dict = {}
    for block in blocks:
        if block.get("type") == "ProductHeroNew":
            data = block.get("data", {})
            # data may be flat or nested under 'content'
            hero_content = data.get("content", data)
            break

    images = hero_content.get("images", [])
    raw_override = (page_doc.get("webstore_image_url") or "").strip()
    # Image: manual override → first image from hero → og_image_url fallback
    if raw_override:
        image_url = raw_override
    elif images:
        image_url = images[0].get("image_url", "")
    else:
        image_url = page_doc.get("og_image_url") or ""

    # Title: explicit CMS override → hero block title → page title
    webstore_title_override = (page_doc.get("webstore_title") or "").strip()
    hero_title = str(hero_content.get("title", "") or "").strip()
    sku_badge = str(hero_content.get("sku_badge", "") or "").strip()

    variant_options: list[str] = hero_content.get("variant_options", [])
    highlights: list[str] = hero_content.get("highlights", [])[:5]
    sample_price: str = str(hero_content.get("sample_price", ""))
    sample_currency: str = str(hero_content.get("sample_currency", "USD"))
    volume_price: str = str(hero_content.get("volume_price", ""))

    # Pull order rows from ProductTabsV2 order_table tab
    order_rows: list[OrderRowSummary] = []
    for block in blocks:
        if block.get("type") in ("ProductTabsV2", "ProductTabs"):
            data = block.get("data", {})
            content = data.get("content", data)
            tabs: list[dict] = content.get("tabs", [])
            tab_data: dict = content.get("tab_data", {})
            for tab in tabs:
                if tab.get("content_type") == "order_table" and tab.get("enabled", True):
                    rows = tab_data.get(tab["tab_id"], {}).get("rows", [])
                    for row in rows:
                        nop_id = str(row.get("nop_product_id", "") or "")
                        part_no = str(row.get("part_no", ""))
                        # Build full cart URL: base?ProductName={part_no}&quantity=1
                        cart_url_str = ""
                        if part_no:
                            base = config.default_cart_url.rstrip("?& ")
                            cart_url_str = f"{base}?ProductName={part_no}&quantity=1"
                        kit: list[str] = row.get("kit_contents", [])
                        if isinstance(kit, str):
                            kit = [kit]
                        order_rows.append(OrderRowSummary(
                            part_no=part_no,
                            kit_contents=kit,
                            price=str(row.get("price", "")),
                            nop_product_id=nop_id,
                            cart_url=cart_url_str,
                        ))
                    break

    raw_features = page_doc.get("webstore_features", [])
    from app.models.webstore import WebstoreFeature
    features = []
    for f in raw_features:
        if isinstance(f, dict):
            features.append(WebstoreFeature(label=f.get("label", ""), value=f.get("value", "")))

    return WebstoreProductItem(
        slug=page_doc["slug"],
        title=page_doc.get("title", ""),
        product_name=page_doc.get("product_name", ""),
        hero_title=hero_title,
        sku_badge=sku_badge,
        webstore_category=taxonomy_category,
        webstore_priority=int(page_doc.get("webstore_priority", 0) or 0),
        webstore_features=features,
        webstore_image_url=image_url,
        variant_options=variant_options,
        highlights=highlights,
        sample_price=sample_price,
        sample_currency=sample_currency,
        volume_price=volume_price,
        order_rows=order_rows,
        meta_description=page_doc.get("meta_description", ""),
        og_image_url=page_doc.get("og_image_url"),
        webstore_title=webstore_title_override,
        url_path=url_path,
    )


async def list_webstore_products(db: Any) -> list[WebstoreProductItem]:
    """Return all published pages that have webstore_enabled=True, sorted by priority."""
    config = await get_webstore_config(db)
    cursor = db["pages"].find(
        {"status": "published", "webstore_enabled": True},
        sort=[("webstore_priority", 1), ("title", 1)],
    )
    page_docs: list[dict] = []
    async for doc in cursor:
        page_docs.append(doc)

    # Batch-fetch taxonomy docs to get category from the configured taxonomy hierarchy
    if page_docs:
        slugs = [d["slug"] for d in page_docs]
        taxonomy_cursor = db["product_taxonomy"].find({"page_slug": {"$in": slugs}})
        slug_to_category: dict[str, str] = {}
        slug_to_url_path: dict[str, str] = {}
        async for tdoc in taxonomy_cursor:
            slug = tdoc.get("page_slug", "")
            # Resolve primary category name
            primary_id = tdoc.get("primary_category_id", "")
            categories: list[dict] = tdoc.get("categories", [])
            cat_name = ""
            for cat in categories:
                if cat.get("category_id") == primary_id:
                    cat_name = cat.get("category_name", "")
                    break
            if not cat_name and categories:
                cat_name = categories[0].get("category_name", "")
            slug_to_category[slug] = cat_name
            # effective_url is not stored; compute it the same way _build_taxonomy_response does
            custom_url = tdoc.get("custom_url") or ""
            generated_url = tdoc.get("generated_url") or ""
            slug_to_url_path[slug] = custom_url if custom_url else generated_url
    else:
        slug_to_category = {}
        slug_to_url_path = {}

    items: list[WebstoreProductItem] = []
    for doc in page_docs:
        try:
            taxonomy_cat = slug_to_category.get(doc.get("slug", ""), "")
            taxonomy_url = slug_to_url_path.get(doc.get("slug", ""), "")
            item = _extract_webstore_item(doc, config, taxonomy_category=taxonomy_cat, url_path=taxonomy_url)
            if item:
                items.append(item)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to extract webstore item for slug=%s: %s", doc.get("slug"), exc)
    return items
