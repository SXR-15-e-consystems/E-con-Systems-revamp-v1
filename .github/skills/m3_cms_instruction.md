# Module 3: CMS & Admin Portal Instructions

## 🎯 Objective

Build a secure Single Page Application (SPA) for the internal team to manage dynamic page content and media.

## 🛠️ Tech Stack

- React, Vite, Tailwind CSS, React Router, React Query (for API state).

## 🖥️ Core Features to Build

1. **Dashboard:** Lists all pages fetched from M5 (`GET /api/v1/cms/pages`).
2. **The "Lego Box" Page Builder:**
   - A visual editor to create a page.
   - Users can click "Add Block". They select a block type (e.g., "Hero").
   - A form renders based on the block type. (e.g., if Hero, it shows inputs for `Title` and `Image Upload`).
   - The UI outputs a final JSON array of blocks and sends it via `PUT /api/v1/cms/pages/{slug}`.
3. **Media Manager:**
   - An interface to upload images.
   - Must request a pre-signed URL from M5, upload the binary file directly to S3 via `PUT`, and save the result.
   - Allows users to copy the CloudFront URL to paste into their Lego blocks.
