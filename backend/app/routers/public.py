from fastapi import APIRouter, Depends
from typing import Any

from app.database import get_db
from app.models.page import PageListItem, PageResponse
from app.services.page_service import ServiceError, get_public_page, list_public_pages

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
