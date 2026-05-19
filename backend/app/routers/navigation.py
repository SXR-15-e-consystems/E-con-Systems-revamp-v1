"""CMS + Public navigation API routes."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.models.navigation import (
    NavigationPublicResponse,
    NavigationResponse,
    NavigationUpdate,
)
from app.models.user import UserRole
from app.security.dependencies import require_role
from app.services.navigation_service import (
    get_navigation,
    get_public_navigation,
    publish_navigation,
    update_navigation,
)
from app.services.page_service import ServiceError
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# CMS router (requires auth)
# ─────────────────────────────────────────────────────────────────────────────

cms_router = APIRouter()

_EDITORS = [UserRole.ADMIN, UserRole.MARKETING]


def _service_error_response(exc: ServiceError) -> dict[str, dict[str, object]]:
    return {
        "error": {
            "code": exc.code,
            "message": exc.message,
            "details": [],
        }
    }


@cms_router.get("/navigation", response_model=NavigationResponse)
async def cms_get_navigation(
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> NavigationResponse:
    """Get the full navigation config for CMS editing."""
    try:
        return await get_navigation(db)
    except ServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc


@cms_router.put("/navigation", response_model=NavigationResponse)
async def cms_update_navigation(
    payload: NavigationUpdate,
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> NavigationResponse:
    """Update header config and/or menu structure."""
    try:
        email = current_user.get("email", "unknown")
        return await update_navigation(db, payload, updated_by=email)
    except ServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc


@cms_router.post("/navigation/publish", response_model=NavigationResponse)
async def cms_publish_navigation(
    current_user: dict = Depends(require_role(_EDITORS)),
    db: Any = Depends(get_db),
) -> NavigationResponse:
    """Publish the current navigation config to the public site."""
    try:
        email = current_user.get("email", "unknown")
        return await publish_navigation(db, published_by=email)
    except ServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code, detail=_service_error_response(exc)
        ) from exc


# ─────────────────────────────────────────────────────────────────────────────
# Public router (no auth required)
# ─────────────────────────────────────────────────────────────────────────────

public_router = APIRouter()


@public_router.get("/navigation", response_model=NavigationPublicResponse)
async def public_get_navigation(
    locale: str = Query(default="en", max_length=10),
    db: Any = Depends(get_db),
) -> NavigationPublicResponse:
    """Get the published navigation config for the public website."""
    return await get_public_navigation(db, locale)
