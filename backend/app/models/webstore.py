from typing import Literal
from pydantic import BaseModel, Field


class WebstoreFeature(BaseModel):
    """A single label+value pair shown as a 'Special Feature' on the webstore card."""
    label: str = Field(default="", max_length=100)
    value: str = Field(default="", max_length=200)


class WebstoreDistributor(BaseModel):
    """Contact details for a country's authorized distributor."""
    name: str = Field(default="")
    email: str = Field(default="")
    phone: str = Field(default="")
    website: str = Field(default="")
    message: str = Field(default="")


class WebstoreCountryEntry(BaseModel):
    """Per-country purchase mode and distributor configuration."""
    country_code: str = Field(..., min_length=2, max_length=3, description="ISO 3166-1 alpha-2 country code e.g. IN, DE")
    purchase_mode: Literal["buy", "contact"] = "buy"
    cart_url: str = Field(default="", description="Per-country cart URL override. Empty = use default_cart_url")
    distributor: WebstoreDistributor = Field(default_factory=WebstoreDistributor)


class WebstoreConfig(BaseModel):
    """Global webstore configuration stored in the webstore_config collection."""
    default_cart_url: str = Field(
        default="http://www.sandbox.e-consystems.com/auth/webstore/Index",
        description="Base cart URL. Product name appended as ?ProductName={part_no}&quantity=1",
    )
    countries: list[WebstoreCountryEntry] = Field(default_factory=list)


class OrderRowSummary(BaseModel):
    """Lightweight order row extracted from a product page's order_table tab."""
    part_no: str = Field(default="")
    kit_contents: list[str] = Field(default_factory=list)
    price: str = Field(default="")
    nop_product_id: str = Field(default="", description="NopCommerce product ID for live pricing")
    cart_url: str = Field(default="", description="Full cart redirect URL for this variant")


class WebstoreProductItem(BaseModel):
    """Lightweight product listing item for the public webstore page."""
    slug: str
    title: str
    product_name: str = ""
    # Extracted from ProductHeroNew block
    hero_title: str = ""
    sku_badge: str = ""
    webstore_category: str = ""
    webstore_priority: int = 0
    webstore_features: list[WebstoreFeature] = Field(default_factory=list)
    webstore_image_url: str = ""
    variant_options: list[str] = Field(default_factory=list)
    highlights: list[str] = Field(default_factory=list)
    sample_price: str = ""
    sample_currency: str = "USD"
    volume_price: str = ""
    order_rows: list[OrderRowSummary] = Field(default_factory=list)
    meta_description: str = ""
    og_image_url: str | None = None
    # CMS-editable title override (blank = use hero_title)
    webstore_title: str = ""
    # Full canonical URL from taxonomy (e.g. /nvidia-cameras/agx-orin/see3cam-130d-new)
    url_path: str = ""


class WebstoreCountryConfigResponse(BaseModel):
    country: str
    purchase_mode: str  # "buy" | "contact"
    cart_url: str | None = None
    distributor: WebstoreDistributor | None = None
    message: str = ""
