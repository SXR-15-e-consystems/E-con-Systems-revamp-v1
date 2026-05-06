from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from typing import Any

from app.database import get_db
from app.models.page import PageCreate, PageListItem, PageResponse, PageSummary, PageUpdate
from app.models.user import UserRole
from app.security.dependencies import require_role
from app.services.audit_service import fire_audit_event
from app.services.page_service import (
    ServiceError,
    create_page,
    delete_page,
    get_page,
    list_pages,
    update_page,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()

_ALL_CMS = [UserRole.ADMIN, UserRole.MARKETING, UserRole.INVENTORY]
_EDITORS = [UserRole.ADMIN, UserRole.MARKETING]
_ADMIN_ONLY = [UserRole.ADMIN]


def _service_error_response(exc: ServiceError) -> dict[str, dict[str, object]]:
    return {
        "error": {
            "code": exc.code,
            "message": exc.message,
            "details": [],
        }
    }


@router.get("/pages", response_model=list[PageListItem])
async def cms_list_pages(
    current_user: dict = Depends(require_role(_ALL_CMS)),
    db: Any = Depends(get_db),
) -> list[PageListItem]:
    return await list_pages(db)


@router.get("/pages/summaries", response_model=list[PageSummary])
async def cms_page_summaries(
    current_user: dict = Depends(require_role(_ALL_CMS)),
    db: Any = Depends(get_db),
) -> list[PageSummary]:
    """Lightweight page summaries for product picker dropdowns."""
    from app.services.page_service import list_page_summaries

    return await list_page_summaries(db)


@router.get("/pages/{slug:path}", response_model=PageResponse)
async def cms_get_page(
    slug: str,
    current_user: dict = Depends(require_role(_ALL_CMS)),
    db: Any = Depends(get_db),
) -> PageResponse:
    try:
        return await get_page(db, slug)
    except ServiceError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error loading page slug=%s", slug, exc_info=exc)
        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "Failed to load page"}},
        ) from exc


@router.post("/pages", response_model=PageResponse, status_code=201)
async def cms_create_page(
    payload: PageCreate,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> PageResponse:
    try:
        result = await create_page(db, payload)
        fire_audit_event(
            "PAGE_CREATED",
            user_id=str(current_user["_id"]),
            target_id=result.id,
            details={"slug": result.slug},
        )
        return result
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc


@router.put("/pages/{slug:path}", response_model=PageResponse)
async def cms_update_page(
    slug: str,
    payload: PageUpdate,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> PageResponse:
    try:
        return await update_page(db, slug, payload)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc


@router.delete("/pages/{slug:path}")
async def cms_delete_page(
    slug: str,
    current_user: dict = Depends(require_role(_ADMIN_ONLY)),
    db: Any = Depends(get_db),
) -> Response:
    try:
        await delete_page(db, slug)
        fire_audit_event(
            "PAGE_DELETED",
            user_id=str(current_user["_id"]),
            details={"slug": slug},
        )
        return Response(status_code=204)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc


@router.post("/uploads/documents")
async def cms_upload_document(
    file: UploadFile,
    current_user: dict = Depends(require_role(_EDITORS)),
) -> dict[str, str]:
    """Upload a document file (PDF, ZIP, Word, STP, etc.) to S3.

    Returns the public URL for the uploaded file.
    Only CMS editors/admins can upload.
    """
    from app.services.storage_service import (
        MAX_FILE_SIZE,
        upload_file_to_s3,
        validate_upload,
    )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "VALIDATION_ERROR", "message": "Filename is required", "details": []}},
        )

    # Read file content with size limit
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "FILE_TOO_LARGE", "message": f"File exceeds {max_mb} MB limit", "details": []}},
        )

    content_type = file.content_type or "application/octet-stream"
    validation_error = validate_upload(file.filename, content_type, len(contents))
    if validation_error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "VALIDATION_ERROR", "message": validation_error, "details": []}},
        )

    try:
        url = upload_file_to_s3(contents, file.filename, content_type)
    except ValueError as exc:
        logger.error("Storage not configured: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "STORAGE_ERROR", "message": "File storage is not configured", "details": []}},
        ) from exc
    except Exception as exc:
        logger.exception("File upload failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "UPLOAD_FAILED", "message": "File upload failed. Please try again.", "details": []}},
        ) from exc

    return {"url": url, "filename": file.filename}
