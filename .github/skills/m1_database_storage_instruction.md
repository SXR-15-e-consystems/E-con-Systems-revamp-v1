---
### 2. `m1_database_storage_instruction.md`
*(Instruction for the Database/Data Modeling Agent)*

```markdown
# Module 1: Database & Storage Instructions

## 🎯 Objective
Design the MongoDB schemas (using Pydantic/Motor for FastAPI) and AWS S3 architecture for the platform.

## 🗄️ MongoDB Collections & Schemas
You must define the strict Pydantic models for the following collections:

1. **`users` (For M2 - IMS)**
   - `_id`, `email`, `hashed_password`, `role` (Enum: Admin, Marketing, Inventory), `is_active`, `created_at`.
2. **`pages` (For M3 & M4 - CMS/Web)**
   - `_id`, `slug` (unique, e.g., "/products/lego"), `title`, `meta_description`, `status` (Draft, Published).
   - `blocks` (Array of JSON objects. Must accept dynamic schema where `type` dictates the required fields).
3. **`media` (Asset Tracking)**
   - `_id`, `file_name`, `s3_key`, `cloudfront_url`, `uploaded_by` (User ID), `created_at`.

## ☁️ Storage Architecture (S3 + CloudFront)
- **Rule:** Images are NEVER saved to MongoDB. MongoDB only stores the `cloudfront_url`.
- **Upload Flow:** Frontend (M3) requests an S3 Pre-signed POST URL from FastAPI (M5). Frontend uploads file directly to S3. Frontend sends S3 Key to FastAPI to save in the `media` collection.
---
