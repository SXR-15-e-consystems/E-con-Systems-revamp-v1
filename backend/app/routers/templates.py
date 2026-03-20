from typing import Any

from fastapi import APIRouter, Depends, Response

from app.database import get_db
from app.models.template import (
    TemplateCreate,
    TemplateListItem,
    TemplateResponse,
    TemplateUpdate,
)
from app.services.page_service import ServiceError
from app.services.template_service import (
    create_template,
    delete_template,
    get_template,
    list_templates,
    update_template,
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


@router.get("/templates", response_model=list[TemplateListItem])
async def cms_list_templates(
    db: Any = Depends(get_db),
) -> list[TemplateListItem]:
    return await list_templates(db)


@router.get("/templates/{template_id}", response_model=TemplateResponse)
async def cms_get_template(
    template_id: str, db: Any = Depends(get_db)
) -> TemplateResponse:
    try:
        return await get_template(db, template_id)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc


@router.post("/templates", response_model=TemplateResponse, status_code=201)
async def cms_create_template(
    payload: TemplateCreate,
    db: Any = Depends(get_db),
) -> TemplateResponse:
    try:
        return await create_template(db, payload)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc


@router.put("/templates/{template_id}", response_model=TemplateResponse)
async def cms_update_template(
    template_id: str,
    payload: TemplateUpdate,
    db: Any = Depends(get_db),
) -> TemplateResponse:
    try:
        return await update_template(db, template_id, payload)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc


@router.delete("/templates/{template_id}")
async def cms_delete_template(
    template_id: str, db: Any = Depends(get_db)
) -> Response:
    try:
        await delete_template(db, template_id)
        return Response(status_code=204)
    except ServiceError as exc:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc
