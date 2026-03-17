# Master Architecture Foundation: Project "Lego Block"

## 🏢 System Overview

This is a highly scalable, decoupled web platform designed around a "Dynamic Block" (Lego) architecture. The system consists of 5 distinct modules. Development is handled by an AI swarm working in parallel.

## 🤖 Rules of Engagement for AI Swarm

1. **Zero Overlap:** You will only work on your assigned module. Do not write code for other modules.
2. **API-First Contract:** All communication between frontends (M3, M4) and the database (M1) MUST go through the Core API Engine (M5). Frontends NEVER query the database directly.
3. **Token Efficiency:** Write DRY (Don't Repeat Yourself) code. Use utility functions. Do not hallucinate massive CSS files; use Tailwind utility classes.
4. **Single Source of Truth:** FastAPI's auto-generated OpenAPI (Swagger) is the strict contract for all data structures.

## 🏗️ The 5 Modules

* **M1: Data & Storage Layer:** MongoDB (Dynamic JSON schemas) + AWS S3 + CloudFront (CDN).
* **M2: IMS (Identity Management System):** Custom Auth. JWT-based, bcrypt password hashing, RBAC (Role-Based Access Control) built into the Python backend.
* **M3: CMS (Content Management System):** React + Vite SPA. Internal admin dashboard for Marketing/Admins to build pages via JSON blocks and upload media.
* **M4: User-Facing Web:** Next.js (App Router) + Tailwind + shadcn/ui. Strictly read-only public frontend. Uses a Block Registry to dynamically render React components based on database JSON. Uses ISR for SEO.
* **M5: Core Engine:** Python FastAPI. The central router handling all DB queries, S3 presigned URLs, and Auth logic.

## 🧱 The "Lego Block" Standard Schema

Pages are NOT rigid tables. They are arrays of blocks.

```json
{
  "page_slug": "home-page",
  "status": "published",
  "blocks":[
    { "type": "Hero", "title": "Welcome", "image_url": "https://cdn.domain.com/img1.jpg" },
    { "type": "ProductGrid", "category": "featured" }
  ]
}
```
