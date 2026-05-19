"""Pricing service — SP response parsing and lead-time logic.

SP: [cart].[GetProductDetails](@prodcutID varchar(max))

SP returns a single column "ProductsDetails" containing a JSON string:
{
  "Products": [
    { "product": { "Id": "1432", "Name": "...", "NopProductName": "...",
                   "leadTime": 5, "Packs": 1, "Price": 249.0000,
                   "maxQuantity": 5, "Published": true } },
    ...
  ]
}

leadTime rules:
  9999           → contact_us  / "Contact Us"
  1              → buy_now     / "1 day (immediate shipping)"
  2–6            → buy_now     / "{n} days"
  7+             → buy_now     / "{n} week(s)"
"""
import json
import re
from typing import Optional

from app.utils.logger import get_logger

logger = get_logger(__name__)

CONTACT_US_LEAD_TIME = 9999
_MAX_IDS = 20
_ID_PATTERN = re.compile(r"^\d{1,10}$")


# ── Lead-time helpers ────────────────────────────────────────────────────────

def _lead_time_label(lead_time: Optional[int]) -> str:
    if lead_time is None:
        return ""
    if lead_time == CONTACT_US_LEAD_TIME:
        return "Contact Us"
    if lead_time == 1:
        return "1 day (immediate shipping)"
    if lead_time < 7:
        return f"{lead_time} days"
    weeks = round(lead_time / 7)
    return f"{weeks} week" if weeks == 1 else f"{weeks} weeks"


# ── SP response parsing ──────────────────────────────────────────────────────

def parse_sp_response(raw_json: Optional[str]) -> list[dict]:
    """Parse the JSON string from the ProductsDetails column into a flat list."""
    if not raw_json:
        return []
    try:
        data = json.loads(raw_json)
    except (json.JSONDecodeError, ValueError):
        logger.warning("Failed to parse SP JSON response")
        return []
    return [
        item["product"]
        for item in data.get("Products", [])
        if isinstance(item, dict) and "product" in item
    ]


def build_price_map(products: list[dict]) -> dict[str, dict]:
    """Return a dict keyed by product ID string for O(1) frontend lookups.

    Example output:
      {
        "1432": { "id": "1432", "price": 249.0, "leadTime": 5,
                  "leadTimeLabel": "5 days", "purchaseType": "buy_now", ... },
        ...
      }
    """
    result: dict[str, dict] = {}
    for p in products:
        pid = str(p.get("Id", "")).strip()
        if not pid:
            continue
        lead_time = p.get("leadTime")
        purchase_type = (
            "contact_us" if lead_time == CONTACT_US_LEAD_TIME else "buy_now"
        )
        result[pid] = {
            "id": pid,
            "name": p.get("Name"),
            "nopProductName": p.get("NopProductName"),
            "price": p.get("Price"),
            "leadTime": lead_time,
            "leadTimeLabel": _lead_time_label(lead_time),
            "purchaseType": purchase_type,
            "maxQuantity": p.get("maxQuantity"),
            "published": p.get("Published"),
            "packs": p.get("Packs"),
        }
    return result


# ── Input validation ─────────────────────────────────────────────────────────

def validate_product_ids(ids_str: str) -> list[str]:
    """Validate and return a deduplicated list of product ID strings.

    Raises ValueError with a descriptive message on invalid input.
    Accepts only numeric IDs (1–10 digits) separated by commas.
    """
    if not ids_str or not ids_str.strip():
        raise ValueError("ids parameter is required")
    parts = [p.strip() for p in ids_str.split(",") if p.strip()]
    if not parts:
        raise ValueError("ids parameter is empty")
    if len(parts) > _MAX_IDS:
        raise ValueError(f"Maximum {_MAX_IDS} product IDs per request")
    for part in parts:
        if not _ID_PATTERN.fullmatch(part):
            raise ValueError(
                f"Invalid product ID: {part!r}. Only numeric IDs are accepted."
            )
    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for p in parts:
        if p not in seen:
            seen.add(p)
            unique.append(p)
    return unique
