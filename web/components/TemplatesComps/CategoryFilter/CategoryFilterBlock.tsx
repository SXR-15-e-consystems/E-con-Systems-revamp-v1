'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sanitizeUrl } from '@/lib/security';
import { fetchPublicPagesBatch } from '@/lib/api';
import type {
  CategoryFilterData,
  CategoryFilterMeta,
  CategoryFilterContent,
  ProductReference,
} from '@/types/templates';
import type { PageResponse } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — CategoryFilterBlock
// Left sidebar with category filters + right grid of product cards.
// Fetches product page data on mount and resolves images/titles.
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryFilterBlockProps {
  data: Record<string, unknown>;
}

interface ResolvedProduct {
  slug: string;
  title: string;
  description: string;
  image_url: string;
  badge: string;
  categories: string[];
  sort_order: number;
}

const DEFAULT_META: CategoryFilterMeta = {
  bgColor: '#ffffff',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  sidebarWidth: '200px',
  columns: 3,
  width: '100%',
  activeFilterColor: '#2563eb',
  badgeBgColor: '#16a34a',
  badgeTextColor: '#ffffff',
  titleColor: '#1f2937',
  titleFontSize: '14px',
  titleBold: true,
  titleItalic: false,
  descColor: '#6b7280',
  descFontSize: '12px',
  descBold: false,
  descItalic: false,
  headingColor: '#111827',
  headingAlign: 'left',
};

const HEADING_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function extractImageFromPage(page: PageResponse): string {
  if (page.og_image_url) return page.og_image_url;

  // Fallback: look for a ProductImageSlider block
  const sliderBlock = page.blocks?.find((b) => b.type === 'ProductImageSlider');
  if (sliderBlock) {
    const blockData = sliderBlock.data as Record<string, unknown>;
    const contentObj = blockData.content as Record<string, unknown> | undefined;
    const slides = contentObj?.slides as Array<Record<string, unknown>> | undefined;
    if (slides && slides.length > 0) {
      const firstUrl = slides[0].image_url;
      if (typeof firstUrl === 'string') return firstUrl;
    }
  }

  return '';
}

function resolveProducts(
  refs: ProductReference[],
  pages: PageResponse[],
): ResolvedProduct[] {
  const pageMap = new Map<string, PageResponse>();
  for (const page of pages) {
    pageMap.set(page.slug, page);
  }

  return refs
    .map((ref) => {
      const page = pageMap.get(ref.page_slug);
      if (!page) return null;
      return {
        slug: ref.page_slug,
        title: page.title,
        description: ref.description || page.meta_description || '',
        image_url: extractImageFromPage(page),
        badge: ref.badge,
        categories: ref.categories,
        sort_order: ref.sort_order,
      };
    })
    .filter((p): p is ResolvedProduct => p !== null)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function CategoryFilterBlock({ data }: CategoryFilterBlockProps) {
  const raw = data as unknown as CategoryFilterData;
  const meta: CategoryFilterMeta = { ...DEFAULT_META, ...raw.meta };
  const rawContent = raw.content ?? {} as Partial<CategoryFilterContent>;
  const content: CategoryFilterContent = {
    section_title: rawContent.section_title ?? '',
    section_icon: rawContent.section_icon ?? '📷',
    categories: rawContent.categories ?? [],
    products: rawContent.products ?? [],
  };

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [resolvedProducts, setResolvedProducts] = useState<ResolvedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slugs = [...new Set(content.products.map((p) => p.page_slug))];
    if (slugs.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchPublicPagesBatch(slugs)
      .then((pages) => {
        if (!cancelled) {
          setResolvedProducts(resolveProducts(content.products, pages));
        }
      })
      .catch(() => {
        /* fetch failed — grid stays empty */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [content.products]);

  const handleFilterClick = useCallback((filterKey: string | null) => {
    setActiveFilter(filterKey);
  }, []);

  const filtered =
    activeFilter === null
      ? resolvedProducts
      : resolvedProducts.filter((p) => p.categories.includes(activeFilter));

  if (content.categories.length === 0 && content.products.length === 0) return null;

  const columnClass =
    meta.columns === 2
      ? 'sm:grid-cols-2'
      : meta.columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  const headingClass = HEADING_ALIGN[meta.headingAlign] ?? 'text-left';

  return (
    <section
      style={{
        width: meta.width,
        maxWidth: '100%',
        backgroundColor: meta.bgColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Section header */}
        {content.section_title && (
          <h2
            className={`text-2xl font-bold mb-6 ${headingClass}`}
            style={{ color: meta.headingColor }}
          >
            {content.section_icon && (
              <span className="mr-2">{content.section_icon}</span>
            )}
            {content.section_title}
          </h2>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar ── */}
          <style>{`@media (min-width: 1024px) { .cf-sidebar { min-width: ${meta.sidebarWidth}; } }`}</style>
          <nav
            className="cf-sidebar shrink-0 lg:sticky lg:top-4 lg:self-start overflow-x-auto lg:overflow-x-visible"
          >
            {/* Mobile: horizontal scroll strip / Desktop: vertical list */}
            <div className="flex lg:flex-col gap-1 pb-2 lg:pb-0">
              <button
                type="button"
                onClick={() => handleFilterClick(null)}
                className="whitespace-nowrap rounded px-3 py-2 text-sm font-medium transition-colors"
                style={
                  activeFilter === null
                    ? { backgroundColor: meta.activeFilterColor, color: '#ffffff' }
                    : { backgroundColor: '#f3f4f6', color: '#374151' }
                }
              >
                All
              </button>
              {content.categories.map((cat) => (
                <button
                  key={cat.filter_key}
                  type="button"
                  onClick={() => handleFilterClick(cat.filter_key)}
                  className="whitespace-nowrap rounded px-3 py-2 text-sm font-medium transition-colors"
                  style={
                    activeFilter === cat.filter_key
                      ? { backgroundColor: meta.activeFilterColor, color: '#ffffff' }
                      : { backgroundColor: '#f3f4f6', color: '#374151' }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </nav>

          {/* ── Product grid ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className={`grid grid-cols-1 ${columnClass} gap-4`}>
                {Array.from({ length: meta.columns }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded bg-gray-100 h-48"
                    style={{ borderRadius: meta.cardBorderRadius }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                No products found for this category.
              </p>
            ) : (
              <div className={`grid grid-cols-1 ${columnClass} gap-4`}>
                {filtered.map((product) => {
                  const imageUrl = sanitizeUrl(product.image_url);
                  const href = sanitizeUrl(`/${product.slug}`);

                  return (
                    <Link
                      key={product.slug}
                      href={href}
                      className="group relative flex flex-col overflow-hidden border border-gray-200 transition-shadow hover:shadow-md"
                      style={{
                        backgroundColor: meta.cardBgColor,
                        borderRadius: meta.cardBorderRadius,
                      }}
                    >
                      {/* Badge */}
                      {product.badge && (
                        <span
                          className="absolute top-2 right-2 z-10 rounded px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: meta.badgeBgColor,
                            color: meta.badgeTextColor,
                          }}
                        >
                          {product.badge}
                        </span>
                      )}

                      {/* Image */}
                      <div className="relative aspect-[4/3] w-full">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-contain p-3 transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300">
                            <span className="text-3xl">📷</span>
                          </div>
                        )}
                      </div>

                      {/* Title + Description */}
                      <div className="px-3 py-3">
                        <h3
                          className="line-clamp-2 group-hover:text-blue-600 transition-colors"
                          style={{
                            color: meta.titleColor,
                            fontSize: meta.titleFontSize,
                            fontWeight: meta.titleBold ? 700 : 400,
                            fontStyle: meta.titleItalic ? 'italic' : 'normal',
                          }}
                        >
                          {product.title}
                        </h3>
                        {product.description && (
                          <p
                            className="mt-1 line-clamp-3"
                            style={{
                              color: meta.descColor,
                              fontSize: meta.descFontSize,
                              fontWeight: meta.descBold ? 700 : 400,
                              fontStyle: meta.descItalic ? 'italic' : 'normal',
                            }}
                          >
                            {product.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
