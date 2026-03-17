# Master Architecture Foundation: Project "Lego Block"

---

## 1. System Overview

This is a production-grade, decoupled web platform designed around a "Dynamic Block" (Lego) architecture. The system consists of **5 distinct modules** developed in parallel by an AI swarm. Every module communicates exclusively through the FastAPI Core Engine (M5) — there are **zero direct cross-module imports or database calls from frontends**.

### 1.1 Business Goal

Replace the existing e-con Systems website with a CMS-driven, block-based platform where the Marketing team can compose pages visually, and the public site renders them with sub-second load times and full SEO compliance, mobile responsive, basically works across all platforms.

### 1.2 Non-Functional Requirements

| Requirement                 | Target                                           |
| --------------------------- | ------------------------------------------------ |
| First Contentful Paint (M4) | < 1.2 s on 4G                                    |
| API Response (p95)          | < 200 ms                                         |
| Uptime SLA                  | 99.9 %                                           |
| Security baseline           | OWASP Top-10 mitigated                           |
| Accessibility               | WCAG 2.1 AA (M4 public pages)                    |
| Browser support             | Last 2 versions of Chrome, Firefox, Safari, Edge |

---

## 2. Rules of Engagement for AI Swarm

> **CRITICAL — every agent MUST read this section before writing a single line of code.**

### 2.1 Zero Overlap Rule

You will **only** work on your assigned module. Do NOT write code, schemas, or configs that belong to another module. If you need something from another module, reference this document for the agreed interface contract and implement a stub/mock.

### 2.2 API-First Contract

All communication between frontends (M3, M4) and the database (M1) **MUST** go through the Core API Engine (M5). Frontends **NEVER** import database drivers, run raw queries, or access S3 directly (except for pre-signed URL uploads initiated through M5).

### 2.3 Code Quality Standards

| Standard                 | Rule                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DRY                      | Extract any duplicated block of ≥ 3 lines into a shared utility within YOUR module.                                                                                                            |
| Naming                   | `snake_case` for Python files/functions/variables. `PascalCase` for React components/classes. `camelCase` for JS/TS variables/functions. `UPPER_SNAKE_CASE` for constants and env vars. |
| Formatting               | Python: Black + isort. JS/TS: Prettier (printWidth 100, singleQuote, trailingComma "all").                                                                                                      |
| Type Safety              | Python: full type hints on every function signature. TS:`strict: true` in tsconfig.                                                                                                           |
| Comments                 | Only where logic is non-obvious. No "// increment i" style comments.                                                                                                                            |
| Error messages           | User-facing errors: generic ("Something went wrong"). Logs: detailed with correlation IDs.                                                                                                      |
| No hardcoded secrets     | Every secret goes in `.env`. Access via `os.getenv()` (Python) or `process.env` (Node).                                                                                                   |
| No `any` in TypeScript | Use `unknown` + type guards instead.                                                                                                                                                          |

### 2.4 Single Source of Truth

FastAPI's auto-generated **OpenAPI 3.1 (Swagger)** at `/docs` is the strict contract for all request/response data structures. M3 and M4 agents must code against these schemas — not assumptions.

### 2.5 Git & Branch Strategy

| Branch              | Purpose                           | Merge target |
| ------------------- | --------------------------------- | ------------ |
| `main`            | Production-ready, tagged releases | —           |
| `develop`         | Integration branch                | `main`     |
| `m1/feature-name` | Module 1 feature work             | `develop`  |
| `m2/feature-name` | Module 2 feature work             | `develop`  |
| `m3/feature-name` | Module 3 feature work             | `develop`  |
| `m4/feature-name` | Module 4 feature work             | `develop`  |
| `m5/feature-name` | Module 5 feature work             | `develop`  |

Commit messages: `[M<n>] <imperative verb> <short description>` — e.g., `[M5] Add JWT refresh endpoint`.

---

## 3. The 5 Modules

| Module       | Name                       | Tech Stack                                            | Role                                                                                    |
| ------------ | -------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **M1** | Data & Storage Layer       | MongoDB 7 + AWS S3 + CloudFront                       | Owns all database schemas (Pydantic ↔ Motor), indexes, migrations, S3 bucket policies. |
| **M2** | Identity Management System | Python (security utils) + React (login UI)            | Owns auth logic: bcrypt hashing, JWT creation/validation, RBAC middleware, login UI.    |
| **M3** | CMS Admin Portal           | React 18 + Vite 5 + Tailwind 3 + React Query 5        | Internal SPA for Marketing/Admins to compose Lego-block pages and manage media.         |
| **M4** | User-Facing Web            | Next.js 14 (App Router) + Tailwind 3 + shadcn/ui      | Read-only SEO-optimized public site. Renders block JSON into React components via ISR.  |
| **M5** | Core API Engine            | Python 3.11+ + FastAPI 0.110+ + Motor + Boto3 + PyJWT | Central brain: all CRUD, auth, S3 presigned URLs, caching, rate limiting.               |

### 3.1 Dependency Graph (data flow direction →)

```
M3 (CMS SPA) ──────► M5 (FastAPI) ──────► M1 (MongoDB + S3)
                         ▲                        ▲
M4 (Next.js SSR) ───────┘                        │
                                                   │
M2 (Auth utils) ── embedded in M5 & M3 ──────────┘
```

**Key rule:** Arrows go **only** toward M5 and M1. No reverse calls. M5 never calls M3 or M4. M3 and M4 never call M1 directly.

---

## 4. Project Folder Structure (Monorepo)

```
econ-platform/
├── .env.example              # Template — NEVER commit real .env
├── .gitignore
├── docker-compose.yml        # Local dev: MongoDB, Redis, MinIO (S3 mock)
├── README.md
│
├── backend/                  # M5 + M2 backend code
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app factory, CORS, middleware
│   │   ├── config.py         # Pydantic BaseSettings for env vars
│   │   ├── database.py       # Motor async client setup
│   │   │
│   │   ├── models/           # M1 — Pydantic schemas (request/response + DB)
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── page.py
│   │   │   ├── block.py
│   │   │   └── media.py
│   │   │
│   │   ├── security/         # M2 — Auth utilities
│   │   │   ├── __init__.py
│   │   │   ├── hashing.py    # bcrypt context
│   │   │   ├── jwt.py        # create/decode tokens
│   │   │   ├── dependencies.py  # get_current_user, require_role
│   │   │   └── rate_limit.py # Sliding window rate limiter
│   │   │
│   │   ├── routers/          # M5 — Route definitions
│   │   │   ├── __init__.py
│   │   │   ├── auth.py       # /api/v1/auth/*
│   │   │   ├── cms.py        # /api/v1/cms/*
│   │   │   └── public.py     # /api/v1/public/*
│   │   │
│   │   ├── services/         # Business logic (called by routers)
│   │   │   ├── __init__.py
│   │   │   ├── page_service.py
│   │   │   ├── media_service.py
│   │   │   └── user_service.py
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── s3.py         # Boto3 presigned URL helper
│   │       ├── validators.py # Shared input sanitizers
│   │       └── logger.py     # Structured JSON logging
│   │
│   ├── tests/
│   │   ├── conftest.py       # Fixtures: test DB, test client
│   │   ├── test_auth.py
│   │   ├── test_cms.py
│   │   └── test_public.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── pyproject.toml
│
├── cms/                      # M3 — React Vite SPA
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/              # Axios instance + interceptors
│   │   │   ├── client.ts
│   │   │   └── endpoints.ts
│   │   ├── auth/             # M2 frontend — login, token storage
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── useAuth.ts
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PageEditorPage.tsx
│   │   │   └── MediaManagerPage.tsx
│   │   ├── components/
│   │   │   ├── blocks/       # Block-type form editors
│   │   │   │   ├── HeroBlockEditor.tsx
│   │   │   │   ├── ProductGridBlockEditor.tsx
│   │   │   │   └── BlockEditorRegistry.ts
│   │   │   ├── ui/           # Reusable design-system atoms
│   │   │   └── layout/
│   │   ├── hooks/
│   │   ├── types/            # Shared TS interfaces
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── sanitize.ts   # DOMPurify wrapper
│   │
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── web/                      # M4 — Next.js public site
│   ├── app/
│   │   ├── layout.tsx        # Root layout, global metadata
│   │   ├── page.tsx          # Home page (redirects or static)
│   │   ├── [...slug]/
│   │   │   └── page.tsx      # Dynamic catch-all renderer
│   │   ├── not-found.tsx
│   │   └── error.tsx         # Global error boundary
│   ├── components/
│   │   ├── blocks/           # Block renderers (read-only)
│   │   │   ├── HeroBlock.tsx
│   │   │   ├── ProductGridBlock.tsx
│   │   │   └── BlockRegistry.ts
│   │   ├── ui/               # shadcn/ui components
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── api.ts            # Server-side fetch wrapper for M5
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   │
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── infrastructure/           # Docker, CI/CD, terraform (future)
    ├── docker-compose.yml
    └── nginx/
        └── nginx.conf        # Reverse proxy for local dev
```

---

## 5. The "Lego Block" Standard Schema

Pages are **NOT** rigid database tables. They are **ordered arrays of typed blocks**.

### 5.1 Canonical Block Envelope

Every block in the `blocks` array MUST conform to this envelope:

```json
{
  "block_id": "uuid-v4-string",
  "type": "Hero",
  "order": 0,
  "visible": true,
  "data": {
    "title": "Welcome to e-con Systems",
    "subtitle": "Industry-leading embedded cameras",
    "image_url": "https://cdn.econsystems.com/media/hero-banner.webp",
    "cta_text": "Explore Products",
    "cta_link": "/products"
  }
}
```

| Field        | Type    | Required | Description                                                    |
| ------------ | ------- | -------- | -------------------------------------------------------------- |
| `block_id` | string  | YES      | UUIDv4, generated client-side on block creation.               |
| `type`     | string  | YES      | Must match a registered block type (see §5.2).                |
| `order`    | integer | YES      | 0-indexed sort position. CMS UI manages reordering.            |
| `visible`  | boolean | YES      | `false` hides block on public site without deleting it.      |
| `data`     | object  | YES      | Type-specific payload. Schema varies per `type` (see §5.2). |

### 5.2 Registered Block Types (V1)

> **Rule:** Both M3 (CMS editors) and M4 (public renderers) MUST support every type listed here. If you add a new type, update THIS table, the CMS `BlockEditorRegistry.ts`, and the Web `BlockRegistry.ts` simultaneously.

| `type` value   | `data` fields (all required unless marked optional)                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `Hero`         | `title: string`, `subtitle?: string`, `image_url: string`, `cta_text?: string`, `cta_link?: string` |
| `RichText`     | `html: string` (sanitized HTML — DOMPurify on CMS save, escaped on M4 render)                              |
| `ProductGrid`  | `heading: string`, `category: string`, `max_items: integer (1-50)`                                      |
| `ImageBanner`  | `image_url: string`, `alt_text: string`, `link?: string`                                                |
| `VideoEmbed`   | `provider: "youtube"                                                                                          |
| `FAQ`          | `heading: string`, `items: Array<{question: string, answer: string}>` (min 1, max 30)                     |
| `CTAStrip`     | `text: string`, `button_label: string`, `button_link: string`, `bg_color?: string (hex)`              |
| `Testimonials` | `heading?: string`, `items: Array<{quote: string, author: string, role?: string, avatar_url?: string}>`   |

### 5.3 Full Page Document Example

```json
{
  "_id": "ObjectId",
  "slug": "home",
  "title": "Home Page",
  "meta_description": "e-con Systems — Leading embedded camera solutions",
  "og_image_url": "https://cdn.econsystems.com/media/og-home.jpg",
  "status": "published",
  "created_by": "user-object-id",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-03-10T14:22:00Z",
  "blocks": [
    {
      "block_id": "a1b2c3d4-...",
      "type": "Hero",
      "order": 0,
      "visible": true,
      "data": {
        "title": "Welcome to e-con Systems",
        "subtitle": "20+ years of embedded vision",
        "image_url": "https://cdn.econsystems.com/media/hero.webp",
        "cta_text": "View Products",
        "cta_link": "/products"
      }
    },
    {
      "block_id": "e5f6g7h8-...",
      "type": "ProductGrid",
      "order": 1,
      "visible": true,
      "data": {
        "heading": "Featured Cameras",
        "category": "featured",
        "max_items": 8
      }
    }
  ]
}
```

---

## 6. Environment Variables Contract

Every module reads from a single `.env` file (or per-service `.env` in Docker). **No defaults for secrets in code.**

```ini
# === Shared ===
NODE_ENV=development                  # development | production
API_BASE_URL=http://localhost:8000    # M5 FastAPI base

# === M1: Database ===
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=econ_platform

# === M1: AWS S3 / Storage ===
AWS_ACCESS_KEY_ID=<from-iam>
AWS_SECRET_ACCESS_KEY=<from-iam>
AWS_REGION=ap-south-1
S3_BUCKET_NAME=econ-platform-media
CLOUDFRONT_DOMAIN=https://cdn.econsystems.com

# === M2: Auth ===
JWT_SECRET_KEY=<64-char-random-hex>      # openssl rand -hex 32
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# === M5: FastAPI ===
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
RATE_LIMIT_PER_MINUTE=60

# === M3: CMS (Vite) ===
VITE_API_BASE_URL=http://localhost:8000/api/v1

# === M4: Web (Next.js) ===
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
REVALIDATE_SECONDS=60
```

---

## 7. Security Baseline (All Modules)

> **Every agent MUST implement these. Non-negotiable.**

| Threat (OWASP)                       | Mitigation                                                                                                                | Module     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------- |
| **A01 Broken Access Control**  | RBAC middleware on every CMS route. Public routes return only `status: published` pages.                                | M2, M5     |
| **A02 Cryptographic Failures** | bcrypt (cost 12) for passwords. JWT signed with HS256 + 256-bit secret. HTTPS only in production.                         | M2, M5     |
| **A03 Injection**              | Pydantic validation on ALL inputs. Parameterized Motor queries (no string interpolation). DOMPurify on HTML blocks.       | M1, M5, M3 |
| **A04 Insecure Design**        | Pre-signed URLs expire in 5 minutes. S3 bucket is private (no public ACL). Media file types restricted.                   | M1, M5     |
| **A05 Security Misconfig**     | CORS locked to explicit origins.`HttpOnly`, `Secure`, `SameSite=Strict` on refresh token cookie. Debug off in prod. | M5         |
| **A06 Vulnerable Components**  | Pin all dependency versions. No `*` or `latest`. Run `pip audit` / `npm audit` in CI.                             | ALL        |
| **A07 Auth Failures**          | Rate-limit login to 5 attempts/min/IP. Lock account after 10 failed attempts. Constant-time password compare.             | M2, M5     |
| **A08 Integrity Failures**     | Verify S3 upload content-type matches allowed list (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`).        | M5         |
| **A09 Logging Failures**       | Structured JSON logs with correlation ID on every request. Log auth events (login, failure, token refresh).               | M5         |
| **A10 SSRF**                   | No user-supplied URLs are fetched server-side. Pre-signed URLs point only to our S3 bucket.                               | M5         |

### 7.1 Allowed Media Types

```python
ALLOWED_CONTENT_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "application/pdf",
]
MAX_FILE_SIZE_MB = 25
```

---

## 8. API Versioning & URL Convention

- All API routes are prefixed: `/api/v1/...`
- Route groups:
  - `/api/v1/auth/*` — authentication (M2 logic, M5 routes)
  - `/api/v1/cms/*` — protected CMS operations (M3 → M5)
  - `/api/v1/public/*` — unauthenticated, read-only (M4 → M5)
- Future versions use `/api/v2/...` without breaking v1.

---

## 9. Error Response Contract

All API errors MUST return this shape (M5 enforces via exception handlers):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [
      { "field": "slug", "issue": "Slug already exists" }
    ]
  }
}
```

Standard error codes:

| HTTP Status | `code` constant          | When                                                            |
| ----------- | -------------------------- | --------------------------------------------------------------- |
| 400         | `VALIDATION_ERROR`       | Pydantic or business rule validation failed                     |
| 401         | `UNAUTHORIZED`           | Missing or invalid JWT                                          |
| 403         | `FORBIDDEN`              | Valid JWT but insufficient role                                 |
| 404         | `NOT_FOUND`              | Resource does not exist                                         |
| 409         | `CONFLICT`               | Duplicate slug, email already registered                        |
| 413         | `PAYLOAD_TOO_LARGE`      | File exceeds `MAX_FILE_SIZE_MB`                               |
| 415         | `UNSUPPORTED_MEDIA_TYPE` | File type not in `ALLOWED_CONTENT_TYPES`                      |
| 429         | `RATE_LIMITED`           | Too many requests                                               |
| 500         | `INTERNAL_ERROR`         | Unhandled server error (log full trace, return generic message) |

---

## 10. Local Development Setup

```bash
# 1. Clone and install
git clone <repo-url> && cd econ-platform
cp .env.example .env  # Fill in real values

# 2. Start infrastructure (MongoDB + MinIO + Redis)
docker-compose up -d

# 3. Backend (M5)
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. CMS (M3)
cd ../cms
npm install
npm run dev  # Vite → localhost:5173

# 5. Web (M4)
cd ../web
npm install
npm run dev  # Next.js → localhost:3000
```

---

## 11. Testing Strategy

| Layer    | Tool                           | Coverage target | What to test                                  |
| -------- | ------------------------------ | --------------- | --------------------------------------------- |
| Backend  | pytest + httpx (AsyncClient)   | ≥ 80 %         | Every route, auth flows, RBAC, edge cases     |
| CMS (M3) | Vitest + React Testing Library | ≥ 70 %         | Form submission, block editor CRUD, auth flow |
| Web (M4) | Jest + React Testing Library   | ≥ 70 %         | Block rendering, error boundaries, SEO meta   |
| E2E      | Playwright (future)            | Critical paths  | Login → create page → publish → view on M4 |

---

## 12. Inter-Module Communication Cheat Sheet

| From → To    | Method                                    | Auth required?   | Endpoint pattern             |
| ------------- | ----------------------------------------- | ---------------- | ---------------------------- |
| M3 → M5      | Axios `POST`/`PUT`/`GET`/`DELETE` | YES (JWT)        | `/api/v1/cms/*`            |
| M3 → S3      | Browser `PUT` (pre-signed URL)          | N/A (pre-signed) | `https://s3.../object-key` |
| M4 → M5      | `fetch()` server-side in Next.js        | NO               | `/api/v1/public/*`         |
| M5 → MongoDB | Motor async CRUD                          | N/A (internal)   | —                           |
| M5 → S3      | Boto3 `generate_presigned_post`         | N/A (IAM role)   | —                           |
