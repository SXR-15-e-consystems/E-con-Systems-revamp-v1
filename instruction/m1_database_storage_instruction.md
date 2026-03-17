# Module 1: Database & Storage Layer — Complete Instructions

---

## 1. Objective

Design and implement **all MongoDB schemas** (Pydantic models consumed by Motor) and the **AWS S3 + CloudFront storage architecture**. Your deliverables are the files inside `backend/app/models/` and the database initialization logic in `backend/app/database.py`.

> **YOUR SCOPE:** Pydantic models, index definitions, database connection setup, S3 config constants.  
> **NOT YOUR SCOPE:** Route handlers (M5), auth logic (M2), frontend code (M3/M4).

---

## 2. Prerequisites

- Read **M0 §5 (Lego Block Schema)** and **M0 §6 (Environment Variables)** before writing any code.
- All models live in `backend/app/models/`.
- Use `pydantic v2` (BaseModel with `model_config`), NOT pydantic v1 style.
- All datetime fields use **UTC ISO 8601** (`datetime` objects, serialized as strings).
- All ObjectId fields use a custom `PyObjectId` type (see §3.1).

---

## 3. MongoDB Connection Setup

### 3.1 File: `backend/app/database.py`

```python
import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    """Called once in FastAPI lifespan startup."""
    global _client, _db
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "econ_platform")
    _client = AsyncIOMotorClient(uri, maxPoolSize=50, minPoolSize=10)
    _db = _client[db_name]
    await _ensure_indexes()


async def close_db() -> None:
    """Called once in FastAPI lifespan shutdown."""
    global _client
    if _client:
        _client.close()


def get_db() -> AsyncIOMotorDatabase:
    """Return the database handle. Raise if not initialized."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return _db


async def _ensure_indexes() -> None:
    """Create all required indexes idempotently."""
    db = get_db()
    # Users
    await db.users.create_index("email", unique=True)
    # Pages
    await db.pages.create_index("slug", unique=True)
    await db.pages.create_index("status")
    await db.pages.create_index("updated_at")
    # Media
    await db.media.create_index("s3_key", unique=True)
    await db.media.create_index("uploaded_by")
    await db.media.create_index("created_at")
    # Audit log
    await db.audit_log.create_index("timestamp")
    await db.audit_log.create_index("user_id")
```

### 3.2 PyObjectId Helper

Place in `backend/app/models/__init__.py`:

```python
from typing import Annotated, Any
from bson import ObjectId
from pydantic import BeforeValidator, PlainSerializer

def _validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError(f"Invalid ObjectId: {v}")

PyObjectId = Annotated[
    ObjectId,
    BeforeValidator(_validate_object_id),
    PlainSerializer(lambda v: str(v), return_type=str),
]
```

---

## 4. Collection Schemas (Pydantic Models)

### 4.1 Users Collection — `backend/app/models/user.py`

```python
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, model_config
from . import PyObjectId


class UserRole(str, Enum):
    ADMIN = "admin"
    MARKETING = "marketing"
    INVENTORY = "inventory"


class UserInDB(BaseModel):
    """Full user document as stored in MongoDB."""
    model_config = model_config(populate_by_name=True)

    id: PyObjectId = Field(default=None, alias="_id")
    email: EmailStr
    hashed_password: str
    role: UserRole
    is_active: bool = True
    failed_login_attempts: int = Field(default=0, ge=0)
    locked_until: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    """Payload for creating a user (admin action)."""
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    role: UserRole


class UserResponse(BaseModel):
    """Public user representation (never expose password hash)."""
    id: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
```

**Collection:** `users`

**Indexes:**
| Field   | Type   | Unique |
|---------|--------|--------|
| `email` | ascending | YES |

**Validation rules:**
- `email`: Must be valid RFC 5322 email. Stored lowercase, trimmed.
- `password` (input only, never stored raw): Minimum 12 characters, maximum 128. Must contain at least one uppercase, one lowercase, one digit, one special character. Validated in `UserCreate` model with a custom Pydantic validator.
- `role`: Strict enum — reject any value not in `UserRole`.
- `failed_login_attempts`: Incremented on bad password. Reset to 0 on successful login.
- `locked_until`: Set to `now + 15 min` when `failed_login_attempts >= 10`. Auth logic (M2) checks this before allowing login.

---

### 4.2 Pages Collection — `backend/app/models/page.py`

```python
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field, field_validator
from . import PyObjectId
from .block import BlockEnvelope


class PageStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class PageInDB(BaseModel):
    """Full page document as stored in MongoDB."""
    id: PyObjectId = Field(default=None, alias="_id")
    slug: str = Field(
        ...,
        min_length=1,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*$",
    )
    title: str = Field(..., min_length=1, max_length=200)
    meta_description: str = Field(default="", max_length=320)
    og_image_url: str | None = None
    status: PageStatus = PageStatus.DRAFT
    blocks: list[BlockEnvelope] = Field(default_factory=list)
    created_by: str  # User ObjectId as string
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("slug")
    @classmethod
    def slug_no_leading_slash(cls, v: str) -> str:
        return v.lstrip("/")


class PageCreate(BaseModel):
    """Payload for CMS page creation."""
    slug: str = Field(
        ...,
        min_length=1,
        max_length=200,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*$",
    )
    title: str = Field(..., min_length=1, max_length=200)
    meta_description: str = Field(default="", max_length=320)
    og_image_url: str | None = None


class PageUpdate(BaseModel):
    """Payload for CMS page update (partial)."""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    meta_description: str | None = Field(default=None, max_length=320)
    og_image_url: str | None = None
    status: PageStatus | None = None
    blocks: list[BlockEnvelope] | None = None


class PageResponse(BaseModel):
    """API response for a single page."""
    id: str
    slug: str
    title: str
    meta_description: str
    og_image_url: str | None
    status: PageStatus
    blocks: list[BlockEnvelope]
    created_by: str
    created_at: datetime
    updated_at: datetime


class PageListItem(BaseModel):
    """Lightweight item for page list endpoints."""
    id: str
    slug: str
    title: str
    status: PageStatus
    updated_at: datetime
```

**Collection:** `pages`

**Indexes:**
| Field        | Type       | Unique |
|------------- |----------- |--------|
| `slug`       | ascending  | YES    |
| `status`     | ascending  | NO     |
| `updated_at` | descending | NO     |

**Validation rules:**
- `slug`: Lowercase alphanumeric + hyphens + forward slashes. No leading slash. No consecutive hyphens. No trailing slash. Regex enforced at model level.
- `blocks`: Array of `BlockEnvelope` objects validated recursively (see §4.3).
- `status`: Strict enum. When status changes to `published`, `updated_at` MUST be refreshed.

---

### 4.3 Block Envelope — `backend/app/models/block.py`

```python
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field, field_validator
import re


class BlockType(str, Enum):
    HERO = "Hero"
    RICH_TEXT = "RichText"
    PRODUCT_GRID = "ProductGrid"
    IMAGE_BANNER = "ImageBanner"
    VIDEO_EMBED = "VideoEmbed"
    FAQ = "FAQ"
    CTA_STRIP = "CTAStrip"
    TESTIMONIALS = "Testimonials"


class BlockEnvelope(BaseModel):
    block_id: str = Field(
        ...,
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
        description="UUIDv4 format",
    )
    type: BlockType
    order: int = Field(..., ge=0)
    visible: bool = True
    data: dict[str, Any] = Field(...)

    @field_validator("data")
    @classmethod
    def validate_data_not_empty(cls, v: dict) -> dict:
        if not v:
            raise ValueError("Block data cannot be empty")
        return v
```

> **Note for M5 agent:** You MUST add a service-layer function that validates `data` contents based on `type`. For example, if `type == "Hero"`, ensure `data` has `title` (string) and `image_url` (valid URL). This is NOT in the Pydantic model because the schema is dynamic — validate it in `backend/app/services/page_service.py`.

**Block data validation rules per type (M5 must enforce):**

| BlockType      | Required `data` keys                                      | Constraints                                           |
|--------------- |---------------------------------------------------------- |------------------------------------------------------ |
| Hero           | `title`, `image_url`                                      | `image_url` must start with `https://`                |
| RichText       | `html`                                                    | Max 50,000 chars. Must be sanitized (no `<script>`).  |
| ProductGrid    | `heading`, `category`, `max_items`                        | `max_items`: int, 1-50                                |
| ImageBanner    | `image_url`, `alt_text`                                   | `alt_text` max 300 chars                              |
| VideoEmbed     | `provider`, `video_id`, `title`                           | `provider` must be `"youtube"` or `"vimeo"`. `video_id` alphanumeric only. |
| FAQ            | `heading`, `items`                                        | `items`: array of `{question, answer}`, 1-30 items    |
| CTAStrip       | `text`, `button_label`, `button_link`                     | `bg_color` if present must be hex `#RRGGBB`           |
| Testimonials   | `items`                                                   | Array of `{quote, author}`, 1-20 items                |

---

### 4.4 Media Collection — `backend/app/models/media.py`

```python
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field
from . import PyObjectId


class MediaType(str, Enum):
    IMAGE_JPEG = "image/jpeg"
    IMAGE_PNG = "image/png"
    IMAGE_WEBP = "image/webp"
    IMAGE_SVG = "image/svg+xml"
    VIDEO_MP4 = "video/mp4"
    PDF = "application/pdf"


class MediaInDB(BaseModel):
    """Full media document as stored in MongoDB."""
    id: PyObjectId = Field(default=None, alias="_id")
    file_name: str = Field(..., min_length=1, max_length=255)
    s3_key: str = Field(..., min_length=1, max_length=1024)
    cloudfront_url: str
    content_type: MediaType
    file_size_bytes: int = Field(..., gt=0, le=25 * 1024 * 1024)  # 25 MB max
    uploaded_by: str  # User ObjectId as string
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MediaPresignRequest(BaseModel):
    """CMS request for a pre-signed upload URL."""
    file_name: str = Field(..., min_length=1, max_length=255, pattern=r"^[\w\-. ]+$")
    content_type: MediaType


class MediaConfirm(BaseModel):
    """CMS confirmation after successful S3 upload."""
    s3_key: str = Field(..., min_length=1, max_length=1024)
    file_name: str = Field(..., min_length=1, max_length=255)
    content_type: MediaType
    file_size_bytes: int = Field(..., gt=0, le=25 * 1024 * 1024)


class MediaResponse(BaseModel):
    """API response for a media item."""
    id: str
    file_name: str
    cloudfront_url: str
    content_type: str
    file_size_bytes: int
    uploaded_by: str
    created_at: datetime
```

**Collection:** `media`

**Indexes:**
| Field         | Type       | Unique |
|-------------- |----------- |--------|
| `s3_key`      | ascending  | YES    |
| `uploaded_by` | ascending  | NO     |
| `created_at`  | descending | NO     |

**Validation rules:**
- `file_name`: Alphanumeric + hyphens, underscores, dots, spaces. No path traversal characters (`..`, `/`, `\`).
- `content_type`: Strict enum — ONLY the 6 types in `MediaType`.
- `file_size_bytes`: Greater than 0, maximum 25 MB (26,214,400 bytes).
- `s3_key`: Must follow pattern `media/{YYYY}/{MM}/{uuid}.{ext}`. Generated server-side in M5 — NEVER trust client-supplied keys.

---

### 4.5 Audit Log Collection (Security — Optional but Recommended)

```python
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field
from . import PyObjectId


class AuditAction(str, Enum):
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    TOKEN_REFRESH = "token_refresh"
    PAGE_CREATE = "page_create"
    PAGE_UPDATE = "page_update"
    PAGE_PUBLISH = "page_publish"
    MEDIA_UPLOAD = "media_upload"


class AuditLogEntry(BaseModel):
    id: PyObjectId = Field(default=None, alias="_id")
    user_id: str | None = None
    action: AuditAction
    resource_type: str | None = None  # "page", "media", "user"
    resource_id: str | None = None
    ip_address: str | None = None
    details: str = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

**Collection:** `audit_log`

**Indexes:**
| Field       | Type       | Unique |
|------------ |----------- |--------|
| `timestamp` | descending | NO     |
| `user_id`   | ascending  | NO     |

---

## 5. Storage Architecture (AWS S3 + CloudFront)

### 5.1 Core Rules

1. **Binary files are NEVER stored in MongoDB.** MongoDB only stores the `cloudfront_url` and metadata.
2. **S3 bucket is 100% private.** No public ACL, no public bucket policy. All access goes through CloudFront or pre-signed URLs.
3. **CloudFront is the only public access path** to stored media.

### 5.2 S3 Bucket Structure

```
s3://econ-platform-media/
├── media/
│   ├── 2026/
│   │   ├── 01/
│   │   │   ├── a1b2c3d4-uuid.jpg
│   │   │   └── e5f6g7h8-uuid.webp
│   │   └── 03/
│   │       └── ...
│   └── ...
```

**Key format:** `media/{YYYY}/{MM}/{uuid-v4}.{original-extension}`

The S3 key is generated **server-side** in M5. The client never controls the path — this prevents path traversal attacks.

### 5.3 Upload Flow (Step by Step)

```
┌──────────┐     1. POST /api/v1/cms/media/presigned-url      ┌──────────┐
│  M3 CMS  │ ────── {file_name, content_type} ──────────────► │ M5 API   │
│ (Browser)│                                                    │ (FastAPI)│
│          │ ◄──── {presigned_url, s3_key, fields} ──────────── │          │
│          │     2. Response with pre-signed POST data          │          │
│          │                                                    │          │
│          │     3. PUT binary file directly ──────────────────► ┌──────┐  │
│          │        (pre-signed URL, max 5 min expiry)          │  S3  │  │
│          │                                                    └──────┘  │
│          │     4. POST /api/v1/cms/media/confirm              │          │
│          │ ────── {s3_key, file_name, content_type, size} ──► │          │
│          │                                                    │ (verify  │
│          │                                                    │  object  │
│          │ ◄──── {id, cloudfront_url, ...} ───────────────── │  exists) │
│          │     5. Response with media record                  │          │
└──────────┘                                                    └──────────┘
```

### 5.4 Pre-signed URL Generation (M5 Implementation Notes)

```python
# In backend/app/utils/s3.py — M5 agent implements this
import uuid
from datetime import datetime, timezone

def generate_s3_key(original_filename: str) -> str:
    """Generate a safe, unique S3 key. Never trust client paths."""
    now = datetime.now(timezone.utc)
    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
    # Whitelist extensions
    allowed_ext = {"jpg", "jpeg", "png", "webp", "svg", "mp4", "pdf"}
    if ext not in allowed_ext:
        raise ValueError(f"File extension '{ext}' not allowed")
    return f"media/{now.year}/{now.month:02d}/{uuid.uuid4()}.{ext}"
```

### 5.5 S3 Bucket Policy (CloudFront Origin Access Identity)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity <OAI-ID>"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::econ-platform-media/*"
    }
  ]
}
```

### 5.6 CloudFront Configuration

| Setting                  | Value                                    |
| ------------------------ | ---------------------------------------- |
| Origin                   | `econ-platform-media.s3.amazonaws.com`   |
| Origin Access            | Origin Access Identity (OAI)             |
| Viewer Protocol Policy   | Redirect HTTP to HTTPS                   |
| Cache Policy             | `CachingOptimized` (TTL 86400s)          |
| Response Headers Policy  | Add `Cache-Control: public, max-age=31536000, immutable` |
| Price Class              | PriceClass_200 (most regions)            |

---

## 6. Data Integrity Rules

1. **Cascading:** If a user is deactivated (`is_active: false`), their sessions are invalidated (M2 handles this via JWT checks). Their uploaded media and pages remain — they are NOT deleted.
2. **Slug uniqueness:** Enforced at the MongoDB unique index level AND validated in the service layer before insert (return HTTP 409 on conflict).
3. **Block ordering:** `blocks` array order is the source of truth. `BlockEnvelope.order` must match array index — the service layer re-normalizes orders on every save.
4. **Timestamps:** `updated_at` is refreshed on every write operation. `created_at` is immutable after insert.

---

## 7. Checklist Before Marking M1 Complete

- [ ] All Pydantic models in `backend/app/models/` compile without errors.
- [ ] `PyObjectId` helper works with both string and ObjectId inputs.
- [ ] `database.py` connects, creates indexes, and exposes `get_db()`.
- [ ] All field validators enforce constraints from this document.
- [ ] No raw string interpolation in any query — all Motor queries use parameterized dicts.
- [ ] Every model has both a "DB" variant (with `_id`) and a "Response" variant (without `hashed_password` etc.).
- [ ] Run `python -c "from app.models.user import *; from app.models.page import *; from app.models.block import *; from app.models.media import *; print('OK')"` — must print OK.
