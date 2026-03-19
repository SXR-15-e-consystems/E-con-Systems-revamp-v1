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


class BlockEnvelope(BaseModel):
    block_id: str = Field(
        ...,
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        description="UUIDv4 format",
    )
    type: BlockType
    order: int = Field(..., ge=0)
    visible: bool = True
    data: dict[str, Any] = Field(...)

    @field_validator("data")
    @classmethod
    def validate_data_not_empty(cls, value: dict[str, Any]) -> dict[str, Any]:
        if not value:
            raise ValueError("Block data cannot be empty")
        return value
