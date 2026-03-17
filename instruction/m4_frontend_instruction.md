# Module 4: User-Facing Web (Public Frontend) — Complete Instructions

---

## 1. Objective

Build a **blazing-fast, read-only, SEO-optimized Next.js frontend** that dynamically renders React components based on the JSON block array fetched from the API. This is the public face of e-con Systems — performance, accessibility, and visual polish are paramount.

> **YOUR SCOPE:** All files inside `web/` (Next.js app).  
> **NOT YOUR SCOPE:** Backend (M5), CMS (M3), auth (M2), database (M1).  
> **HARD RULES:**  
> - **NO database connections.** Next.js only talks to M5's public API.  
> - **NO complex business logic.** This app reads JSON and paints UI.  
> - **NO authentication.** All data comes from unauthenticated public endpoints.  
> - **NO writes.** This site NEVER sends POST/PUT/DELETE to the API.

---

## 2. Tech Stack (Exact Versions)

```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "tailwindcss": "^3.4.0",
  "@radix-ui/react-*": "latest stable",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.4.0",
  "lucide-react": "^0.400.0",
  "typescript": "^5.5.0"
}
```

> Use `shadcn/ui` as a component library (copy-paste, not a dependency). Initialize with `npx shadcn-ui@latest init`.

---

## 3. Project Structure

```
web/
├── app/
│   ├── layout.tsx              # Root layout: HTML, metadata, fonts, header/footer
│   ├── page.tsx                # Home page: fetches slug "home"
│   ├── [...slug]/
│   │   └── page.tsx            # Dynamic catch-all: fetches any slug
│   ├── not-found.tsx           # Custom 404 page
│   ├── error.tsx               # Global error boundary (client component)
│   └── loading.tsx             # Global loading skeleton
│
├── components/
│   ├── blocks/                 # Block renderers (one per block type)
│   │   ├── HeroBlock.tsx
│   │   ├── RichTextBlock.tsx
│   │   ├── ProductGridBlock.tsx
│   │   ├── ImageBannerBlock.tsx
│   │   ├── VideoEmbedBlock.tsx
│   │   ├── FAQBlock.tsx
│   │   ├── CTAStripBlock.tsx
│   │   ├── TestimonialsBlock.tsx
│   │   ├── BlockRegistry.ts   # Maps type string → component
│   │   └── BlockRenderer.tsx  # Iterates blocks array, resolves + renders
│   │
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── accordion.tsx      # For FAQ block
│   │   └── ... (as needed)
│   │
│   └── layout/
│       ├── Header.tsx          # Site header with navigation
│       ├── Footer.tsx          # Site footer
│       └── Container.tsx       # Max-width wrapper
│
├── lib/
│   ├── api.ts                 # Server-side fetch wrapper
│   ├── constants.ts           # API_BASE_URL, REVALIDATE_SECONDS
│   └── utils.ts               # cn() helper for tailwind-merge
│
├── types/
│   └── index.ts               # TypeScript interfaces (MUST match M0 §5)
│
├── public/
│   ├── favicon.ico
│   └── robots.txt
│
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. TypeScript Types — `web/types/index.ts`

> Must be identical to M3's types (from M0 §5). This is the shared contract.

```typescript
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
  block_id: string;
  type: BlockType;
  order: number;
  visible: boolean;
  data: Record<string, unknown>;
}

export interface HeroData {
  title: string;
  subtitle?: string;
  image_url: string;
  cta_text?: string;
  cta_link?: string;
}

export interface RichTextData {
  html: string;
}

export interface ProductGridData {
  heading: string;
  category: string;
  max_items: number;
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
  items: FAQItem[];
}

export interface CTAStripData {
  text: string;
  button_label: string;
  button_link: string;
  bg_color?: string;
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  avatar_url?: string;
}

export interface TestimonialsData {
  heading?: string;
  items: TestimonialItem[];
}

export type PageStatus = "draft" | "published" | "archived";

export interface PageResponse {
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
```

---

## 5. API Fetch Layer — `web/lib/api.ts`

```typescript
import { REVALIDATE_SECONDS, API_BASE_URL } from "./constants";
import type { PageResponse } from "@/types";

/**
 * Fetch a published page by slug from the M5 public API.
 * - Server-side ONLY (called in Server Components / generateMetadata).
 * - Uses Next.js ISR with configurable revalidation.
 * - Returns null if not found (404).
 * - Throws on network/server errors (caught by error.tsx boundary).
 */
export async function fetchPublicPage(slug: string): Promise<PageResponse | null> {
  // Sanitize slug: remove leading/trailing slashes, encode path segments
  const cleanSlug = slug
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  const url = `${API_BASE_URL}/public/pages/${cleanSlug}`;

  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<PageResponse>;
}
```

### `web/lib/constants.ts`

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
export const REVALIDATE_SECONDS = Number(process.env.REVALIDATE_SECONDS ?? "60");
export const SITE_NAME = "e-con Systems";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.e-consystems.com";
```

---

## 6. Dynamic Catch-All Route — `web/app/[...slug]/page.tsx`

This single file handles **every** dynamic page.

```typescript
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { fetchPublicPage } from "@/lib/api";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

interface Props {
  params: { slug: string[] };
}

// === Dynamic Metadata for SEO ===
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug.join("/");
  const page = await fetchPublicPage(slug);

  if (!page) {
    return { title: `Page Not Found — ${SITE_NAME}` };
  }

  return {
    title: `${page.title} — ${SITE_NAME}`,
    description: page.meta_description || undefined,
    openGraph: {
      title: page.title,
      description: page.meta_description || undefined,
      url: `${SITE_URL}/${page.slug}`,
      siteName: SITE_NAME,
      images: page.og_image_url ? [{ url: page.og_image_url }] : [],
      type: "website",
    },
    alternates: {
      canonical: `${SITE_URL}/${page.slug}`,
    },
  };
}

// === Page Component ===
export default async function DynamicPage({ params }: Props) {
  const slug = params.slug.join("/");
  const page = await fetchPublicPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <main>
      <BlockRenderer blocks={page.blocks} />
    </main>
  );
}
```

### Home Page — `web/app/page.tsx`

```typescript
// Home page fetches the "home" slug
import { fetchPublicPage } from "@/lib/api";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { notFound } from "next/navigation";

export default async function HomePage() {
  const page = await fetchPublicPage("home");
  if (!page) notFound();
  return (
    <main>
      <BlockRenderer blocks={page.blocks} />
    </main>
  );
}
```

---

## 7. Block Rendering System

### 7.1 Block Registry — `web/components/blocks/BlockRegistry.ts`

```typescript
import type { ComponentType } from "react";
import type { BlockType, BlockEnvelope } from "@/types";

import { HeroBlock } from "./HeroBlock";
import { RichTextBlock } from "./RichTextBlock";
import { ProductGridBlock } from "./ProductGridBlock";
import { ImageBannerBlock } from "./ImageBannerBlock";
import { VideoEmbedBlock } from "./VideoEmbedBlock";
import { FAQBlock } from "./FAQBlock";
import { CTAStripBlock } from "./CTAStripBlock";
import { TestimonialsBlock } from "./TestimonialsBlock";

export interface BlockProps {
  data: Record<string, unknown>;
}

const registry: Record<BlockType, ComponentType<BlockProps>> = {
  Hero: HeroBlock,
  RichText: RichTextBlock,
  ProductGrid: ProductGridBlock,
  ImageBanner: ImageBannerBlock,
  VideoEmbed: VideoEmbedBlock,
  FAQ: FAQBlock,
  CTAStrip: CTAStripBlock,
  Testimonials: TestimonialsBlock,
};

export function getBlockComponent(type: string): ComponentType<BlockProps> | null {
  return registry[type as BlockType] ?? null;
}
```

### 7.2 Block Renderer — `web/components/blocks/BlockRenderer.tsx`

```typescript
import type { BlockEnvelope } from "@/types";
import { getBlockComponent } from "./BlockRegistry";

interface Props {
  blocks: BlockEnvelope[];
}

export function BlockRenderer({ blocks }: Props) {
  // Filter: only visible blocks, sorted by order
  const visibleBlocks = blocks
    .filter((b) => b.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {visibleBlocks.map((block) => {
        const Component = getBlockComponent(block.type);
        if (!Component) {
          // Unknown block type — skip silently in production, warn in dev
          if (process.env.NODE_ENV === "development") {
            console.warn(`Unknown block type: ${block.type}`);
          }
          return null;
        }
        return <Component key={block.block_id} data={block.data} />;
      })}
    </>
  );
}
```

---

## 8. Block Component Specifications

> Every block component is a **Server Component** (default in App Router) unless it needs interactivity. Each receives `{ data: Record<string, unknown> }` and safely casts to its typed interface.

### 8.1 HeroBlock.tsx

```
┌─────────────────────────────────────────────────────────────┐
│                    FULL-WIDTH HERO SECTION                    │
│                                                              │
│     Background: image_url (cover, centered)                 │
│     Overlay: semi-transparent dark gradient                  │
│                                                              │
│     ┌───────────────────────────────────────┐               │
│     │  h1: {title}                          │               │
│     │  p:  {subtitle}                       │               │
│     │  [CTA Button → {cta_link}]            │               │
│     └───────────────────────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

- Full viewport width, min-height 500px, max-height 80vh.
- Background image via CSS `background-image` (not `<img>`) for decorative use.
- Overlay: `bg-gradient-to-r from-black/60 to-transparent`.
- Text: white, left-aligned, max-width 600px.
- CTA button: if `cta_text` and `cta_link` are provided, render as `<a>` (not `<button>`).
- Responsive: reduce min-height on mobile (`min-h-[300px] md:min-h-[500px]`).

### 8.2 RichTextBlock.tsx

- Render `data.html` inside a `<div>` with Tailwind `prose` class (requires `@tailwindcss/typography` plugin).
- **CRITICAL SECURITY:** Use `dangerouslySetInnerHTML` but the HTML was already sanitized by M3 (DOMPurify) on save AND by M5 on input. This is the third layer — consider adding a lightweight server-side sanitizer if you want defense-in-depth, but at minimum use Tailwind prose to scope styles.
- Wrap in a `Container` component (max-w-4xl centered).

### 8.3 ProductGridBlock.tsx

- Heading: `<h2>` with `data.heading`.
- Grid: 4 columns desktop, 2 tablet, 1 mobile (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`).
- **For V1:** Render placeholder product cards. The actual product fetch from an external catalog is a future feature.
- Each card: image placeholder, product name placeholder, "Learn More" link placeholder.
- The `data.category` and `data.max_items` will be used when the products API is available. For now, render `max_items` placeholder cards.

### 8.4 ImageBannerBlock.tsx

- Full-width `<img>` with `data.alt_text` as `alt` attribute.
- Use Next.js `<Image>` component for automatic optimization.
- If `data.link` is provided, wrap in `<a>`.
- Aspect ratio: auto, with `object-cover`.
- Configure `next.config.mjs`: add CloudFront domain to `images.remotePatterns`.

### 8.5 VideoEmbedBlock.tsx

- Render a responsive iframe embed.
- **YouTube:** `https://www.youtube-nocookie.com/embed/{video_id}` (privacy-enhanced mode).
- **Vimeo:** `https://player.vimeo.com/video/{video_id}`.
- Title attribute on iframe: `data.title`.
- Aspect ratio: 16:9 (`aspect-video` Tailwind class).
- Responsive: full width in container, max-w-4xl centered.
- **Security:** `video_id` must be alphanumeric only — validate before constructing URL. NEVER interpolate unsanitized user data into iframe `src`.

### 8.6 FAQBlock.tsx

- Heading: `<h2>` with `data.heading`.
- Accordion UI (use shadcn/ui `Accordion` component).
- Each `items[]` entry becomes an accordion item: question = trigger, answer = content.
- Accessible: keyboard navigable, `aria-expanded` managed by Radix.

### 8.7 CTAStripBlock.tsx

- Full-width strip with background color (`data.bg_color` or default `bg-blue-600`).
- **Security:** If `bg_color` is present, validate it's a hex color (`/^#[0-9a-fA-F]{6}$/`) before applying as inline style. Otherwise, ignore and use default.
- Text: white, centered, `data.text`.
- Button: white/outlined, links to `data.button_link`, text `data.button_label`.
- Padding: `py-12 px-4`.

### 8.8 TestimonialsBlock.tsx

- Optional heading: `<h2>` with `data.heading`.
- Grid or carousel (grid for V1): 3 columns desktop, 1 mobile.
- Each card: blockquote with `quote`, author name, optional `role`, optional `avatar_url`.
- Avatar: 48x48 rounded circle, use `<Image>` component. Fallback to initials if no avatar.

---

## 9. Root Layout — `web/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    template: "%s — e-con Systems",
    default: "e-con Systems — Embedded Camera Solutions",
  },
  description: "Leading provider of OEM embedded camera solutions for industrial, medical, and smart city applications.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.e-consystems.com"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
```

---

## 10. Next.js Configuration — `web/next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.econsystems.com",  // CloudFront domain
        pathname: "/media/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 11. Performance Requirements

| Metric                       | Target           | How to achieve                                           |
| ---------------------------- | ---------------- | -------------------------------------------------------- |
| First Contentful Paint       | < 1.2 s          | ISR, minimal JS, Server Components by default            |
| Largest Contentful Paint     | < 2.5 s          | `<Image>` with priority on Hero, proper `sizes` attr     |
| Cumulative Layout Shift      | < 0.1            | Explicit width/height on all images, font-display: swap  |
| Total JS bundle (first load) | < 100 KB gzip    | No unnecessary client components. Use dynamic imports.   |
| ISR revalidation             | 60 s default     | Configurable via `REVALIDATE_SECONDS` env var            |

### 11.1 Image Optimization Rules

- ALWAYS use `next/image` for all images (Hero backgrounds excluded — use CSS).
- Set `priority={true}` on the first Hero block's image.
- Set `sizes` attribute: `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw` (adjust per block).
- CloudFront already caches; `next/image` adds responsive srcsets.

---

## 12. Accessibility (WCAG 2.1 AA)

| Requirement                | Implementation                                                          |
| -------------------------- | ----------------------------------------------------------------------- |
| Semantic HTML              | `<main>`, `<nav>`, `<article>`, `<section>`, `<footer>`, `<header>`     |
| Heading hierarchy          | One `<h1>` per page (from Hero title). Subsequent blocks use `<h2>`.    |
| Image alt text             | Every `<img>` / `<Image>` has descriptive `alt`. Decorative images: `alt=""`. |
| Color contrast             | All text meets 4.5:1 ratio (use Tailwind's default colors — they comply).|
| Keyboard navigation        | All links/buttons focusable. FAQ accordion keyboard-operable.           |
| Skip to content            | Add "Skip to main content" link as first element in Header.             |
| Focus indicators           | Tailwind `ring` utilities on all interactive elements.                  |

---

## 13. Error & Edge Case Handling

| Scenario                          | Behavior                                                       |
| --------------------------------- | -------------------------------------------------------------- |
| API returns 404 for slug          | Call `notFound()` → renders `not-found.tsx`.                   |
| API is unreachable                | `error.tsx` boundary catches → "Something went wrong" + retry. |
| Unknown block type in blocks array | Skip silently in prod, `console.warn` in dev.                 |
| Block has `visible: false`        | Skip rendering entirely.                                       |
| Empty `blocks` array              | Render a minimal "This page is under construction" message.    |
| Malformed `data` in a block       | Render fallback text instead of crashing (try/catch in each block). |

---

## 14. SEO Essentials

- [ ] Every page has unique `<title>` and `<meta name="description">` from API data.
- [ ] OpenGraph tags (`og:title`, `og:description`, `og:image`, `og:url`) populated dynamically.
- [ ] Canonical URL set on every page.
- [ ] `robots.txt` in `public/` (allow all, sitemap reference).
- [ ] Future: `sitemap.xml` generation from published pages list endpoint.

---

## 15. Checklist Before Marking M4 Complete

- [ ] `[...slug]/page.tsx`: Dynamic route fetches page from M5 public API with ISR.
- [ ] `generateMetadata`: Title, description, OG tags, canonical generated per page.
- [ ] `BlockRegistry.ts`: All 8 block types registered with corresponding renderer.
- [ ] `BlockRenderer.tsx`: Filters visible blocks, sorts by order, gracefully handles unknowns.
- [ ] All 8 block components render correctly with sample data.
- [ ] `not-found.tsx`: Custom 404 page renders.
- [ ] `error.tsx`: Client error boundary catches API failures.
- [ ] Security headers configured in `next.config.mjs`.
- [ ] CloudFront domain added to `images.remotePatterns`.
- [ ] `next/image` used for all raster images (not `<img>`).
- [ ] Tailwind Typography plugin installed for RichText prose styling.
- [ ] Accessibility: semantic HTML, alt texts, skip nav, keyboard nav.
- [ ] TypeScript strict mode, zero `any` types, zero lint errors.
- [ ] Lighthouse score: Performance ≥ 90, Accessibility ≥ 90, SEO ≥ 90.
