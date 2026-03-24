from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.user import UserCreate, UserResponse, UserRole, UserUpdate
from app.security.dependencies import get_current_user, require_role
from app.services.audit_service import fire_audit_event
from app.services.user_service import (
    UserServiceError,
    create_user,
    deactivate_user,
    list_users,
    update_user,
)

router = APIRouter()


def _service_error_response(exc: UserServiceError) -> dict:
    return {"error": {"code": exc.code, "message": exc.message, "details": []}}


@router.get("/users", response_model=list[UserResponse])
async def cms_list_users(
    current_user: dict = Depends(require_role([UserRole.ADMIN])),
    db: Any = Depends(get_db),
) -> list[UserResponse]:
    return await list_users(db)


@router.post("/users", response_model=UserResponse, status_code=201)
async def cms_create_user(
    payload: UserCreate,
    current_user: dict = Depends(require_role([UserRole.ADMIN])),
    db: Any = Depends(get_db),
) -> UserResponse:
    try:
        result = await create_user(db, payload)
        fire_audit_event(
            "USER_CREATED",
            user_id=str(current_user["_id"]),
            target_id=result.id,
            details={"email": result.email, "role": result.role},
        )
        return result
    except UserServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc


@router.put("/users/{user_id}", response_model=UserResponse)
async def cms_update_user(
    user_id: str,
    payload: UserUpdate,
    current_user: dict = Depends(require_role([UserRole.ADMIN])),
    db: Any = Depends(get_db),
) -> UserResponse:
    # Prevent admin from deactivating themselves
    if str(current_user["_id"]) == user_id and payload.is_active is False:
        raise HTTPException(
            status_code=400,
            detail={"code": "BAD_REQUEST", "message": "Cannot deactivate your own account"},
        )
    try:
        result = await update_user(db, user_id, payload)
        fire_audit_event(
            "USER_UPDATED",
            user_id=str(current_user["_id"]),
            target_id=user_id,
            details=payload.model_dump(exclude_none=True),
        )
        return result
    except UserServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc


@router.delete("/users/{user_id}", response_model=UserResponse)
async def cms_delete_user(
    user_id: str,
    current_user: dict = Depends(require_role([UserRole.ADMIN])),
    db: Any = Depends(get_db),
) -> UserResponse:
    if str(current_user["_id"]) == user_id:
        raise HTTPException(
            status_code=400,
            detail={"code": "BAD_REQUEST", "message": "Cannot deactivate your own account"},
        )
    try:
        result = await deactivate_user(db, user_id)
        fire_audit_event(
            "USER_DEACTIVATED",
            user_id=str(current_user["_id"]),
            target_id=user_id,
        )
        return result
    except UserServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc
