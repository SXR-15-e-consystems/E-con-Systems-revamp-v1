from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from typing import Any

from app.database import get_db
from app.models.download import (
    BlockedEmailRequest,
    ContactInquiryRequest,
    ContactInquiryResponse,
    DownloadRequest,
    DownloadResponse,
    ValidateEmailRequest,
    ValidateEmailResponse,
)
from app.models.page import PageListItem, PageResponse
from app.mssql import call_get_product_details
from app.services.contact_service import process_contact_inquiry
from app.services.download_service import log_blocked_email, process_download_request
from app.services.email_validation_service import validate_email
from app.services.page_service import (
    ServiceError,
    get_public_page,
    get_public_pages_batch,
    list_public_pages,
)
from app.services.pricing_service import (
    build_price_map,
    parse_sp_response,
    validate_product_ids,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


def _service_error_response(exc: ServiceError) -> dict[str, dict[str, object]]:
    return {
        "error": {
            "code": exc.code,
            "message": exc.message,
            "details": [],
        }
    }


# ── Geo-country ───────────────────────────────────────────────────────────────

@router.get("/geo-country")
async def geo_country(request: Request) -> dict:
    """Return the visitor's ISO 3166-1 alpha-2 country code.

    Priority: cf-ipcountry (Cloudflare) → x-vercel-ip-country (Vercel) → None.
    """
    headers = request.headers
    code = (
        headers.get("cf-ipcountry")
        or headers.get("x-vercel-ip-country")
    )
    return {"countryCode": code.upper() if code else None}


# ── Email validation ──────────────────────────────────────────────────────────

@router.post("/validate-email", response_model=ValidateEmailResponse)
async def validate_email_endpoint(body: ValidateEmailRequest) -> ValidateEmailResponse:
    """Run the 6-step email validation pipeline (domain check + ZeroBounce)."""
    result = await validate_email(str(body.email))
    return ValidateEmailResponse(
        valid=bool(result.get("valid")),
        reason=str(result.get("reason", "")),
        incorpid=str(result.get("incorpid", "")),
    )


# ── Log blocked email ─────────────────────────────────────────────────────────

@router.post("/downloads/log-blocked")
async def log_blocked_email_endpoint(body: BlockedEmailRequest) -> dict:
    """Record a failed email-validation attempt in BlockedEmailUserDetails."""
    domain = body.domain or (body.email.split("@")[1] if "@" in body.email else "")
    await log_blocked_email(
        name=body.name,
        company=body.company,
        email=body.email,
        domain=domain,
        status=body.status,
        country=body.country,
        state=body.state,
        phone=body.phone,
        product_name=body.productName,
    )
    return {"success": True}


# ── Download request ──────────────────────────────────────────────────────────

@router.post("/downloads/request", response_model=DownloadResponse)
async def request_download(
    request: Request,
    body: DownloadRequest,
    db: Any = Depends(get_db),
) -> DownloadResponse:
    """Process a document download request — validate, log lead, send emails."""
    client_ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or request.client.host
        if request.client
        else "0.0.0.0"
    )

    result = await process_download_request(
        db=db,
        name=body.name,
        email=str(body.email),
        company=body.company,
        country=body.country,
        state=body.state,
        phone=body.phone,
        how_did_you_hear=body.howDidYouHear,
        newsletter=body.newsletter,
        terms_accepted=body.termsAccepted,
        product_name=body.productName,
        incorpid=body.incorpid,
        documents=[{"name": d.name, "url": d.url} for d in body.documents],
        client_ip=client_ip,
    )

    code = result.get("status", "error")
    if code == "error":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": result.get("code", "REQUEST_FAILED"),
                    "message": "Download request could not be processed.",
                    "details": [],
                }
            },
        )

    if code == "blocked":
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": {
                    "code": "RATE_LIMITED",
                    "message": result.get("message", ""),
                    "details": [],
                }
            },
        )

    return DownloadResponse(status=result["status"], message=result.get("message", ""))


# ── Contact inquiry ───────────────────────────────────────────────────────────

@router.post("/contact-inquiry", response_model=ContactInquiryResponse)
async def contact_inquiry(body: ContactInquiryRequest) -> ContactInquiryResponse:
    """Process a Contact Us form submission — add lead to SQL, send internal email."""
    result = await process_contact_inquiry(
        name=body.name,
        email=str(body.email),
        company=body.company,
        phone=body.phone,
        country=body.country,
        state=body.state,
        how_did_you_hear=body.howDidYouHear,
        requirements=body.requirements,
        product_name=body.product,
    )
    return ContactInquiryResponse(status=result["status"], message=result.get("message", ""))


# ── Pricing ───────────────────────────────────────────────────────────────────

@router.get("/product-pricing")
async def get_product_pricing(
    ids: str = Query(..., description="Comma-separated NopProductId values (numeric, max 20)"),
) -> dict:
    """Return live price and lead-time data from the econ MS SQL database.

    Calls [cart].[GetProductDetails] stored procedure.
    Response is a map keyed by product ID string:
      { "products": { "1432": { "price": 249.0, "leadTime": 5, "purchaseType": "buy_now", ... } } }

    purchaseType values:
      "buy_now"    — product available for purchase
      "contact_us" — leadTime == 9999, not available for direct purchase
    """
    try:
        id_list = validate_product_ids(ids)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "VALIDATION_ERROR", "message": str(exc), "details": []}},
        ) from exc

    ids_param = ",".join(id_list)
    try:
        raw_json = await call_get_product_details(ids_param)
    except RuntimeError as exc:
        # MS SQL not configured — return empty map so frontend falls back to static prices
        logger.warning("MS SQL not configured: %s", exc)
        return {"products": {}}
    except Exception as exc:
        logger.warning("MS SQL pricing lookup failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": {
                    "code": "PRICING_UNAVAILABLE",
                    "message": "Pricing service temporarily unavailable",
                    "details": [],
                }
            },
        ) from exc

    products = parse_sp_response(raw_json)
    price_map = build_price_map(products)
    return {"products": price_map}


@router.get("/pages", response_model=list[PageListItem])
async def public_list_pages(db: Any = Depends(get_db)) -> list[PageListItem]:
    return await list_public_pages(db)


@router.get("/pages/batch", response_model=list[PageResponse])
async def public_batch_pages(
    slugs: str,
    db: Any = Depends(get_db),
) -> list[PageResponse]:
    """Fetch multiple published pages by comma-separated slugs.

    Example: GET /pages/batch?slugs=e-cam51-usb,see3cam-30
    Returns pages in the same order as requested. Missing pages are omitted.
    Maximum 20 slugs per request.
    """
    slug_list = [s.strip().lower() for s in slugs.split(",") if s.strip()]
    if not slug_list:
        return []
    if len(slug_list) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Maximum 20 slugs per batch request",
                    "details": [],
                }
            },
        )
    try:
        return await get_public_pages_batch(db, slug_list)
    except ServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc


@router.get("/pages/{slug:path}", response_model=PageResponse)
async def public_get_page(
    slug: str,
    locale: str = Query(default="en", max_length=10),
    db: Any = Depends(get_db),
) -> PageResponse:
    try:
        return await get_public_page(db, slug, locale)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc



