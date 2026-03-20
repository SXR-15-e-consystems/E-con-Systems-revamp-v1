from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.models import PyObjectId


class TemplateStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class GridPlacement(BaseModel):
    col_start: int = Field(..., ge=1, le=13)
    col_end: int = Field(..., ge=1, le=13)
    row_start: int = Field(..., ge=1)
    row_end: int = Field(..., ge=1)


class GridConfig(BaseModel):
    columns: int = Field(default=12, ge=1, le=24)
    row_height: int = Field(default=40, ge=10, le=200)
    gap: int = Field(default=16, ge=0, le=100)


class ResponsiveOverrides(BaseModel):
    tablet: GridPlacement | None = None
    mobile: GridPlacement | None = None

class TemplateComponent(BaseModel):
    component_id: str = Field(
        ...,
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        description="UUIDv4 format",
    )
    type: str
    label: str = Field(default="", max_length=200)
    grid_placement: GridPlacement
    meta: dict[str, Any] = Field(default_factory=dict)
    required: bool = True
    order: int = Field(default=0, ge=0)
    responsive_overrides: ResponsiveOverrides | None = None


class TemplateInDB(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    id: PyObjectId = Field(default=None, alias="_id")
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(
        ...,
        min_length=1,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    description: str = Field(default="", max_length=1000)
    thumbnail_url: str | None = None
    category: str = Field(default="general", max_length=100)
    grid: GridConfig = Field(default_factory=GridConfig)
    components: list[TemplateComponent] = Field(default_factory=list)
    status: TemplateStatus = TemplateStatus.ACTIVE
    created_by: str = "designer"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()


class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(
        ...,
        min_length=1,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )
    description: str = Field(default="", max_length=1000)
    thumbnail_url: str | None = None
    category: str = Field(default="general", max_length=100)
    grid: GridConfig = Field(default_factory=GridConfig)
    components: list[TemplateComponent] = Field(default_factory=list)

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip().lower()


class TemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    thumbnail_url: str | None = None
    category: str | None = Field(default=None, max_length=100)
    grid: GridConfig | None = None
    components: list[TemplateComponent] | None = None
    status: TemplateStatus | None = None


class TemplateResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    thumbnail_url: str | None
    category: str
    grid: GridConfig
    components: list[TemplateComponent]
    status: TemplateStatus
    created_by: str
    created_at: datetime
    updated_at: datetime


class TemplateListItem(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    category: str
    status: TemplateStatus
    component_count: int
    updated_at: datetime
