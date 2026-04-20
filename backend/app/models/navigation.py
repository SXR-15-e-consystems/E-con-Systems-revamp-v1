"""Navigation configuration models — single-document pattern."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


# ─────────────────────────────────────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────────────────────────────────────

class MenuType(str, Enum):
    MEGA_TABBED = "mega_tabbed"
    MEGA_COLUMNS = "mega_columns"
    DROPDOWN = "dropdown"
    NESTED = "nested"
    LINK = "link"


class LinkTarget(str, Enum):
    SELF = "_self"
    BLANK = "_blank"


class NavigationStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


# ─────────────────────────────────────────────────────────────────────────────
# Shared sub-models
# ─────────────────────────────────────────────────────────────────────────────

class MenuItem(BaseModel):
    """A single clickable link inside a column or dropdown."""
    label: str = Field(..., min_length=1, max_length=200)
    url: str = Field(..., max_length=500)
    icon_url: str | None = None
    target: LinkTarget = LinkTarget.SELF

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if v.startswith(("javascript:", "data:")):
            raise ValueError("Unsafe URL scheme")
        return v


class MenuColumn(BaseModel):
    """A column of links within a mega menu or tab."""
    col_id: str = Field(..., min_length=1, max_length=100)
    title: str = Field(default="", max_length=200)
    icon_url: str | None = None
    items: list[MenuItem] = Field(default_factory=list, max_length=50)


class BottomSection(BaseModel):
    """Optional bottom section within a mega menu tab."""
    enabled: bool = False
    title: str = Field(default="", max_length=200)
    items: list[MenuItem] = Field(default_factory=list, max_length=20)


class MegaMenuTab(BaseModel):
    """A single tab in a tabbed mega menu."""
    tab_id: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=200)
    order: int = Field(default=0, ge=0)
    is_default: bool = False
    columns: list[MenuColumn] = Field(default_factory=list, max_length=10)
    bottom_section: BottomSection | None = None


class PromoBanner(BaseModel):
    """Optional promotional card displayed on the right side of a mega menu."""
    enabled: bool = False
    image_url: str | None = None
    title: str = Field(default="", max_length=200)
    description: str = Field(default="", max_length=500)
    cta_label: str = Field(default="", max_length=100)
    cta_url: str = Field(default="", max_length=500)
    cta_target: LinkTarget = LinkTarget.SELF


class DropdownChild(BaseModel):
    """An item in a dropdown or nested menu — supports one level of nesting."""
    item_id: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=200)
    url: str = Field(default="", max_length=500)
    icon_url: str | None = None
    target: LinkTarget = LinkTarget.SELF
    children: list["DropdownChild"] = Field(default_factory=list, max_length=30)

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if v.startswith(("javascript:", "data:")):
            raise ValueError("Unsafe URL scheme")
        return v


# ─────────────────────────────────────────────────────────────────────────────
# Top-level menu item
# ─────────────────────────────────────────────────────────────────────────────

class NavMenuEntry(BaseModel):
    """A single main navigation menu entry (e.g. "Camera Products")."""
    menu_id: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=200)
    url: str | None = Field(default=None, max_length=500)
    target: LinkTarget = LinkTarget.SELF
    order: int = Field(default=0, ge=0)
    visible: bool = True
    menu_type: MenuType = MenuType.LINK

    # Mega tabbed (e.g. Camera Products)
    tabs: list[MegaMenuTab] = Field(default_factory=list, max_length=20)

    # Mega columns (e.g. Markets — no tabs)
    columns: list[MenuColumn] = Field(default_factory=list, max_length=10)

    # Dropdown / nested
    children: list[DropdownChild] = Field(default_factory=list, max_length=50)

    # Promo banner (right side of mega menu)
    promo_banner: PromoBanner | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if v.startswith(("javascript:", "data:")):
            raise ValueError("Unsafe URL scheme")
        return v


# ─────────────────────────────────────────────────────────────────────────────
# Header configuration
# ─────────────────────────────────────────────────────────────────────────────

class PhoneConfig(BaseModel):
    number: str = Field(default="", max_length=50)
    label: str = Field(default="", max_length=100)
    visible: bool = True


class ContactLinkConfig(BaseModel):
    label: str = Field(default="Contact Us", max_length=100)
    url: str = Field(default="/contact", max_length=500)
    visible: bool = True


class CountryFlag(BaseModel):
    code: str = Field(..., min_length=2, max_length=10)
    label: str = Field(..., min_length=1, max_length=100)
    image_url: str = Field(..., max_length=500)
    url: str = Field(default="", max_length=500)
    locale_prefix: str = Field(default="", max_length=10, pattern=r"^[a-z]{0,5}$")
    is_default: bool = False


class CtaButtonConfig(BaseModel):
    label: str = Field(default="Developers", max_length=100)
    url: str = Field(default="/developers", max_length=500)
    icon_url: str | None = None
    bg_color: str = Field(default="#059f46", pattern=r"^#[0-9a-fA-F]{6}$")
    visible: bool = True


class HeaderConfig(BaseModel):
    logo_url: str = Field(default="", max_length=500)
    phone: PhoneConfig = Field(default_factory=PhoneConfig)
    contact_link: ContactLinkConfig = Field(default_factory=ContactLinkConfig)
    country_flags: list[CountryFlag] = Field(default_factory=list, max_length=50)
    cta_button: CtaButtonConfig = Field(default_factory=CtaButtonConfig)
    search_enabled: bool = True
    cart_enabled: bool = True
    account_enabled: bool = True


# ─────────────────────────────────────────────────────────────────────────────
# Root navigation document
# ─────────────────────────────────────────────────────────────────────────────

class NavigationConfig(BaseModel):
    """Full navigation configuration — single document in 'navigation' collection."""
    header: HeaderConfig = Field(default_factory=HeaderConfig)
    menus: list[NavMenuEntry] = Field(default_factory=list, max_length=20)
    status: NavigationStatus = NavigationStatus.DRAFT
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: str = Field(default="", max_length=200)


class NavigationUpdate(BaseModel):
    """Payload for updating navigation config. All fields optional."""
    header: HeaderConfig | None = None
    menus: list[NavMenuEntry] | None = None


class NavigationResponse(BaseModel):
    """API response shape for navigation config."""
    header: HeaderConfig
    menus: list[NavMenuEntry]
    status: NavigationStatus
    updated_at: datetime
    updated_by: str


class NavigationPublicResponse(BaseModel):
    """Lightweight response for public API — no status/audit fields."""
    header: HeaderConfig
    menus: list[NavMenuEntry]
