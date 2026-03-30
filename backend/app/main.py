import json
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables FIRST — before any app imports that read os.getenv
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import close_db, connect_db
from app.routers import auth, cms, public, templates, users
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def _seed_admin_if_needed() -> None:
    """Create a default admin user on first startup if no users exist."""
    from app.database import get_db
    from app.security.hashing import hash_password
    from datetime import datetime, timezone

    db = get_db()
    count = await db.users.count_documents({})
    if count > 0:
        return

    admin_email = os.getenv("ADMIN_EMAIL", "").strip()
    admin_password = os.getenv("ADMIN_PASSWORD", "").strip()
    if not admin_email or not admin_password:
        logger.warning(
            "No users in DB and ADMIN_EMAIL/ADMIN_PASSWORD env vars not set. "
            "Set them to auto-create the first admin user."
        )
        return

    if len(admin_password) < 12:
        logger.error("ADMIN_PASSWORD must be at least 12 characters. Skipping admin seed.")
        return

    now = datetime.now(timezone.utc)
    await db.users.insert_one({
        "email": admin_email.lower(),
        "hashed_password": hash_password(admin_password),
        "role": "admin",
        "is_active": True,
        "failed_login_attempts": 0,
        "locked_until": None,
        "created_at": now,
        "updated_at": now,
    })
    logger.info("Default admin user created: %s", admin_email)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up and connecting to database")
    await connect_db()
    await _seed_admin_if_needed()
    yield
    logger.info("Shutting down and closing database")
    await close_db()


def create_app() -> FastAPI:
    app = FastAPI(
        title="e-con Platform API POC",
        version="0.1.0",
        docs_url="/docs" if os.getenv("NODE_ENV") != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    origins = json.loads(
        os.getenv("CORS_ORIGINS", '["http://localhost:5173","http://localhost:3000"]')
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = [
            {"field": ".".join(str(loc) for loc in err["loc"]), "issue": err["msg"]}
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request data",
                    "details": details,
                }
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "details": [],
                }
            },
        )

    app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
    app.include_router(cms.router, prefix="/api/v1/cms", tags=["CMS"])
    app.include_router(templates.router, prefix="/api/v1/cms", tags=["Templates"])
    app.include_router(users.router, prefix="/api/v1/cms", tags=["Users"])
    app.include_router(public.router, prefix="/api/v1/public", tags=["Public"])

    @app.get("/health", tags=["System"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
