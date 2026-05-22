from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.models import PyObjectId
from app.models.block import BlockEnvelope
from app.models.webstore import WebstoreFeature


class PageStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class LocaleVariant(BaseModel):
    """Translated content fields for a single locale.

    Fields left empty inherit the base (English) value at render time.
    """
    title: str = Field(default="", max_length=200)
    meta_description: str = Field(default="", max_length=320)
    og_title: str = Field(default="", max_length=200)
    og_description: str = Field(default="", max_length=320)


class PageInDB(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    id: PyObjectId = Field(default=None, alias="_id")
    slug: str = Field(
        ...,
        min_length=1,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*$",
    )
    title: str = Field(..., min_length=1, max_length=200)
    meta_description: str = Field(default="", max_length=320)
    og_image_url: str | None = None
    product_name: str = Field(default="", max_length=200)
    template_id: str | None = None
    status: PageStatus = PageStatus.DRAFT
    blocks: list[BlockEnvelope] = Field(default_factory=list)
    # SEO / Open Graph
    og_title: str = Field(default="", max_length=200)
    og_description: str = Field(default="", max_length=320)
    og_type: str = Field(default="website", max_length=50)
    twitter_card: str = Field(default="summary_large_image", max_length=50)
    twitter_site: str = Field(default="", max_length=100)
    schema_json: str = Field(default="", max_length=50000)
    canonical_url: str | None = None
    # Custom JS injection
    custom_js_head: str = Field(default="", max_length=100000)
    custom_js_body: str = Field(default="", max_length=100000)
    # Locale variants (keys: "jp", "ko", "de", etc.)
    locales: dict[str, Any] = Field(default_factory=dict)
    # Webstore settings
    webstore_enabled: bool = Field(default=False)
    webstore_category: str = Field(default="", max_length=200)
    webstore_priority: int = Field(default=0)
    webstore_features: list[WebstoreFeature] = Field(default_factory=list)
    webstore_image_url: str = Field(default="", max_length=1000)
    webstore_title: str = Field(default="", max_length=200)
    created_by: str = "poc-user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip("/").lower()


class PageCreate(BaseModel):
    slug: str = Field(
        ...,
        min_length=1,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*$",
    )
    title: str = Field(..., min_length=1, max_length=200)
    meta_description: str = Field(default="", max_length=320)
    og_image_url: str | None = None
    product_name: str = Field(default="", max_length=200)
    template_id: str | None = None
    # SEO / Open Graph
    og_title: str = Field(default="", max_length=200)
    og_description: str = Field(default="", max_length=320)
    og_type: str = Field(default="website", max_length=50)
    twitter_card: str = Field(default="summary_large_image", max_length=50)
    twitter_site: str = Field(default="", max_length=100)
    schema_json: str = Field(default="", max_length=50000)
    canonical_url: str | None = None
    # Custom JS injection
    custom_js_head: str = Field(default="", max_length=100000)
    custom_js_body: str = Field(default="", max_length=100000)
    # Locale variants
    locales: dict[str, Any] = Field(default_factory=dict)
    # Webstore settings
    webstore_enabled: bool = Field(default=False)
    webstore_category: str = Field(default="", max_length=200)
    webstore_priority: int = Field(default=0)
    webstore_features: list[WebstoreFeature] = Field(default_factory=list)
    webstore_image_url: str = Field(default="", max_length=1000)
    webstore_title: str = Field(default="", max_length=200)

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip("/").lower()


class PageUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    meta_description: str | None = Field(default=None, max_length=320)
    og_image_url: str | None = None
    product_name: str | None = Field(default=None, max_length=200)
    status: PageStatus | None = None
    blocks: list[BlockEnvelope] | None = None
    # SEO / Open Graph
    og_title: str | None = Field(default=None, max_length=200)
    og_description: str | None = Field(default=None, max_length=320)
    og_type: str | None = Field(default=None, max_length=50)
    twitter_card: str | None = Field(default=None, max_length=50)
    twitter_site: str | None = Field(default=None, max_length=100)
    schema_json: str | None = Field(default=None, max_length=50000)
    canonical_url: str | None = None
    # Custom JS injection
    custom_js_head: str | None = Field(default=None, max_length=100000)
    custom_js_body: str | None = Field(default=None, max_length=100000)
    # Locale variants
    locales: dict[str, Any] | None = None
    # Webstore settings
    webstore_enabled: bool | None = None
    webstore_category: str | None = Field(default=None, max_length=200)
    webstore_priority: int | None = None
    webstore_features: list[WebstoreFeature] | None = None
    webstore_image_url: str | None = Field(default=None, max_length=1000)
    webstore_title: str | None = Field(default=None, max_length=200)


class TemplateConfigForPage(BaseModel):
    """Embedded template config for public rendering of template-based pages."""
    grid: dict[str, Any]  # GridConfig
    components: list[dict[str, Any]]  # TemplateComponent list


class PageResponse(BaseModel):
    id: str
    slug: str
    title: str
    meta_description: str
    og_image_url: str | None
    product_name: str = ""
    template_id: str | None = None
    template_config: TemplateConfigForPage | None = None  # Populated when template_id is set
    status: PageStatus
    blocks: list[BlockEnvelope]
    # SEO / Open Graph
    og_title: str = ""
    og_description: str = ""
    og_type: str = "website"
    twitter_card: str = "summary_large_image"
    twitter_site: str = ""
    schema_json: str = ""
    canonical_url: str | None = None
    # Custom JS injection
    custom_js_head: str = ""
    custom_js_body: str = ""
    # Locale variants
    locales: dict[str, Any] = Field(default_factory=dict)
    # Webstore settings
    webstore_enabled: bool = False
    webstore_category: str = ""
    webstore_priority: int = 0
    webstore_features: list[WebstoreFeature] = Field(default_factory=list)
    webstore_image_url: str = ""
    webstore_title: str = ""
    created_by: str
    created_at: datetime
    updated_at: datetime


class PageListItem(BaseModel):
    id: str
    slug: str
    title: str
    status: PageStatus
    updated_at: datetime


class PageSummary(BaseModel):
    """Lightweight page summary for product picker dropdowns in hub pages."""
    id: str
    slug: str
    title: str
    meta_description: str
    og_image_url: str | None
    product_name: str = ""
    status: PageStatus
