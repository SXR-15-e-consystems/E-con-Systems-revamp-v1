import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import close_db, connect_db
from app.routers import cms, public
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up and connecting to database")
    await connect_db()
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
        allow_headers=["Authorization", "Content-Type"],
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

    app.include_router(cms.router, prefix="/api/v1/cms", tags=["CMS"])
    app.include_router(public.router, prefix="/api/v1/public", tags=["Public"])

    @app.get("/health", tags=["System"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
