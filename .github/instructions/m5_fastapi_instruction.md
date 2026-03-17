# Module 5: Core API Engine (FastAPI) — Complete Instructions

---

## 1. Objective

Build the **Python FastAPI backend** — the central brain of the platform. Every frontend (M3 CMS, M4 Web) communicates exclusively through this API. You own route definitions, business logic services, middleware chain, S3 utilities, and structured logging.

> **YOUR SCOPE:** Files in `backend/app/routers/`, `backend/app/services/`, `backend/app/utils/`, and `backend/app/main.py`.  
> **NOT YOUR SCOPE:** Pydantic models (M1 owns `models/`), security utilities (M2 owns `security/`).  
> **YOU CONSUME:** M1's models (import from `app.models.*`), M2's dependencies (import from `app.security.*`), M1's `database.py` (import `get_db`).

---

## 2. Tech Stack (Exact Versions)

```
python = ">=3.11,<3.13"
fastapi = ">=0.110,<1.0"
uvicorn = {extras = ["standard"], version = ">=0.30"}
motor = ">=3.5"
pymongo = ">=4.8"
boto3 = ">=1.34"
pyjwt = ">=2.8"
passlib = {extras = ["bcrypt"], version = ">=1.7"}
pydantic = {extras = ["email"], version = ">=2.7"}
python-multipart = ">=0.0.9"
httpx = ">=0.27"          # For async testing
pytest = ">=8.0"
pytest-asyncio = ">=0.23"
```

> Pin in `requirements.txt` with exact minor versions: `fastapi==0.115.0`, etc.

---

## 3. Application Factory — `backend/app/main.py`

```python
import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.database import connect_db, close_db
from app.routers import auth, cms, public
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting up — connecting to database")
    await connect_db()
    yield
    logger.info("Shutting down — closing database connection")
    await close_db()


def create_app() -> FastAPI:
    app = FastAPI(
        title="e-con Platform API",
        version="1.0.0",
        docs_url="/docs" if os.getenv("NODE_ENV") != "production" else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # === CORS ===
    origins = json.loads(os.getenv("CORS_ORIGINS", '["http://localhost:5173","http://localhost:3000"]'))
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,              # Explicit origins only — NEVER use ["*"] in production
        allow_credentials=True,             # Required for HttpOnly cookies
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # === Exception Handlers ===
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = [
            {"field": ".".join(str(loc) for loc in e["loc"]), "issue": e["msg"]}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": {"code": "VALIDATION_ERROR", "message": "Invalid request data", "details": details}},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}},
        )

    # === Routers ===
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
    app.include_router(cms.router, prefix="/api/v1/cms", tags=["CMS"])
    app.include_router(public.router, prefix="/api/v1/public", tags=["Public"])

    # === Health Check ===
    @app.get("/health", tags=["System"])
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()
```

**Rules:**
- Swagger UI (`/docs`) is disabled in production.
- CORS origins are loaded from env var — NEVER `*` in production.
- `allow_credentials=True` is required for refresh token cookies.
- All unhandled exceptions return the standard error shape (M0 §9).
- The global exception handler logs the full stack trace but returns a generic message to the client.

---

## 4. Auth Router — `backend/app/routers/auth.py`

### 4.1 Complete Route Table

| Method | Path                    | Auth | Description                          | Request Body                | Response                     |
|--------|-------------------------|------|--------------------------------------|-----------------------------|------------------------------|
| POST   | `/api/v1/auth/login`    | NO   | Email/password login                 | `{ email, password }`       | `{ access_token, token_type }` + Set-Cookie |
| POST   | `/api/v1/auth/refresh`  | NO*  | Refresh access token                 | (none — cookie sent)        | `{ access_token, token_type }` + Set-Cookie |
| POST   | `/api/v1/auth/logout`   | YES  | Invalidate refresh cookie            | (none)                      | `{ message: "Logged out" }`  |
| GET    | `/api/v1/auth/me`       | YES  | Get current user profile             | (none)                      | `UserResponse`               |

> *\*Refresh requires the `refresh_token` HttpOnly cookie, not Bearer header.*

### 4.2 Implementation: POST `/login`

```python
@router.post("/login")
async def login(request: Request, body: LoginRequest):
    """
    Steps:
    1. Rate limit check: is_rate_limited(f"login:{client_ip}", 5, 60)
       → 429 if exceeded
    2. Find user by email (case-insensitive): db.users.find_one({"email": body.email.lower()})
       → 401 "Invalid email or password" if not found (DO NOT reveal email doesn't exist)
    3. Check if account is locked: if user.locked_until and now < user.locked_until
       → 401 "Account temporarily locked. Try again later."
    4. Verify password: verify_password(body.password, user.hashed_password)
       → On failure:
         a. Increment failed_login_attempts
         b. If failed_login_attempts >= 10: set locked_until = now + 15 min
         c. Return 401 "Invalid email or password"
       → On success:
         a. Reset failed_login_attempts = 0, locked_until = null
         b. Log audit event: LOGIN_SUCCESS
    5. Create access_token (with sub=user_id, role=user.role)
    6. Create refresh_token (with sub=user_id)
    7. Set refresh_token as HttpOnly cookie (see M2 §5)
    8. Return { access_token, token_type: "bearer" }
    """
```

**LoginRequest model:**
```python
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
```

### 4.3 Implementation: POST `/refresh`

```python
@router.post("/refresh")
async def refresh_token(request: Request):
    """
    Steps:
    1. Extract refresh_token from cookies: request.cookies.get("refresh_token")
       → 401 if missing
    2. Decode token: decode_token(refresh_token)
       → 401 if expired or invalid
    3. Verify type claim == "refresh"
       → 401 if not
    4. Find user by sub: db.users.find_one(ObjectId(payload["sub"]))
       → 401 if not found or not active
    5. Create new access_token
    6. Create new refresh_token (rotation)
    7. Set new refresh_token as HttpOnly cookie
    8. Return { access_token, token_type: "bearer" }
    """
```

### 4.4 Implementation: POST `/logout`

```python
@router.post("/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    """
    1. Clear the refresh_token cookie (max_age=0, same path/domain)
    2. Log audit event: LOGOUT
    3. Return { message: "Logged out" }
    """
```

### 4.5 Implementation: GET `/me`

```python
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return current user profile. The dependency already validated the JWT."""
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        role=current_user["role"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"],
    )
```

---

## 5. CMS Router — `backend/app/routers/cms.py`

> **All routes require JWT authentication + role check: Admin OR Marketing.**

### 5.1 Complete Route Table

| Method | Path                              | Auth           | Description                       | Request Body         | Response              |
|--------|-----------------------------------|----------------|-----------------------------------|----------------------|-----------------------|
| GET    | `/api/v1/cms/pages`               | Admin/Marketing | List all pages (any status)       | (none)               | `PageListItem[]`      |
| GET    | `/api/v1/cms/pages/{slug}`        | Admin/Marketing | Get single page with blocks       | (none)               | `PageResponse`        |
| POST   | `/api/v1/cms/pages`               | Admin/Marketing | Create a new page                 | `PageCreate`         | `PageResponse`        |
| PUT    | `/api/v1/cms/pages/{slug}`        | Admin/Marketing | Update page metadata + blocks     | `PageUpdate`         | `PageResponse`        |
| DELETE | `/api/v1/cms/pages/{slug}`        | Admin only      | Delete a page                     | (none)               | `{ message }`         |
| GET    | `/api/v1/cms/media`               | Admin/Marketing | List all media items              | (none)               | `MediaResponse[]`     |
| POST   | `/api/v1/cms/media/presigned-url` | Admin/Marketing | Get S3 pre-signed upload URL      | `MediaPresignRequest`| `PresignedUrlResponse`|
| POST   | `/api/v1/cms/media/confirm`       | Admin/Marketing | Confirm upload, save to DB        | `MediaConfirm`       | `MediaResponse`       |

### 5.2 Page Routes — Detailed Implementation

#### POST `/cms/pages` — Create Page

```python
@router.post("/pages", response_model=PageResponse, status_code=201)
async def create_page(
    body: PageCreate,
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MARKETING])),
):
    """
    Steps:
    1. Normalize slug: strip leading/trailing slashes, lowercase
    2. Check slug uniqueness: db.pages.find_one({"slug": slug})
       → 409 CONFLICT if exists
    3. Build page document from PageCreate + created_by + timestamps
    4. Insert into MongoDB: db.pages.insert_one(document)
    5. Log audit: PAGE_CREATE
    6. Return PageResponse
    """
```

#### PUT `/cms/pages/{slug}` — Update Page

```python
@router.put("/pages/{slug}", response_model=PageResponse)
async def update_page(
    slug: str,
    body: PageUpdate,
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MARKETING])),
):
    """
    Steps:
    1. Find existing page: db.pages.find_one({"slug": slug})
       → 404 NOT_FOUND if missing
    2. If body.blocks is provided:
       a. Validate each block's data against its type (see §5.4)
       b. Re-normalize order values (0, 1, 2, ...)
       c. Sanitize RichText HTML (strip <script>, on* attributes)
    3. Build $set dict from non-None fields + updated_at = now
    4. Update: db.pages.update_one({"slug": slug}, {"$set": update_dict})
    5. If status changed to "published": log audit PAGE_PUBLISH
       Else: log audit PAGE_UPDATE
    6. Fetch and return updated PageResponse
    """
```

#### DELETE `/cms/pages/{slug}` — Delete Page

```python
@router.delete("/pages/{slug}")
async def delete_page(
    slug: str,
    current_user: dict = Depends(require_role([UserRole.ADMIN])),  # Admin only!
):
    """
    Steps:
    1. Find page: db.pages.find_one({"slug": slug})
       → 404 NOT_FOUND if missing
    2. Delete: db.pages.delete_one({"slug": slug})
    3. Log audit: PAGE_DELETE
    4. Return { "message": "Page deleted" }
    """
```

### 5.3 Media Routes — Detailed Implementation

#### POST `/cms/media/presigned-url`

```python
@router.post("/media/presigned-url")
async def get_presigned_url(
    body: MediaPresignRequest,
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MARKETING])),
):
    """
    Steps:
    1. Validate content_type is in ALLOWED_CONTENT_TYPES
    2. Generate safe S3 key: generate_s3_key(body.file_name) → "media/2026/03/uuid.jpg"
    3. Call boto3 generate_presigned_url:
       s3_client.generate_presigned_url(
           "put_object",
           Params={
               "Bucket": S3_BUCKET_NAME,
               "Key": s3_key,
               "ContentType": body.content_type,
           },
           ExpiresIn=300,  # 5 minutes
       )
    4. Return { presigned_url, s3_key }
    """
```

#### POST `/cms/media/confirm`

```python
@router.post("/media/confirm", response_model=MediaResponse, status_code=201)
async def confirm_upload(
    body: MediaConfirm,
    current_user: dict = Depends(require_role([UserRole.ADMIN, UserRole.MARKETING])),
):
    """
    Steps:
    1. Verify the object actually exists in S3:
       s3_client.head_object(Bucket=S3_BUCKET_NAME, Key=body.s3_key)
       → 404 if missing (upload failed or key forged)
    2. Verify content type matches what was in the presigned request
    3. Build cloudfront_url: f"{CLOUDFRONT_DOMAIN}/{body.s3_key}"
    4. Build media document from MediaConfirm + uploaded_by + created_at
    5. Insert: db.media.insert_one(document)
    6. Log audit: MEDIA_UPLOAD
    7. Return MediaResponse
    """
```

### 5.4 Block Data Validation — `backend/app/services/page_service.py`

> This is the dynamic validation layer that checks `data` contents based on `type`.

```python
from app.models.block import BlockType, BlockEnvelope
import re
import bleach  # or a custom sanitizer

BLOCK_VALIDATORS: dict[str, callable] = {}  # Populated below


def validate_blocks(blocks: list[BlockEnvelope]) -> list[BlockEnvelope]:
    """Validate all blocks' data fields based on their type.
    
    Raises ValueError with descriptive message on failure.
    Re-normalizes order values.
    """
    for i, block in enumerate(blocks):
        block.order = i  # Re-normalize
        validator = BLOCK_VALIDATORS.get(block.type.value)
        if validator:
            validator(block.data)
    return blocks


def _validate_hero(data: dict) -> None:
    _require_keys(data, ["title", "image_url"])
    _validate_https_url(data["image_url"], "image_url")

def _validate_rich_text(data: dict) -> None:
    _require_keys(data, ["html"])
    if len(data["html"]) > 50_000:
        raise ValueError("RichText html exceeds 50,000 character limit")
    # Sanitize HTML — strip dangerous tags/attributes
    data["html"] = sanitize_html(data["html"])

def _validate_product_grid(data: dict) -> None:
    _require_keys(data, ["heading", "category", "max_items"])
    if not isinstance(data["max_items"], int) or not (1 <= data["max_items"] <= 50):
        raise ValueError("max_items must be integer 1-50")

def _validate_image_banner(data: dict) -> None:
    _require_keys(data, ["image_url", "alt_text"])
    _validate_https_url(data["image_url"], "image_url")
    if len(data.get("alt_text", "")) > 300:
        raise ValueError("alt_text exceeds 300 characters")

def _validate_video_embed(data: dict) -> None:
    _require_keys(data, ["provider", "video_id", "title"])
    if data["provider"] not in ("youtube", "vimeo"):
        raise ValueError("provider must be 'youtube' or 'vimeo'")
    if not re.match(r"^[a-zA-Z0-9_-]+$", data["video_id"]):
        raise ValueError("video_id must be alphanumeric")

def _validate_faq(data: dict) -> None:
    _require_keys(data, ["heading", "items"])
    items = data["items"]
    if not isinstance(items, list) or not (1 <= len(items) <= 30):
        raise ValueError("FAQ items must be array of 1-30 items")
    for item in items:
        if not isinstance(item, dict) or "question" not in item or "answer" not in item:
            raise ValueError("Each FAQ item must have 'question' and 'answer'")

def _validate_cta_strip(data: dict) -> None:
    _require_keys(data, ["text", "button_label", "button_link"])
    if "bg_color" in data and data["bg_color"]:
        if not re.match(r"^#[0-9a-fA-F]{6}$", data["bg_color"]):
            raise ValueError("bg_color must be hex format #RRGGBB")

def _validate_testimonials(data: dict) -> None:
    _require_keys(data, ["items"])
    items = data["items"]
    if not isinstance(items, list) or not (1 <= len(items) <= 20):
        raise ValueError("Testimonials items must be array of 1-20 items")
    for item in items:
        if not isinstance(item, dict) or "quote" not in item or "author" not in item:
            raise ValueError("Each testimonial must have 'quote' and 'author'")


# === Helpers ===
def _require_keys(data: dict, keys: list[str]) -> None:
    for key in keys:
        if key not in data or data[key] is None:
            raise ValueError(f"Missing required field: {key}")

def _validate_https_url(url: str, field_name: str) -> None:
    if not isinstance(url, str) or not url.startswith("https://"):
        raise ValueError(f"{field_name} must be a valid HTTPS URL")


# Register validators
BLOCK_VALIDATORS = {
    "Hero": _validate_hero,
    "RichText": _validate_rich_text,
    "ProductGrid": _validate_product_grid,
    "ImageBanner": _validate_image_banner,
    "VideoEmbed": _validate_video_embed,
    "FAQ": _validate_faq,
    "CTAStrip": _validate_cta_strip,
    "Testimonials": _validate_testimonials,
}
```

### 5.5 HTML Sanitization (Server-Side) — `backend/app/utils/validators.py`

```python
import re

# Simple HTML sanitizer for RichText blocks.
# Strips all tags except a safe allowlist. For production, use bleach library.
ALLOWED_TAGS = {
    "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre",
    "img", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
}

def sanitize_html(html: str) -> str:
    """Remove dangerous HTML tags and attributes.
    
    Defense-in-depth: M3 sanitizes on the client, this sanitizes on the server.
    """
    # Strip <script> and <style> tags and their content
    html = re.sub(r"<script[\s\S]*?</script>", "", html, flags=re.IGNORECASE)
    html = re.sub(r"<style[\s\S]*?</style>", "", html, flags=re.IGNORECASE)
    # Strip event handler attributes (onclick, onerror, etc.)
    html = re.sub(r'\s+on\w+\s*=\s*["\'][^"\']*["\']', "", html, flags=re.IGNORECASE)
    html = re.sub(r'\s+on\w+\s*=\s*\S+', "", html, flags=re.IGNORECASE)
    # Strip javascript: URLs
    html = re.sub(r'href\s*=\s*["\']javascript:[^"\']*["\']', 'href="#"', html, flags=re.IGNORECASE)
    html = re.sub(r'src\s*=\s*["\']javascript:[^"\']*["\']', 'src=""', html, flags=re.IGNORECASE)
    return html
```

> **Note:** For production, install and use the `bleach` library instead of regex-based sanitization. The regex version above is a minimal fallback.

---

## 6. Public Router — `backend/app/routers/public.py`

> **NO authentication required. Read-only. Only returns published pages.**

### 6.1 Route Table

| Method | Path                          | Auth | Description                      | Response          |
|--------|-------------------------------|------|----------------------------------|-------------------|
| GET    | `/api/v1/public/pages/{slug}` | NO   | Get published page by slug       | `PageResponse`    |
| GET    | `/api/v1/public/pages`        | NO   | List all published pages (slugs) | `PageListItem[]`  |

### 6.2 Implementation: GET `/public/pages/{slug}`

```python
@router.get("/pages/{slug:path}", response_model=PageResponse)
async def get_public_page(slug: str):
    """
    Steps:
    1. Normalize slug (strip slashes, lowercase)
    2. Query: db.pages.find_one({"slug": slug, "status": "published"})
       → 404 NOT_FOUND if missing or not published
    3. Filter blocks: only include blocks where visible == True
    4. Return PageResponse
    
    CRITICAL: Always filter by status == "published". 
    Draft/archived pages must NEVER be returned from public routes.
    """
```

### 6.3 Implementation: GET `/public/pages`

```python
@router.get("/pages", response_model=list[PageListItem])
async def list_public_pages():
    """
    Returns a list of all published page slugs + titles (for sitemap generation, navigation).
    
    Query: db.pages.find({"status": "published"}, {"slug": 1, "title": 1, "updated_at": 1})
    Sort by: updated_at descending
    """
```

---

## 7. S3 Utility — `backend/app/utils/s3.py`

```python
import os
import uuid
from datetime import datetime, timezone

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

_s3_client = None

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "econ-platform-media")
CLOUDFRONT_DOMAIN = os.getenv("CLOUDFRONT_DOMAIN", "https://cdn.econsystems.com")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "svg", "mp4", "pdf"}


def get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            region_name=AWS_REGION,
            config=Config(signature_version="s3v4"),
        )
    return _s3_client


def generate_s3_key(original_filename: str) -> str:
    """Generate a safe, unique S3 key. Server controls the path — never trust client."""
    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File extension '{ext}' is not allowed. Allowed: {ALLOWED_EXTENSIONS}")
    now = datetime.now(timezone.utc)
    return f"media/{now.year}/{now.month:02d}/{uuid.uuid4()}.{ext}"


def create_presigned_url(s3_key: str, content_type: str, expires_in: int = 300) -> str:
    """Generate a pre-signed PUT URL for direct browser upload."""
    client = get_s3_client()
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": S3_BUCKET_NAME,
            "Key": s3_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )


def verify_object_exists(s3_key: str) -> bool:
    """Check if an object exists in S3. Used during upload confirmation."""
    client = get_s3_client()
    try:
        client.head_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        return True
    except ClientError:
        return False


def build_cloudfront_url(s3_key: str) -> str:
    """Build the public CloudFront URL for an S3 object."""
    return f"{CLOUDFRONT_DOMAIN}/{s3_key}"
```

---

## 8. Structured Logging — `backend/app/utils/logger.py`

```python
import logging
import json
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
```

**Usage across the application:**
```python
from app.utils.logger import get_logger
logger = get_logger(__name__)

logger.info("User logged in", extra={"user_id": user_id})
logger.warning("Rate limit hit", extra={"ip": client_ip})
logger.error("S3 upload verification failed", extra={"s3_key": key})
```

---

## 9. Audit Logging Service — `backend/app/services/audit_service.py`

```python
from datetime import datetime, timezone
from app.database import get_db
from app.models.audit import AuditAction


async def log_audit(
    action: AuditAction,
    user_id: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    ip_address: str | None = None,
    details: str = "",
) -> None:
    """Non-blocking audit log write. Failures are logged but don't break the request."""
    try:
        db = get_db()
        await db.audit_log.insert_one({
            "user_id": user_id,
            "action": action.value,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "ip_address": ip_address,
            "details": details,
            "timestamp": datetime.now(timezone.utc),
        })
    except Exception:
        from app.utils.logger import get_logger
        get_logger(__name__).exception("Failed to write audit log")
```

---

## 10. Middleware & Request Pipeline

The request flows through these layers in order:

```
→ CORS Middleware (FastAPI built-in)
  → Request Logging (correlation ID assignment)
    → Route Handler
      → Auth Dependency (get_current_user / require_role)
        → Service Layer (business logic + validation)
          → Database / S3
        ← Response
      ← Auth passes / rejects
    ← Response logged (status code, duration)
  ← CORS headers applied
← Response sent
```

### 10.1 Request Logging Middleware (Optional but Recommended)

```python
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logger import get_logger

logger = get_logger("request")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = round((time.monotonic() - start) * 1000, 2)
        logger.info(
            f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)",
        )
        response.headers["X-Request-ID"] = request_id
        return response
```

---

## 11. Configuration — `backend/app/config.py`

```python
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "econ_platform"

    # Auth
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # AWS
    aws_region: str = "ap-south-1"
    s3_bucket_name: str = "econ-platform-media"
    cloudfront_domain: str = "https://cdn.econsystems.com"

    # App
    node_env: str = "development"
    cors_origins: str = '["http://localhost:5173","http://localhost:3000"]'
    rate_limit_per_minute: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
```

---

## 12. Testing — `backend/tests/`

### 12.1 Test Client Setup — `conftest.py`

```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import create_app

@pytest_asyncio.fixture
async def client():
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

### 12.2 Required Test Cases

**Auth tests (`test_auth.py`):**
- Login with valid credentials → 200 + access_token + refresh cookie set
- Login with wrong password → 401
- Login with non-existent email → 401 (same error message as wrong password)
- Login rate limiting → 429 after 5 attempts
- Account lockout after 10 failures → 401 with locked message
- Refresh token → 200 + new access token
- Refresh with expired token → 401
- GET /me with valid token → 200 + user data
- GET /me without token → 401
- GET /me with expired token → 401

**CMS tests (`test_cms.py`):**
- Create page → 201
- Create duplicate slug → 409
- Update page blocks → 200
- Update with invalid block data → 400
- Delete page (admin) → 200
- Delete page (marketing) → 403
- Presigned URL generation → 200 + URL + key
- Media confirm → 201
- All routes without auth → 401

**Public tests (`test_public.py`):**
- Get published page → 200 + correct data
- Get draft page → 404 (must not expose drafts)
- Get non-existent slug → 404
- List published pages → 200 + only published items

---

## 13. Checklist Before Marking M5 Complete

- [ ] `main.py`: App starts, CORS configured, exception handlers registered, routers mounted.
- [ ] Swagger UI available at `/docs` (dev only).
- [ ] Health check at `/health` returns `{ status: "ok" }`.
- [ ] Auth routes: login, refresh, logout, me — all work per specification.
- [ ] Rate limiting on login endpoint (5/min/IP).
- [ ] Account lockout logic (10 failures → 15 min lock).
- [ ] Refresh token set as HttpOnly cookie with correct attributes.
- [ ] CMS routes: full CRUD for pages, presigned URL, media confirm.
- [ ] Block data validation per type (page_service.py).
- [ ] Server-side HTML sanitization for RichText blocks.
- [ ] Public routes: only return `status: "published"` pages.
- [ ] S3 key generation is server-controlled (no client path traversal).
- [ ] Upload confirmation verifies object exists in S3.
- [ ] Structured JSON logging on all operations.
- [ ] Audit logging for auth events and CMS mutations.
- [ ] All error responses follow M0 §9 shape.
- [ ] All tests pass: `pytest backend/tests/ -v`.
