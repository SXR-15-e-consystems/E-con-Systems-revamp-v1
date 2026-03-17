# Module 4: User-Facing Web Instructions

## 🎯 Objective

Build a blazing-fast, read-only Next.js frontend that dynamically renders components based on the MongoDB JSON block array.

## 🛠️ Tech Stack

- Next.js (App Router), React, Tailwind CSS, shadcn/ui.

## 🏗️ Architecture to Build

1. **Dynamic Catch-all Route:** Create `app/[...slug]/page.tsx`. This single file handles EVERY dynamic page (Home, Products, Webinars).
2. **Data Fetching:** Inside the page component, fetch data from M5 (`GET /api/v1/public/pages/{slug}`). Use Next.js `revalidate` for Incremental Static Regeneration (ISR) to ensure blazing-fast SEO.
3. **The Component Registry:**
   - Create a `components/blocks/` directory.
   - Build individual UI components using Tailwind (e.g., `HeroBlock.tsx`, `ProductGridBlock.tsx`).
   - Create `BlockRegistry.ts` mapping the JSON `type` string to the React component.
4. **The Page Builder Renderer:**
   - Create a component that accepts the `blocks` array from the API.
   - Map over the array: `<BlockComponent key={index} {...blockData} />`.

## ⚠️ Strict Rules

- NO DATABASE CONNECTIONS HERE. Next.js only talks to the M5 FastAPI public routes.
- NO COMPLEX LOGIC. This app strictly reads JSON and paints the UI.
-
