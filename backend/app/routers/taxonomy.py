"""Taxonomy router — CMS (auth required) + public endpoints."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_db
from app.models.taxonomy import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    FilterCreate,
    FilterResponse,
    FilterUpdate,
    ProductTaxonomyCreate,
    ProductTaxonomyResponse,
    ProductTaxonomyUpdate,
)
from app.models.user import UserRole
from app.security.dependencies import require_role
from app.services.taxonomy_service import (
    TaxonomyError,
    create_category,
    create_filter,
    create_product_taxonomy,
    delete_category,
    delete_filter,
    delete_product_taxonomy,
    get_category,
    get_filter,
    get_product_taxonomy,
    list_categories,
    list_filters,
    list_product_taxonomies,
    regenerate_taxonomy,
    update_category,
    update_filter,
    update_product_taxonomy,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

cms_router = APIRouter()
public_router = APIRouter()

_ALL_CMS = [UserRole.ADMIN, UserRole.MARKETING, UserRole.INVENTORY]
_EDITORS = [UserRole.ADMIN, UserRole.MARKETING]
_ADMIN_ONLY = [UserRole.ADMIN]


def _err(exc: TaxonomyError) -> dict:
    return {"error": {"code": exc.code, "message": exc.message, "details": []}}


# ── CMS: Categories ───────────────────────────────────────────────────────────

@cms_router.get("/taxonomy/categories", response_model=list[CategoryResponse])
async def cms_list_categories(
    current_user: dict = Depends(require_role(_ALL_CMS)),
    db: Any = Depends(get_db),
) -> list[CategoryResponse]:
    return await list_categories(db)


@cms_router.get("/taxonomy/categories/{category_id}", response_model=CategoryResponse)
async def cms_get_category(
    category_id: str,
    current_user: dict = Depends(require_role(_ALL_CMS)),
    db: Any = Depends(get_db),
) -> CategoryResponse:
    try:
        return await get_category(db, category_id)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.post("/taxonomy/categories", response_model=CategoryResponse, status_code=201)
async def cms_create_category(
    payload: CategoryCreate,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> CategoryResponse:
    try:
        return await create_category(db, payload)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.put("/taxonomy/categories/{category_id}", response_model=CategoryResponse)
async def cms_update_category(
    category_id: str,
    payload: CategoryUpdate,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> CategoryResponse:
    try:
        return await update_category(db, category_id, payload)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.delete("/taxonomy/categories/{category_id}", status_code=204)
async def cms_delete_category(
    category_id: str,
    current_user: dict = Depends(require_role(_ADMIN_ONLY)),
    db: Any = Depends(get_db),
) -> None:
    try:
        await delete_category(db, category_id)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


# ── CMS: Filters ──────────────────────────────────────────────────────────────

@cms_router.get("/taxonomy/filters", response_model=list[FilterResponse])
async def cms_list_filters(
    current_user: dict = Depends(require_role(_ALL_CMS)),
    db: Any = Depends(get_db),
) -> list[FilterResponse]:
    return await list_filters(db)


@cms_router.get("/taxonomy/filters/{filter_id}", response_model=FilterResponse)
async def cms_get_filter(
    filter_id: str,
    current_user: dict = Depends(require_role(_ALL_CMS)),
    db: Any = Depends(get_db),
) -> FilterResponse:
    try:
        return await get_filter(db, filter_id)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.post("/taxonomy/filters", response_model=FilterResponse, status_code=201)
async def cms_create_filter(
    payload: FilterCreate,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> FilterResponse:
    try:
        return await create_filter(db, payload)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.put("/taxonomy/filters/{filter_id}", response_model=FilterResponse)
async def cms_update_filter(
    filter_id: str,
    payload: FilterUpdate,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> FilterResponse:
    try:
        return await update_filter(db, filter_id, payload)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.delete("/taxonomy/filters/{filter_id}", status_code=204)
async def cms_delete_filter(
    filter_id: str,
    current_user: dict = Depends(require_role(_ADMIN_ONLY)),
    db: Any = Depends(get_db),
) -> None:
    try:
        await delete_filter(db, filter_id)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


# ── CMS: Product Taxonomy ─────────────────────────────────────────────────────

@cms_router.get("/taxonomy/products", response_model=list[ProductTaxonomyResponse])
async def cms_list_product_taxonomies(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: dict = Depends(require_role(_ALL_CMS)),
    db: Any = Depends(get_db),
) -> list[ProductTaxonomyResponse]:
    return await list_product_taxonomies(db, skip=skip, limit=limit)


@cms_router.get("/taxonomy/products/{page_slug:path}", response_model=ProductTaxonomyResponse)
async def cms_get_product_taxonomy(
    page_slug: str,
    current_user: dict = Depends(require_role(_ALL_CMS)),
    db: Any = Depends(get_db),
) -> ProductTaxonomyResponse:
    try:
        return await get_product_taxonomy(db, page_slug)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.post("/taxonomy/products", response_model=ProductTaxonomyResponse, status_code=201)
async def cms_create_product_taxonomy(
    payload: ProductTaxonomyCreate,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> ProductTaxonomyResponse:
    # Fetch the product title from the page for use in URL/breadcrumb generation
    product_title = ""
    try:
        page = await db.pages.find_one({"slug": payload.page_slug}, {"title": 1, "product_name": 1})
        if page:
            product_title = page.get("product_name") or page.get("title") or ""
    except Exception:
        pass

    try:
        return await create_product_taxonomy(db, payload, product_title)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.put("/taxonomy/products/{page_slug:path}", response_model=ProductTaxonomyResponse)
async def cms_update_product_taxonomy(
    page_slug: str,
    payload: ProductTaxonomyUpdate,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> ProductTaxonomyResponse:
    product_title = ""
    try:
        page = await db.pages.find_one({"slug": page_slug}, {"title": 1, "product_name": 1})
        if page:
            product_title = page.get("product_name") or page.get("title") or ""
    except Exception:
        pass

    try:
        return await update_product_taxonomy(db, page_slug, payload, product_title)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.post("/taxonomy/products/{page_slug:path}/regenerate", response_model=ProductTaxonomyResponse)
async def cms_regenerate_taxonomy(
    page_slug: str,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> ProductTaxonomyResponse:
    """Re-run URL + breadcrumb generation from current category data."""
    product_title = ""
    try:
        page = await db.pages.find_one({"slug": page_slug}, {"title": 1, "product_name": 1})
        if page:
            product_title = page.get("product_name") or page.get("title") or ""
    except Exception:
        pass

    try:
        return await regenerate_taxonomy(db, page_slug, product_title)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@cms_router.delete("/taxonomy/products/{page_slug:path}", status_code=204)
async def cms_delete_product_taxonomy(
    page_slug: str,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> None:
    try:
        await delete_product_taxonomy(db, page_slug)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


# ── Public: taxonomy (consumed by Next.js for breadcrumbs + filters) ──────────

@public_router.get("/taxonomy/{page_slug:path}", response_model=ProductTaxonomyResponse)
async def public_get_taxonomy(
    page_slug: str,
    db: Any = Depends(get_db),
) -> ProductTaxonomyResponse:
    """Returns effective URL + breadcrumb + filters for a product page.
    Returns 404 (gracefully handled by Next.js) if no taxonomy configured yet.
    """
    try:
        return await get_product_taxonomy(db, page_slug)
    except TaxonomyError as exc:
        raise HTTPException(status_code=exc.status_code, detail=_err(exc)) from exc


@public_router.get("/taxonomy-categories", response_model=list[CategoryResponse])
async def public_list_categories(db: Any = Depends(get_db)) -> list[CategoryResponse]:
    """All categories (used by hub/selector pages for filtering UI)."""
    return await list_categories(db)


@public_router.get("/taxonomy-filters", response_model=list[FilterResponse])
async def public_list_filters(db: Any = Depends(get_db)) -> list[FilterResponse]:
    """All filters (used by hub/selector pages for filter chips)."""
    return await list_filters(db)
