from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class BlockType(str, Enum):
    HERO = "Hero"
    RICH_TEXT = "RichText"
    PRODUCT_GRID = "ProductGrid"
    IMAGE_BANNER = "ImageBanner"
    VIDEO_EMBED = "VideoEmbed"
    FAQ = "FAQ"
    CTA_STRIP = "CTAStrip"
    TESTIMONIALS = "Testimonials"
    BANNER = "Banner"
    RELATED_CONTENT = "RelatedContent"
    TIMER = "Timer"
    FORM = "Form"
    CTA_BUTTON = "CTAButton"
    PRODUCT_TABS = "ProductTabs"
    PRODUCT_IMAGE_SLIDER = "ProductImageSlider"
    TAG = "Tag"
    HEADLINE = "Headline"
    PRODUCT_DESCRIPTION = "ProductDescription"
    SAMPLE_PRICE = "SamplePrice"
    IMAGE_ONLY = "ImageOnly"
    ACTION_BUTTON = "ActionButton"
    EVALUATION_SECTION = "EvaluationSection"
    # ── Hub page block types ──
    HUB_HERO = "HubHero"
    CATEGORY_FILTER = "CategoryFilter"
    VARIANTS_TABLE = "VariantsTable"
    VIDEO_GALLERY = "VideoGallery"
    FAQ_ACCORDION = "FAQAccordion"
    RELATED_BLOGS_GRID = "RelatedBlogsGrid"
    TARGET_APPLICATIONS = "TargetApplications"
    SPOTLIGHTS = "Spotlights"
    DOCUMENT_DOWNLOAD = "DocumentDownload"
    # ── Product page v2 block types ──
    PRODUCT_HERO = "ProductHero"
    PRODUCT_TABS_V2 = "ProductTabsV2"
    PRODUCT_HERO_NEW = "ProductHeroNew"
    NEWSLETTER_SUBSCRIBE = "NewsletterSubscribe"
    TARGETED_APPLICATIONS = "TargetedApplications"
    RESOURCE_TAB = "ResourceTab"
    FAQ_NEW = "FAQNew"


class BlockEnvelope(BaseModel):
    block_id: str = Field(
        ...,
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        description="UUIDv4 format",
    )
    component_id: str | None = Field(default=None, description="Reads from template component id")
    type: BlockType
    order: int = Field(..., ge=0)
    visible: bool = True
    data: dict[str, Any] = Field(...)
    content_status: str = Field(default="empty", description="empty or filled")
    # Per-block locale overrides: {"jp": {"title": "...", "subtitle": "..."}, ...}
    # Keys match the field names inside `data`. Blank/missing keys fall back to EN data.
    locales: dict[str, dict[str, Any]] = Field(default_factory=dict)

    @field_validator("data")
    @classmethod
    def validate_data_not_empty(cls, value: dict[str, Any]) -> dict[str, Any]:
        if not value:
            raise ValueError("Block data cannot be empty")
        return value
