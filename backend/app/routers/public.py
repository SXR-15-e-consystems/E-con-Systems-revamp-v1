from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any

from app.database import get_db
from app.models.download import DownloadRequest, DownloadResponse
from app.models.page import PageListItem, PageResponse
from app.services.download_service import process_download_request
from app.services.page_service import ServiceError, get_public_page, list_public_pages
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


@router.get("/pages", response_model=list[PageListItem])
async def public_list_pages(db: Any = Depends(get_db)) -> list[PageListItem]:
    return await list_public_pages(db)


@router.get("/pages/{slug:path}", response_model=PageResponse)
async def public_get_page(slug: str, db: Any = Depends(get_db)) -> PageResponse:
    try:
        return await get_public_page(db, slug)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc


@router.post("/downloads/request", response_model=DownloadResponse)
async def request_download(
    body: DownloadRequest,
    db: Any = Depends(get_db),
) -> DownloadResponse:
    """Process a document download request — verify reCAPTCHA, log, and email links."""
    result = await process_download_request(
        db=db,
        name=body.name,
        email=str(body.email),
        company=body.company,
        country=body.country,
        state=body.state,
        requirements=body.requirements,
        how_did_you_hear=body.howDidYouHear,
        documents=[{"name": d.name, "url": d.url} for d in body.documents],
        recaptcha_token=body.recaptchaToken,
    )

    if result["status"] == "error":
        code = result.get("code", "REQUEST_FAILED")
        if code == "RECAPTCHA_FAILED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "RECAPTCHA_FAILED",
                        "message": "reCAPTCHA verification failed. Please try again.",
                        "details": [],
                    }
                },
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": code,
                    "message": "Download request could not be processed.",
                    "details": [],
                }
            },
        )

    return DownloadResponse(
        status=result["status"],
        message=result.get("message", ""),
    )
