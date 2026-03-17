# Module 5: Core API Engine (FastAPI) Instructions

## 🎯 Objective

Build the highly scalable Python FastAPI backend. This is the central brain of the system.

## 🛠️ Tech Stack

- Python 3.11+, FastAPI, Motor (Async MongoDB), Boto3 (AWS S3), PyJWT, Passlib (bcrypt).

## 🚦 Required API Routes (Controllers)

### 1. Auth Router (`/api/v1/auth`) -> Ties into M2

- `POST /login`: Accepts email/password, returns `access_token` (JWT) and `refresh_token`.
- `GET /me`: Returns current logged-in user details (requires JWT).

### 2. CMS Router (`/api/v1/cms`) -> Ties into M3 (Requires Admin/Marketing JWT)

- `POST /pages`: Create a new page.
- `PUT /pages/{slug}`: Update the JSON `blocks` array.
- `POST /media/presigned-url`: Generates a Boto3 pre-signed URL for frontend direct-to-S3 uploads.
- `POST /media/confirm`: Saves the uploaded S3 file data to MongoDB and returns the CloudFront CDN URL.

### 3. Public Router (`/api/v1/public`) -> Ties into M4 (No Auth Required)

- `GET /pages/{slug}`: Returns the exact JSON structure of a published page. Must be highly optimized (add Redis caching layer later, but set up standard async MongoDB query for now).

## 🔐 Middleware

- Build a generic JWT validation dependency (`get_current_user`) to protect CMS routes.
- Implement RBAC (Role-Based Access Control) dependency (`require_role(['Admin', 'Marketing'])`).
