"""Taxonomy models — Categories, Filters, and Product Taxonomy mappings.

Collections:
  taxonomy_categories  — category tree (embedded sub-categories)
  taxonomy_filters     — global filter/feature tags
  product_taxonomy     — per-page category + filter mappings
"""
import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from app.models import PyObjectId


# ── Sub-category helpers ──────────────────────────────────────────────────────

class SubCategory2(BaseModel):
    """Leaf-level sub-category (optional, e.g. 'AGX ORIN' under 'NVIDIA Camera')."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)


class SubCategory1(BaseModel):
    """First-level sub-category (e.g. 'Stereo' under 'USB 3.0 Camera')."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    sub_categories: list[SubCategory2] = Field(default_factory=list)


# ── Category (top-level) ──────────────────────────────────────────────────────

class CategoryInDB(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    id: PyObjectId = Field(default=None, alias="_id")
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    sub_categories: list[SubCategory1] = Field(default_factory=list)
    order: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    sub_categories: list[SubCategory1] = Field(default_factory=list)
    order: int = Field(default=0, ge=0)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=200)
    sub_categories: list[SubCategory1] | None = None
    order: int | None = Field(default=None, ge=0)


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    sub_categories: list[SubCategory1]
    order: int
    created_at: datetime
    updated_at: datetime


# ── Filter (global feature/filter tags) ──────────────────────────────────────

class FilterInDB(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    id: PyObjectId = Field(default=None, alias="_id")
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    group: str = Field(default="", max_length=100)  # e.g. "Shutter Type"
    order: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FilterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    group: str = Field(default="", max_length=100)
    order: int = Field(default=0, ge=0)


class FilterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=200)
    group: str | None = Field(default=None, max_length=100)
    order: int | None = Field(default=None, ge=0)


class FilterResponse(BaseModel):
    id: str
    name: str
    slug: str
    group: str
    order: int
    created_at: datetime
    updated_at: datetime


# ── Product Taxonomy ──────────────────────────────────────────────────────────

class BreadcrumbItem(BaseModel):
    label: str
    href: str = ""


class ProductCategoryEntry(BaseModel):
    """One category assignment for a product (possibly with sub-categories)."""
    category_id: str
    category_name: str
    category_slug: str
    sub_category_1: SubCategory1 | None = None
    sub_category_2: SubCategory2 | None = None


class ProductTaxonomyInDB(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    id: PyObjectId = Field(default=None, alias="_id")
    page_id: str = ""                        # FK → pages._id (denormalised)
    page_slug: str                           # unique identifier
    product_name: str = ""                   # denormalised for display
    categories: list[ProductCategoryEntry] = Field(default_factory=list)
    primary_category_id: str = ""            # controls URL + breadcrumb
    filter_ids: list[str] = Field(default_factory=list)  # FK → taxonomy_filters._id

    # Auto-generated (regenerated on demand)
    generated_url: str = ""
    generated_breadcrumb: list[BreadcrumbItem] = Field(default_factory=list)

    # Manual overrides — None means "use generated"
    custom_url: str | None = None
    custom_breadcrumb: list[BreadcrumbItem] | None = None

    # History of previously-valid effective_urls (used for 301 redirects on the web)
    previous_urls: list[str] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductTaxonomyCreate(BaseModel):
    page_id: str = ""
    page_slug: str = Field(..., min_length=1, max_length=200)
    product_name: str = Field(default="", max_length=200)
    categories: list[ProductCategoryEntry] = Field(default_factory=list)
    primary_category_id: str = ""
    filter_ids: list[str] = Field(default_factory=list)
    custom_url: str | None = None
    custom_breadcrumb: list[BreadcrumbItem] | None = None


class ProductTaxonomyUpdate(BaseModel):
    product_name: str | None = Field(default=None, max_length=200)
    categories: list[ProductCategoryEntry] | None = None
    primary_category_id: str | None = None
    filter_ids: list[str] | None = None
    custom_url: str | None = None
    custom_breadcrumb: list[BreadcrumbItem] | None = None
    # Explicitly clear overrides by passing clear_custom_url / clear_custom_breadcrumb = True
    clear_custom_url: bool = False
    clear_custom_breadcrumb: bool = False


class ProductTaxonomyResponse(BaseModel):
    id: str
    page_id: str
    page_slug: str
    product_name: str
    categories: list[ProductCategoryEntry]
    primary_category_id: str
    filter_ids: list[str]
    filters: list[FilterResponse] = Field(default_factory=list)  # hydrated
    generated_url: str
    generated_breadcrumb: list[BreadcrumbItem]
    custom_url: str | None
    custom_breadcrumb: list[BreadcrumbItem] | None
    # Computed effective values (what the web actually uses)
    effective_url: str
    effective_breadcrumb: list[BreadcrumbItem]
    # History of previously-valid effective_urls (for redirect resolution on the web)
    previous_urls: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
