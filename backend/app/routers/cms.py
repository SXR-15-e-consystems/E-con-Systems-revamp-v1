from fastapi import APIRouter, Depends, Response
from typing import Any

from app.database import get_db
from app.models.page import PageCreate, PageListItem, PageResponse, PageUpdate
from app.services.page_service import (
    ServiceError,
    create_page,
    delete_page,
    get_page,
    list_pages,
    update_page,
)

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
async def cms_list_pages(db: Any = Depends(get_db)) -> list[PageListItem]:
    return await list_pages(db)


@router.get("/pages/{slug:path}", response_model=PageResponse)
async def cms_get_page(slug: str, db: Any = Depends(get_db)) -> PageResponse:
    try:
        return await get_page(db, slug)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc


@router.post("/pages", response_model=PageResponse, status_code=201)
async def cms_create_page(
    payload: PageCreate,
    db: Any = Depends(get_db),
) -> PageResponse:
    try:
        return await create_page(db, payload)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc


@router.put("/pages/{slug:path}", response_model=PageResponse)
async def cms_update_page(
    slug: str,
    payload: PageUpdate,
    db: Any = Depends(get_db),
) -> PageResponse:
    try:
        return await update_page(db, slug, payload)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc


@router.delete("/pages/{slug:path}")
async def cms_delete_page(slug: str, db: Any = Depends(get_db)) -> Response:
    try:
        await delete_page(db, slug)
        return Response(status_code=204)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=_service_error_response(exc)) from exc
