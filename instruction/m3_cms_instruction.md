# Module 3: CMS & Admin Portal — Complete Instructions

---

## 1. Objective

Build a **secure Single Page Application (SPA)** for the internal team (Admins and Marketing) to manage dynamic page content and media. This is the authoring tool — everything here produces JSON that the public site (M4) renders.

> **YOUR SCOPE:** All files inside `cms/` (React app), except `cms/src/auth/` which M2 owns.  
> **NOT YOUR SCOPE:** Backend routes (M5), database models (M1), auth utilities (M2 backend), public site (M4).  
> **DEPENDENCY:** You consume M2's `useAuth` hook and `ProtectedRoute` component. You call M5's API endpoints via the Axios client from `cms/src/api/client.ts` (M2 sets up the interceptor, you use it).

---

## 2. Tech Stack (Exact Versions)

```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "react-router-dom": "^6.26.0",
  "vite": "^5.4.0",
  "tailwindcss": "^3.4.0",
  "@tanstack/react-query": "^5.50.0",
  "axios": "^1.7.0",
  "dompurify": "^3.1.0",
  "uuid": "^10.0.0",
  "typescript": "^5.5.0"
}
```

> Pin these in `package.json`. No `*` or `latest`.

---

## 3. Project Structure

```
cms/src/
├── main.tsx                    # ReactDOM.createRoot, QueryClientProvider, RouterProvider
├── App.tsx                     # Route definitions
│
├── api/
│   ├── client.ts               # Axios instance (M2 owns interceptor logic)
│   └── endpoints.ts            # Typed API call functions (this module owns)
│
├── auth/                       # M2 OWNS — do NOT modify
│   ├── AuthProvider.tsx
│   ├── LoginPage.tsx
│   ├── ProtectedRoute.tsx
│   └── useAuth.ts
│
├── pages/
│   ├── DashboardPage.tsx       # Page list view
│   ├── PageEditorPage.tsx      # Lego block builder
│   └── MediaManagerPage.tsx    # Upload + browse media
│
├── components/
│   ├── blocks/                 # Block-type editor forms
│   │   ├── HeroBlockEditor.tsx
│   │   ├── RichTextBlockEditor.tsx
│   │   ├── ProductGridBlockEditor.tsx
│   │   ├── ImageBannerBlockEditor.tsx
│   │   ├── VideoEmbedBlockEditor.tsx
│   │   ├── FAQBlockEditor.tsx
│   │   ├── CTAStripBlockEditor.tsx
│   │   ├── TestimonialsBlockEditor.tsx
│   │   └── BlockEditorRegistry.ts
│   ├── ui/                     # Reusable atoms (Button, Input, Modal, Toast, etc.)
│   └── layout/
│       ├── AppShell.tsx        # Sidebar + topbar + main content area
│       └── Sidebar.tsx
│
├── hooks/
│   ├── usePages.ts             # React Query hooks for page CRUD
│   └── useMedia.ts             # React Query hooks for media operations
│
├── types/
│   └── index.ts                # Shared TypeScript interfaces (MUST match M0 §5)
│
└── utils/
    ├── sanitize.ts             # DOMPurify wrapper
    └── validation.ts           # Client-side form validators
```

---

## 4. TypeScript Types — `cms/src/types/index.ts`

> These MUST match M0 §5 and M1 models exactly. Copy-paste precision.

```typescript
// === Block Types ===
export type BlockType =
  | "Hero"
  | "RichText"
  | "ProductGrid"
  | "ImageBanner"
  | "VideoEmbed"
  | "FAQ"
  | "CTAStrip"
  | "Testimonials";

export interface BlockEnvelope {
  block_id: string;    // UUIDv4
  type: BlockType;
  order: number;       // 0-indexed
  visible: boolean;
  data: Record<string, unknown>;
}

// === Block Data Interfaces ===
export interface HeroData {
  title: string;
  subtitle?: string;
  image_url: string;
  cta_text?: string;
  cta_link?: string;
}

export interface RichTextData {
  html: string;  // Sanitized HTML
}

export interface ProductGridData {
  heading: string;
  category: string;
  max_items: number;  // 1-50
}

export interface ImageBannerData {
  image_url: string;
  alt_text: string;
  link?: string;
}

export interface VideoEmbedData {
  provider: "youtube" | "vimeo";
  video_id: string;
  title: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQData {
  heading: string;
  items: FAQItem[];  // 1-30 items
}

export interface CTAStripData {
  text: string;
  button_label: string;
  button_link: string;
  bg_color?: string;  // Hex #RRGGBB
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  avatar_url?: string;
}

export interface TestimonialsData {
  heading?: string;
  items: TestimonialItem[];  // 1-20 items
}

// === Page Types ===
export type PageStatus = "draft" | "published" | "archived";

export interface Page {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  og_image_url: string | null;
  status: PageStatus;
  blocks: BlockEnvelope[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PageListItem {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  updated_at: string;
}

export interface PageCreate {
  slug: string;
  title: string;
  meta_description?: string;
  og_image_url?: string;
}

export interface PageUpdate {
  title?: string;
  meta_description?: string;
  og_image_url?: string;
  status?: PageStatus;
  blocks?: BlockEnvelope[];
}

// === Media Types ===
export type MediaContentType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/svg+xml"
  | "video/mp4"
  | "application/pdf";

export interface MediaItem {
  id: string;
  file_name: string;
  cloudfront_url: string;
  content_type: string;
  file_size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

export interface PresignedUrlResponse {
  presigned_url: string;
  s3_key: string;
  fields: Record<string, string>;  // Additional POST fields
}

// === API Error ===
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
}

// === User (from M2 auth context) ===
export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "marketing" | "inventory";
}
```

---

## 5. API Endpoints File — `cms/src/api/endpoints.ts`

> All API calls are typed functions. NEVER call `axios.get/post` directly in components — always go through these functions.

```typescript
import { apiClient } from "./client";
import type {
  Page, PageListItem, PageCreate, PageUpdate,
  MediaItem, PresignedUrlResponse, MediaContentType,
} from "../types";

// === Pages ===
export async function fetchPages(): Promise<PageListItem[]> {
  const { data } = await apiClient.get<PageListItem[]>("/cms/pages");
  return data;
}

export async function fetchPage(slug: string): Promise<Page> {
  const { data } = await apiClient.get<Page>(`/cms/pages/${encodeURIComponent(slug)}`);
  return data;
}

export async function createPage(payload: PageCreate): Promise<Page> {
  const { data } = await apiClient.post<Page>("/cms/pages", payload);
  return data;
}

export async function updatePage(slug: string, payload: PageUpdate): Promise<Page> {
  const { data } = await apiClient.put<Page>(`/cms/pages/${encodeURIComponent(slug)}`, payload);
  return data;
}

export async function deletePage(slug: string): Promise<void> {
  await apiClient.delete(`/cms/pages/${encodeURIComponent(slug)}`);
}

// === Media ===
export async function fetchMedia(): Promise<MediaItem[]> {
  const { data } = await apiClient.get<MediaItem[]>("/cms/media");
  return data;
}

export async function requestPresignedUrl(
  fileName: string,
  contentType: MediaContentType,
): Promise<PresignedUrlResponse> {
  const { data } = await apiClient.post<PresignedUrlResponse>("/cms/media/presigned-url", {
    file_name: fileName,
    content_type: contentType,
  });
  return data;
}

export async function confirmUpload(
  s3Key: string,
  fileName: string,
  contentType: MediaContentType,
  fileSizeBytes: number,
): Promise<MediaItem> {
  const { data } = await apiClient.post<MediaItem>("/cms/media/confirm", {
    s3_key: s3Key,
    file_name: fileName,
    content_type: contentType,
    file_size_bytes: fileSizeBytes,
  });
  return data;
}
```

---

## 6. Core Feature: Dashboard Page

### 6.1 `DashboardPage.tsx` — Specification

**Data source:** `GET /api/v1/cms/pages` → returns `PageListItem[]`

**UI layout:**
- Header: "Pages" title + "Create New Page" button (top-right)
- Table with columns: Title (link to editor), Slug, Status (colored badge), Last Updated (relative time)
- Status badges: `draft` = yellow, `published` = green, `archived` = gray
- Empty state: illustration + "No pages yet. Create your first page."
- Loading state: skeleton rows (6 rows, Tailwind `animate-pulse`)
- Error state: red banner with retry button

**Behavior:**
- Use `useQuery` from `@tanstack/react-query` with key `["pages"]`.
- Click on a page row → navigate to `/pages/:slug/edit`.
- "Create New Page" → open a modal with `PageCreate` form (slug, title, meta_description).
- On successful create → invalidate `["pages"]` query + navigate to new page editor.

---

## 7. Core Feature: Page Editor (Lego Block Builder)

### 7.1 `PageEditorPage.tsx` — Specification

This is the single most complex component. Build it in logical sub-components.

**URL:** `/pages/:slug/edit`

**Data source:** `GET /api/v1/cms/pages/:slug` → returns `Page`

**Layout (top to bottom):**

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard        Page: "Home Page"    [Save] [Publish] │
├─────────────────────────────────────────────────────────────┤
│ Metadata Section (collapsible)                               │
│   Title: [____________]                                      │
│   Slug:  home (read-only after creation)                    │
│   Meta Description: [_______________________________]        │
│   OG Image: [Upload / Select from Media] [preview]          │
├─────────────────────────────────────────────────────────────┤
│ Blocks Section                                               │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Block 1: Hero                          [▲] [▼] [👁] [✕] ││
│ │ ┌──────────────────────────────────────────────────────┐ ││
│ │ │ Title: [Welcome to e-con Systems                   ] │ ││
│ │ │ Subtitle: [20+ years of embedded vision            ] │ ││
│ │ │ Image: [Select from Media Manager]                   │ ││
│ │ │ CTA Text: [View Products]  CTA Link: [/products]    │ ││
│ │ └──────────────────────────────────────────────────────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Block 2: ProductGrid                   [▲] [▼] [👁] [✕] ││
│ │ ┌──────────────────────────────────────────────────────┐ ││
│ │ │ Heading: [Featured Cameras]                          │ ││
│ │ │ Category: [featured]  Max Items: [8]                 │ ││
│ │ └──────────────────────────────────────────────────────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│               [+ Add Block]                                  │
│               (opens block type selector dropdown)           │
└─────────────────────────────────────────────────────────────┘
```

**Block operations:**
| Action | Button | Behavior |
|--------|--------|----------|
| Move up | ▲ | Swap `order` with previous block. Disabled on first block. |
| Move down | ▼ | Swap `order` with next block. Disabled on last block. |
| Toggle visibility | 👁 | Toggle `visible` flag. Dim the block card when hidden. |
| Delete | ✕ | Confirm modal → remove block from array. |
| Add block | + Add Block | Dropdown of all block types → inserts new block at end with `block_id: uuid()`, `order: blocks.length`, `visible: true`, `data: {}`. |

**Save behavior:**
1. Collect all metadata + blocks array into a `PageUpdate` object.
2. Re-normalize `order` values (0, 1, 2, ...) based on current array position.
3. Sanitize any HTML content in RichText blocks using DOMPurify BEFORE sending.
4. Call `updatePage(slug, payload)` — use `useMutation` with `onSuccess: invalidateQueries(["pages", slug])`.
5. Show success toast. Show error toast on failure with the API error message.

**Publish behavior:**
- Same as save, but also sets `status: "published"`.
- Confirm modal: "Publishing will make this page live. Continue?"

**Unsaved changes guard:**
- Track dirty state. If user navigates away with unsaved changes, show browser `beforeunload` confirmation.
- Use `useBlocker` from React Router for in-app navigation.

---

### 7.2 Block Editor Registry — `cms/src/components/blocks/BlockEditorRegistry.ts`

```typescript
import type { ComponentType } from "react";
import type { BlockType, BlockEnvelope } from "../../types";

import { HeroBlockEditor } from "./HeroBlockEditor";
import { RichTextBlockEditor } from "./RichTextBlockEditor";
import { ProductGridBlockEditor } from "./ProductGridBlockEditor";
import { ImageBannerBlockEditor } from "./ImageBannerBlockEditor";
import { VideoEmbedBlockEditor } from "./VideoEmbedBlockEditor";
import { FAQBlockEditor } from "./FAQBlockEditor";
import { CTAStripBlockEditor } from "./CTAStripBlockEditor";
import { TestimonialsBlockEditor } from "./TestimonialsBlockEditor";

export interface BlockEditorProps {
  block: BlockEnvelope;
  onChange: (updatedData: Record<string, unknown>) => void;
}

const registry: Record<BlockType, ComponentType<BlockEditorProps>> = {
  Hero: HeroBlockEditor,
  RichText: RichTextBlockEditor,
  ProductGrid: ProductGridBlockEditor,
  ImageBanner: ImageBannerBlockEditor,
  VideoEmbed: VideoEmbedBlockEditor,
  FAQ: FAQBlockEditor,
  CTAStrip: CTAStripBlockEditor,
  Testimonials: TestimonialsBlockEditor,
};

export function getBlockEditor(type: BlockType): ComponentType<BlockEditorProps> {
  const Editor = registry[type];
  if (!Editor) {
    throw new Error(`No editor registered for block type: ${type}`);
  }
  return Editor;
}
```

### 7.3 Block Editor Component Pattern (Each Editor Follows This)

Every `*BlockEditor.tsx` component:

1. Receives `block` and `onChange` props.
2. Renders form inputs for the block's `data` fields (per M0 §5.2 table).
3. Calls `onChange(updatedData)` on every field change (controlled components).
4. Validates required fields and shows inline error messages.
5. For image fields: render a "Select Image" button that opens the Media Manager as a modal/picker.

**Example — HeroBlockEditor.tsx pattern:**
```tsx
export function HeroBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as HeroData; // Type assertion — safe because type is checked by registry

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          type="text"
          value={data.title ?? ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      {/* subtitle, image_url (media picker), cta_text, cta_link */}
    </div>
  );
}
```

---

## 8. Core Feature: Media Manager

### 8.1 `MediaManagerPage.tsx` — Specification

**Data source:** `GET /api/v1/cms/media` → returns `MediaItem[]`

**Layout:**
- Header: "Media Library" title + "Upload" button
- Grid of media cards (4 columns on desktop, 2 on mobile)
- Each card: thumbnail (or file icon for PDF/video), file name, upload date, "Copy URL" button
- Upload modal: drag-and-drop zone + file input fallback

**Upload flow (step by step):**

1. User selects file(s) via drag-and-drop or file picker.
2. **Client validation BEFORE upload:**
   - File size ≤ 25 MB
   - MIME type in allowed list (see M0 §7.1)
   - Show error toast if validation fails — do NOT call API.
3. Call `requestPresignedUrl(fileName, contentType)` → get `{ presigned_url, s3_key, fields }`.
4. Upload binary file directly to S3 via `PUT` request to `presigned_url`:
   ```typescript
   await axios.put(presignedUrl, file, {
     headers: { "Content-Type": file.type },
   });
   ```
5. Call `confirmUpload(s3Key, fileName, contentType, file.size)` → get `MediaItem`.
6. Invalidate `["media"]` query → grid refreshes with new item.
7. Show success toast.

**Error handling:**
- S3 upload failure → show "Upload failed" toast + allow retry.
- Confirm API failure → show error toast. The orphaned S3 object will be cleaned up by a lifecycle rule (not this module's concern).

**"Copy URL" button:**
- Copies `cloudfront_url` to clipboard using `navigator.clipboard.writeText()`.
- Show brief "Copied!" tooltip animation.

### 8.2 Media Picker (Reusable Modal for Page Editor)

Create `cms/src/components/MediaPicker.tsx`:

- Triggered from block editors when an image field is needed.
- Opens as a modal overlay.
- Shows the same media grid as `MediaManagerPage` (reuse the grid component).
- Click on a media item → calls `onSelect(cloudfront_url)` callback → closes modal.
- Also includes "Upload New" button that shows upload flow inline.

---

## 9. Routing Configuration — `cms/src/App.tsx`

```typescript
// Route structure:
// /login              → LoginPage (M2) — public, no auth required
// /                   → Redirect to /dashboard
// /dashboard          → ProtectedRoute → DashboardPage
// /pages/:slug/edit   → ProtectedRoute → PageEditorPage
// /media              → ProtectedRoute → MediaManagerPage
// *                   → 404 Not Found page
```

**ProtectedRoute usage:**
```tsx
<Route element={<ProtectedRoute allowedRoles={["admin", "marketing"]} />}>
  <Route path="/dashboard" element={<DashboardPage />} />
  <Route path="/pages/:slug/edit" element={<PageEditorPage />} />
  <Route path="/media" element={<MediaManagerPage />} />
</Route>
```

---

## 10. Security Requirements (CMS-Specific)

| Threat                | Mitigation                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| XSS via RichText      | ALL HTML from RichText block editors MUST pass through DOMPurify before being stored or rendered. |
| XSS via image URLs    | Validate that `image_url` and `cloudfront_url` start with `https://`. No `javascript:` URLs.    |
| CSRF                  | Axios sends JWT in `Authorization` header (not cookies), so CSRF is not applicable for API calls. Refresh token cookie is `SameSite=Strict`. |
| Clickjacking          | CMS should set `X-Frame-Options: DENY` via Vite config or meta tag.                            |
| Open redirect         | `cta_link` fields: allow only relative paths (starting with `/`) or `https://` URLs.           |

### 10.1 DOMPurify Wrapper — `cms/src/utils/sanitize.ts`

```typescript
import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre",
  "img", "span", "div", "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "target", "rel"];

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],  // Allow target="_blank" for links
  });
}
```

> **CRITICAL:** Call `sanitizeHtml()` on RichText `data.html` **before** saving (in the page editor save handler). The backend (M5) will also sanitize — defense in depth.

---

## 11. UI/UX Standards

| Aspect               | Rule                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| Loading states        | Skeleton placeholders, never blank screens.                                |
| Error states          | Red banner/toast with message + retry action where applicable.             |
| Success feedback      | Green toast (auto-dismiss after 3 s).                                      |
| Destructive actions   | Confirm modal with action name in the confirm button ("Delete Page").      |
| Mobile                | Sidebar collapses to hamburger. Tables become card lists. Min-width: 768px.|
| Keyboard navigation   | All interactive elements focusable. Enter/Space activates. Escape closes modals. |
| Form validation       | Inline errors below fields. Red border on invalid. Disable submit until valid. |

---

## 12. React Query Configuration

```typescript
// In main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 seconds before refetch
      retry: 1,                // Retry once on failure
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 13. Checklist Before Marking M3 Complete

- [ ] `DashboardPage`: Lists pages, links to editor, create modal works.
- [ ] `PageEditorPage`: Renders blocks from API, supports add/remove/reorder/toggle visibility.
- [ ] `BlockEditorRegistry`: All 8 block types registered with corresponding editor components.
- [ ] Each block editor: renders correct form fields per M0 §5.2, calls `onChange` correctly.
- [ ] `MediaManagerPage`: Shows media grid, upload flow works end-to-end (presigned URL → S3 → confirm).
- [ ] `MediaPicker`: Reusable modal, selectable items, "Upload New" works.
- [ ] All API calls go through `endpoints.ts` — no raw Axios calls in components.
- [ ] DOMPurify sanitization applied to ALL RichText HTML before save.
- [ ] URL validation: only `https://` or relative `/path` allowed in link fields.
- [ ] File upload validation: type + size checked client-side before API call.
- [ ] Loading, error, and empty states implemented for every data-fetching view.
- [ ] Protected routes enforce authentication + role check.
- [ ] TypeScript strict mode, zero `any` types, zero lint errors.
