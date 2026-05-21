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

# ─────────────────────────────────────────────────────────────────────────────
# Footer configuration
# ─────────────────────────────────────────────────────────────────────────────

class FooterLinkItem(BaseModel):
    """A single link inside a footer column."""
    label: str = Field(..., min_length=1, max_length=200)
    url: str = Field(..., max_length=500)
    target: LinkTarget = LinkTarget.SELF

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if v.startswith(("javascript:", "data:")):
            raise ValueError("Unsafe URL scheme")
        return v


class FooterColumn(BaseModel):
    """A titled column in the footer link grid."""
    col_id: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    items: list[FooterLinkItem] = Field(default_factory=list, max_length=30)


class FooterSocialLink(BaseModel):
    """A social media icon + URL."""
    platform: str = Field(..., min_length=1, max_length=50)   # e.g. "twitter", "linkedin"
    url: str = Field(..., max_length=500)
    label: str = Field(default="", max_length=100)

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if v.startswith(("javascript:", "data:")):
            raise ValueError("Unsafe URL scheme")
        return v


class FooterBadge(BaseModel):
    """A certification/trust badge shown in the footer."""
    badge_id: str = Field(..., min_length=1, max_length=100)
    image_url: str = Field(..., max_length=500)
    alt_text: str = Field(default="", max_length=200)
    link_url: str = Field(default="", max_length=500)


class FooterSubscribeConfig(BaseModel):
    """Newsletter / subscription bar configuration."""
    enabled: bool = True
    heading: str = Field(default="Subscribe for latest updates", max_length=200)
    placeholder: str = Field(default="Email id*", max_length=100)
    button_label: str = Field(default="SUBSCRIBE", max_length=50)
    # Internal email address that receives subscription notifications
    notification_email: str = Field(default="", max_length=254)


class FooterConfig(BaseModel):
    """Full footer configuration."""
    logo_url: str = Field(default="", max_length=500)
    logo_alt: str = Field(default="e-con Systems", max_length=200)
    logo_link: str = Field(default="/", max_length=500)
    tagline: str = Field(default="Think Vision. Think e-con.", max_length=300)
    columns: list[FooterColumn] = Field(default_factory=list, max_length=10)
    social_links: list[FooterSocialLink] = Field(default_factory=list, max_length=10)
    badges: list[FooterBadge] = Field(default_factory=list, max_length=10)
    subscribe: FooterSubscribeConfig = Field(default_factory=FooterSubscribeConfig)
    copyright_text: str = Field(default="", max_length=300)
    sitemap_link: str = Field(default="/sitemap", max_length=500)
    sitemap_label: str = Field(default="Site Map", max_length=100)
    border_color: str = Field(default="#006786", max_length=20)


# ─────────────────────────────────────────────────────────────────────────────
# Root navigation document
# ─────────────────────────────────────────────────────────────────────────────

class NavigationConfig(BaseModel):
    """Full navigation configuration — single document in 'navigation' collection."""
    header: HeaderConfig = Field(default_factory=HeaderConfig)
    footer: FooterConfig = Field(default_factory=FooterConfig)
    menus: list[NavMenuEntry] = Field(default_factory=list, max_length=20)
    status: NavigationStatus = NavigationStatus.DRAFT
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: str = Field(default="", max_length=200)
    # Flat label-override map per locale.
    # Keys follow the pattern: h_phone, h_contact, h_cta, m_{menu_id},
    # t_{tab_id}, bs_{tab_id}, c_{col_id}, ci_{col_id}_{idx}, d_{item_id},
    # pb_{menu_id}_title, pb_{menu_id}_desc, pb_{menu_id}_cta
    # Footer keys: f_heading, f_placeholder, f_btn, f_copyright,
    #              fc_{col_id}, fci_{col_id}_{idx}
    locales: dict[str, dict[str, str]] = Field(default_factory=dict)


class NavigationUpdate(BaseModel):
    """Payload for updating navigation config. All fields optional."""
    header: HeaderConfig | None = None
    footer: FooterConfig | None = None
    menus: list[NavMenuEntry] | None = None
    locales: dict[str, dict[str, str]] | None = None


class NavigationResponse(BaseModel):
    """API response shape for navigation config."""
    header: HeaderConfig
    footer: FooterConfig
    menus: list[NavMenuEntry]
    status: NavigationStatus
    updated_at: datetime
    updated_by: str
    locales: dict[str, dict[str, str]] = Field(default_factory=dict)


class NavigationPublicResponse(BaseModel):
    """Lightweight response for public API — no status/audit fields."""
    header: HeaderConfig
    footer: FooterConfig
    menus: list[NavMenuEntry]
    locales: dict[str, dict[str, str]] = Field(default_factory=dict)
