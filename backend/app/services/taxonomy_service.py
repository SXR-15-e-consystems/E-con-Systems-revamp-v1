"""Taxonomy service — CRUD for categories, filters, and product taxonomy.

URL generation pattern: /{category-slug}/{sub1-slug}/{sub2-slug}/{product-slug}
Sub2 is omitted when not present.
"""
import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.models.taxonomy import (
    BreadcrumbItem,
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    FilterCreate,
    FilterResponse,
    FilterUpdate,
    ProductCategoryEntry,
    ProductTaxonomyCreate,
    ProductTaxonomyResponse,
    ProductTaxonomyUpdate,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


class TaxonomyError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _slugify(text: str) -> str:
    """Convert a display name to a URL-safe slug."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def _to_category_response(doc: dict) -> CategoryResponse:
    return CategoryResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        slug=doc["slug"],
        sub_categories=doc.get("sub_categories", []),
        order=doc.get("order", 0),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


def _to_filter_response(doc: dict) -> FilterResponse:
    return FilterResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        slug=doc["slug"],
        group=doc.get("group", ""),
        order=doc.get("order", 0),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


def generate_url_and_breadcrumb(
    categories: list[ProductCategoryEntry],
    primary_category_id: str,
    product_slug: str,
    product_title: str,
) -> tuple[str, list[BreadcrumbItem]]:
    """Pure function — derives URL path and breadcrumb from taxonomy data.

    Returns (url_path, breadcrumb_items).
    url_path does NOT include a leading slash or domain.
    Breadcrumb does NOT include the 'Home' root item (added at render time).
    """
    if not primary_category_id or not categories:
        return product_slug, [BreadcrumbItem(label=product_title, href=f"/{product_slug}")]

    # Find the primary category entry
    primary: ProductCategoryEntry | None = None
    for entry in categories:
        if entry.category_id == primary_category_id:
            primary = entry
            break

    if primary is None:
        return product_slug, [BreadcrumbItem(label=product_title, href=f"/{product_slug}")]

    parts: list[str] = [primary.category_slug]
    crumbs: list[BreadcrumbItem] = [
        BreadcrumbItem(label=primary.category_name, href=f"/{primary.category_slug}")
    ]

    if primary.sub_category_1:
        parts.append(primary.sub_category_1.slug)
        path_so_far = "/" + "/".join(parts)
        crumbs.append(BreadcrumbItem(label=primary.sub_category_1.name, href=path_so_far))

        if primary.sub_category_2:
            parts.append(primary.sub_category_2.slug)
            path_so_far = "/" + "/".join(parts)
            crumbs.append(BreadcrumbItem(label=primary.sub_category_2.name, href=path_so_far))

    parts.append(product_slug)
    full_url = "/" + "/".join(parts)
    crumbs.append(BreadcrumbItem(label=product_title, href=full_url))

    return full_url, crumbs


def _build_taxonomy_response(
    doc: dict,
    filter_docs: list[dict],
) -> ProductTaxonomyResponse:
    gen_url = doc.get("generated_url", "")
    gen_bc = [BreadcrumbItem(**item) for item in doc.get("generated_breadcrumb", [])]
    custom_url = doc.get("custom_url")
    raw_custom_bc = doc.get("custom_breadcrumb")
    custom_bc = [BreadcrumbItem(**item) for item in raw_custom_bc] if raw_custom_bc is not None else None

    return ProductTaxonomyResponse(
        id=str(doc["_id"]),
        page_id=doc.get("page_id", ""),
        page_slug=doc["page_slug"],
        product_name=doc.get("product_name", ""),
        categories=[ProductCategoryEntry(**c) for c in doc.get("categories", [])],
        primary_category_id=doc.get("primary_category_id", ""),
        filter_ids=doc.get("filter_ids", []),
        filters=[_to_filter_response(f) for f in filter_docs],
        generated_url=gen_url,
        generated_breadcrumb=gen_bc,
        custom_url=custom_url,
        custom_breadcrumb=custom_bc,
        effective_url=custom_url if custom_url else gen_url,
        effective_breadcrumb=custom_bc if custom_bc is not None else gen_bc,
        previous_urls=doc.get("previous_urls", []),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def _hydrate_filters(db: Any, filter_ids: list[str]) -> list[dict]:
    """Fetch filter documents for a list of string IDs."""
    if not filter_ids:
        return []
    valid_ids = [ObjectId(fid) for fid in filter_ids if ObjectId.is_valid(fid)]
    if not valid_ids:
        return []
    cursor = db.taxonomy_filters.find({"_id": {"$in": valid_ids}})
    return await cursor.to_list(length=None)


# ── Category CRUD ─────────────────────────────────────────────────────────────

async def create_category(db: Any, data: CategoryCreate) -> CategoryResponse:
    now = datetime.now(timezone.utc)
    doc = {
        "name": data.name,
        "slug": data.slug or _slugify(data.name),
        "sub_categories": [sc.model_dump() for sc in data.sub_categories],
        "order": data.order,
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db.taxonomy_categories.insert_one(doc)
    except DuplicateKeyError:
        raise TaxonomyError("CONFLICT", f"Category slug '{data.slug}' already exists", 409)
    doc["_id"] = result.inserted_id
    return _to_category_response(doc)


async def list_categories(db: Any) -> list[CategoryResponse]:
    cursor = db.taxonomy_categories.find({}).sort("order", 1)
    docs = await cursor.to_list(length=None)
    return [_to_category_response(d) for d in docs]


async def get_category(db: Any, category_id: str) -> CategoryResponse:
    if not ObjectId.is_valid(category_id):
        raise TaxonomyError("NOT_FOUND", "Category not found", 404)
    doc = await db.taxonomy_categories.find_one({"_id": ObjectId(category_id)})
    if doc is None:
        raise TaxonomyError("NOT_FOUND", "Category not found", 404)
    return _to_category_response(doc)


async def update_category(db: Any, category_id: str, data: CategoryUpdate) -> CategoryResponse:
    if not ObjectId.is_valid(category_id):
        raise TaxonomyError("NOT_FOUND", "Category not found", 404)
    update_dict: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if data.name is not None:
        update_dict["name"] = data.name
    if data.slug is not None:
        update_dict["slug"] = data.slug
    if data.sub_categories is not None:
        update_dict["sub_categories"] = [sc.model_dump() for sc in data.sub_categories]
    if data.order is not None:
        update_dict["order"] = data.order

    result = await db.taxonomy_categories.update_one(
        {"_id": ObjectId(category_id)}, {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise TaxonomyError("NOT_FOUND", "Category not found", 404)
    updated = await db.taxonomy_categories.find_one({"_id": ObjectId(category_id)})
    return _to_category_response(updated)


async def delete_category(db: Any, category_id: str) -> None:
    if not ObjectId.is_valid(category_id):
        raise TaxonomyError("NOT_FOUND", "Category not found", 404)
    result = await db.taxonomy_categories.delete_one({"_id": ObjectId(category_id)})
    if result.deleted_count == 0:
        raise TaxonomyError("NOT_FOUND", "Category not found", 404)


# ── Filter CRUD ───────────────────────────────────────────────────────────────

async def create_filter(db: Any, data: FilterCreate) -> FilterResponse:
    now = datetime.now(timezone.utc)
    doc = {
        "name": data.name,
        "slug": data.slug or _slugify(data.name),
        "group": data.group,
        "order": data.order,
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db.taxonomy_filters.insert_one(doc)
    except DuplicateKeyError:
        raise TaxonomyError("CONFLICT", f"Filter slug '{data.slug}' already exists", 409)
    doc["_id"] = result.inserted_id
    return _to_filter_response(doc)


async def list_filters(db: Any) -> list[FilterResponse]:
    cursor = db.taxonomy_filters.find({}).sort([("group", 1), ("order", 1)])
    docs = await cursor.to_list(length=None)
    return [_to_filter_response(d) for d in docs]


async def get_filter(db: Any, filter_id: str) -> FilterResponse:
    if not ObjectId.is_valid(filter_id):
        raise TaxonomyError("NOT_FOUND", "Filter not found", 404)
    doc = await db.taxonomy_filters.find_one({"_id": ObjectId(filter_id)})
    if doc is None:
        raise TaxonomyError("NOT_FOUND", "Filter not found", 404)
    return _to_filter_response(doc)


async def update_filter(db: Any, filter_id: str, data: FilterUpdate) -> FilterResponse:
    if not ObjectId.is_valid(filter_id):
        raise TaxonomyError("NOT_FOUND", "Filter not found", 404)
    update_dict: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if data.name is not None:
        update_dict["name"] = data.name
    if data.slug is not None:
        update_dict["slug"] = data.slug
    if data.group is not None:
        update_dict["group"] = data.group
    if data.order is not None:
        update_dict["order"] = data.order

    result = await db.taxonomy_filters.update_one(
        {"_id": ObjectId(filter_id)}, {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise TaxonomyError("NOT_FOUND", "Filter not found", 404)
    updated = await db.taxonomy_filters.find_one({"_id": ObjectId(filter_id)})
    return _to_filter_response(updated)


async def delete_filter(db: Any, filter_id: str) -> None:
    if not ObjectId.is_valid(filter_id):
        raise TaxonomyError("NOT_FOUND", "Filter not found", 404)
    result = await db.taxonomy_filters.delete_one({"_id": ObjectId(filter_id)})
    if result.deleted_count == 0:
        raise TaxonomyError("NOT_FOUND", "Filter not found", 404)


# ── Product Taxonomy CRUD ─────────────────────────────────────────────────────

async def create_product_taxonomy(
    db: Any, data: ProductTaxonomyCreate, product_title: str = ""
) -> ProductTaxonomyResponse:
    now = datetime.now(timezone.utc)

    # Generate URL + breadcrumb from the category mapping
    gen_url, gen_bc = generate_url_and_breadcrumb(
        data.categories, data.primary_category_id, data.page_slug, product_title or data.product_name
    )

    doc = {
        "page_id": data.page_id,
        "page_slug": data.page_slug,
        "product_name": data.product_name,
        "categories": [c.model_dump() for c in data.categories],
        "primary_category_id": data.primary_category_id,
        "filter_ids": data.filter_ids,
        "generated_url": gen_url,
        "generated_breadcrumb": [bc.model_dump() for bc in gen_bc],
        "custom_url": data.custom_url,
        "custom_breadcrumb": [bc.model_dump() for bc in data.custom_breadcrumb] if data.custom_breadcrumb else None,
        "previous_urls": [],
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db.product_taxonomy.insert_one(doc)
    except DuplicateKeyError:
        raise TaxonomyError("CONFLICT", f"Taxonomy for page '{data.page_slug}' already exists", 409)
    doc["_id"] = result.inserted_id
    filter_docs = await _hydrate_filters(db, data.filter_ids)
    return _build_taxonomy_response(doc, filter_docs)


async def get_product_taxonomy(db: Any, page_slug: str) -> ProductTaxonomyResponse:
    doc = await db.product_taxonomy.find_one({"page_slug": page_slug})
    if doc is None:
        raise TaxonomyError("NOT_FOUND", f"No taxonomy found for page '{page_slug}'", 404)
    filter_docs = await _hydrate_filters(db, doc.get("filter_ids", []))
    return _build_taxonomy_response(doc, filter_docs)


async def list_product_taxonomies(db: Any, skip: int = 0, limit: int = 100) -> list[ProductTaxonomyResponse]:
    cursor = db.product_taxonomy.find({}).sort("page_slug", 1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=None)
    results = []
    for doc in docs:
        filter_docs = await _hydrate_filters(db, doc.get("filter_ids", []))
        results.append(_build_taxonomy_response(doc, filter_docs))
    return results


async def update_product_taxonomy(
    db: Any, page_slug: str, data: ProductTaxonomyUpdate, product_title: str = ""
) -> ProductTaxonomyResponse:
    doc = await db.product_taxonomy.find_one({"page_slug": page_slug})
    if doc is None:
        raise TaxonomyError("NOT_FOUND", f"No taxonomy found for page '{page_slug}'", 404)

    # Snapshot the current effective_url BEFORE any changes — used for history tracking
    old_custom_url = doc.get("custom_url")
    old_gen_url = doc.get("generated_url", "")
    old_effective_url = old_custom_url if old_custom_url else old_gen_url

    update_dict: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

    if data.product_name is not None:
        update_dict["product_name"] = data.product_name
    if data.categories is not None:
        update_dict["categories"] = [c.model_dump() for c in data.categories]
    if data.primary_category_id is not None:
        update_dict["primary_category_id"] = data.primary_category_id
    if data.filter_ids is not None:
        update_dict["filter_ids"] = data.filter_ids

    # Regenerate URL + breadcrumb after any category/primary changes
    categories = [ProductCategoryEntry(**c) for c in update_dict.get("categories", doc.get("categories", []))]
    primary_id = update_dict.get("primary_category_id", doc.get("primary_category_id", ""))
    slug = doc["page_slug"]
    title = product_title or update_dict.get("product_name", doc.get("product_name", slug))
    gen_url, gen_bc = generate_url_and_breadcrumb(categories, primary_id, slug, title)
    update_dict["generated_url"] = gen_url
    update_dict["generated_breadcrumb"] = [bc.model_dump() for bc in gen_bc]

    # Handle custom overrides
    if data.clear_custom_url:
        update_dict["custom_url"] = None
    elif data.custom_url is not None:
        update_dict["custom_url"] = data.custom_url

    if data.clear_custom_breadcrumb:
        update_dict["custom_breadcrumb"] = None
    elif data.custom_breadcrumb is not None:
        update_dict["custom_breadcrumb"] = [bc.model_dump() for bc in data.custom_breadcrumb]

    # Compute new effective_url and append old one to history if it changed
    new_custom_url = update_dict.get("custom_url", doc.get("custom_url"))
    new_gen_url = update_dict.get("generated_url", doc.get("generated_url", ""))
    new_effective_url = new_custom_url if new_custom_url else new_gen_url
    if old_effective_url and new_effective_url and old_effective_url != new_effective_url:
        existing_history: list[str] = doc.get("previous_urls", [])
        if old_effective_url not in existing_history:
            update_dict["previous_urls"] = existing_history + [old_effective_url]
        else:
            update_dict["previous_urls"] = existing_history

    await db.product_taxonomy.update_one({"page_slug": page_slug}, {"$set": update_dict})
    updated = await db.product_taxonomy.find_one({"page_slug": page_slug})
    filter_ids = updated.get("filter_ids", [])
    filter_docs = await _hydrate_filters(db, filter_ids)
    return _build_taxonomy_response(updated, filter_docs)


async def regenerate_taxonomy(db: Any, page_slug: str, product_title: str = "") -> ProductTaxonomyResponse:
    """Re-run URL + breadcrumb generation without changing any other data."""
    doc = await db.product_taxonomy.find_one({"page_slug": page_slug})
    if doc is None:
        raise TaxonomyError("NOT_FOUND", f"No taxonomy found for page '{page_slug}'", 404)

    # Snapshot old effective_url for history
    old_custom_url = doc.get("custom_url")
    old_gen_url = doc.get("generated_url", "")
    old_effective_url = old_custom_url if old_custom_url else old_gen_url

    categories = [ProductCategoryEntry(**c) for c in doc.get("categories", [])]
    primary_id = doc.get("primary_category_id", "")
    title = product_title or doc.get("product_name", page_slug)
    gen_url, gen_bc = generate_url_and_breadcrumb(categories, primary_id, page_slug, title)

    # New effective_url uses the same custom_url (regenerate doesn’t change custom overrides)
    new_effective_url = old_custom_url if old_custom_url else gen_url

    history_update: dict[str, Any] = {}
    if old_effective_url and new_effective_url and old_effective_url != new_effective_url:
        existing_history: list[str] = doc.get("previous_urls", [])
        history_update["previous_urls"] = (
            existing_history if old_effective_url in existing_history
            else existing_history + [old_effective_url]
        )

    await db.product_taxonomy.update_one(
        {"page_slug": page_slug},
        {"$set": {
            "generated_url": gen_url,
            "generated_breadcrumb": [bc.model_dump() for bc in gen_bc],
            "updated_at": datetime.now(timezone.utc),
            **history_update,
        }},
    )
    updated = await db.product_taxonomy.find_one({"page_slug": page_slug})
    filter_docs = await _hydrate_filters(db, updated.get("filter_ids", []))
    return _build_taxonomy_response(updated, filter_docs)


async def delete_product_taxonomy(db: Any, page_slug: str) -> None:
    result = await db.product_taxonomy.delete_one({"page_slug": page_slug})
    if result.deleted_count == 0:
        raise TaxonomyError("NOT_FOUND", f"No taxonomy found for page '{page_slug}'", 404)


async def ensure_taxonomy_indexes(db: Any) -> None:
    """Create indexes — idempotent, called at startup."""
    await db.taxonomy_categories.create_index("slug", unique=True)
    await db.taxonomy_categories.create_index("order")
    await db.taxonomy_filters.create_index("slug", unique=True)
    await db.taxonomy_filters.create_index([("group", 1), ("order", 1)])
    await db.product_taxonomy.create_index("page_slug", unique=True)
    logger.info("Taxonomy indexes ensured")
