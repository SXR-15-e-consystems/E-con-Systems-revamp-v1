from fastapi import APIRouter, Depends, HTTPException, Response
from typing import Any

from app.database import get_db
from app.models.page import PageCreate, PageListItem, PageResponse, PageUpdate
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
