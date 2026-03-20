from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field, field_validator

from app.models import PyObjectId
from app.models.block import BlockEnvelope


class PageStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


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
    template_id: str | None = None
    status: PageStatus = PageStatus.DRAFT
    blocks: list[BlockEnvelope] = Field(default_factory=list)
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
    template_id: str | None = None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip("/").lower()


class PageUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    meta_description: str | None = Field(default=None, max_length=320)
    og_image_url: str | None = None
    status: PageStatus | None = None
    blocks: list[BlockEnvelope] | None = None


class PageResponse(BaseModel):
    id: str
    slug: str
    title: str
    meta_description: str
    og_image_url: str | None
    template_id: str | None = None
    status: PageStatus
    blocks: list[BlockEnvelope]
    created_by: str
    created_at: datetime
    updated_at: datetime


class PageListItem(BaseModel):
    id: str
    slug: str
    title: str
    status: PageStatus
    updated_at: datetime
