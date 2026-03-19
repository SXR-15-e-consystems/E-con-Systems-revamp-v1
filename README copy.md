# e-con Systems Platform Revamp v1.0

A modular, CMS-driven web platform built on the **"Lego Block"** architecture — pages are composed of typed, ordered JSON blocks rendered dynamically by React components.

## Architecture

| Module | Name | Stack | Purpose |
|--------|------|-------|---------|
| **M0** | Foundation | — | Master architecture doc, contracts, security baseline |
| **M1** | Data & Storage | MongoDB 7 + AWS S3 + CloudFront | Pydantic schemas, indexes, S3 bucket architecture |
| **M2** | Identity Management | Python + React | JWT auth, bcrypt hashing, RBAC, login UI |
| **M3** | CMS Admin Portal | React 18 + Vite 5 + Tailwind 3 | Block-based page builder, media manager |
| **M4** | Public Frontend | Next.js 14 + Tailwind 3 + shadcn/ui | SEO-optimized read-only site with ISR |
| **M5** | Core API Engine | FastAPI + Motor + Boto3 | Central backend: auth, CRUD, S3 presigned URLs |

## Data Flow

```
M3 (CMS) ──► M5 (FastAPI) ──► M1 (MongoDB + S3)
                  ▲
M4 (Next.js) ────┘
```

- Frontends **never** touch the database directly.
- All communication goes through M5's REST API (`/api/v1/*`).
- M4 (public) only hits unauthenticated read-only endpoints.

## Quick Start

```bash
cp .env.example .env             # Fill in secrets
docker-compose up -d             # MongoDB, Redis, MinIO
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
cd cms && npm install && npm run dev       # localhost:5173
cd web && npm install && npm run dev       # localhost:3000
```

## Instruction Files

Detailed build instructions for each module are in `/instruction/`:

- [m0_main_foundation.md](instruction/m0_main_foundation.md) — Master architecture, security, contracts
- [m1_database_storage_instruction.md](instruction/m1_database_storage_instruction.md) — MongoDB schemas, S3 setup
- [m2_ims_instruction.md](instruction/m2_ims_instruction.md) — Auth system, JWT, login UI
- [m3_cms_instruction.md](instruction/m3_cms_instruction.md) — CMS page builder, media manager
- [m4_frontend_instruction.md](instruction/m4_frontend_instruction.md) — Public Next.js site
- [m5_fastapi_instruction.md](instruction/m5_fastapi_instruction.md) — FastAPI routes, services, middleware
