'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { sanitizeUrl } from '@/lib/security';
import { fetchPublicPagesBatch } from '@/lib/api';
import { getUiStrings } from '@/lib/ui-strings';
import type { UiStrings } from '@/lib/ui-strings';
import type {
  VariantsTableData,
  VariantsTableMeta,
  VariantsTableContent,
} from '@/types/templates';
import type { PageResponse } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — VariantsTableBlock
// Full-width responsive table showing product variants with configurable
// columns, action buttons, badges, and highlighted rows.
// ─────────────────────────────────────────────────────────────────────────────

interface VariantsTableBlockProps {
  data: Record<string, unknown>;
}

interface ResolvedRow {
  slug: string;
  title: string;
  badge: string;
  highlighted: boolean;
  columnValues: Record<string, string>;
}

const DEFAULT_META: VariantsTableMeta = {
  bgColor: '#ffffff',
  headerBgColor: '#002B5B',
  headerTextColor: '#ffffff',
  rowBgColor: '#ffffff',
  rowAltBgColor: '#f8fafc',
  rowTextColor: '#1f2937',
  highlightRowColor: '#fef3c7',
  width: '100%',
  columns: [],
  actionButtons: [],
  headingColor: '#111827',
  headingAlign: 'left',
};

const HEADING_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function extractColumnValue(
  page: PageResponse,
  key: string,
  customFields: Record<string, string>,
): string {
  if (customFields[key]) return customFields[key];

  if (key === 'product_name') return page.title;

  if (key === 'promotional_sample_price') {
    const priceBlock = page.blocks.find((b) => b.type === 'SamplePrice');
    if (priceBlock) {
      const d = priceBlock.data as Record<string, unknown>;
      const content = d.content as Record<string, string> | undefined;
      return content ? `${content.currency ?? ''} ${content.price ?? ''}`.trim() : '';
    }
    return '';
  }

  return customFields[key] ?? '';
}

export function VariantsTableBlock({ data }: VariantsTableBlockProps) {
  const t = getUiStrings(data.__ui as UiStrings | undefined);
  const raw = data as unknown as VariantsTableData;
  const meta: VariantsTableMeta = {
    ...DEFAULT_META,
    ...raw.meta,
    columns: raw.meta?.columns ?? [],
    actionButtons: raw.meta?.actionButtons ?? [],
  };
  const rawContent = raw.content ?? ({} as Partial<VariantsTableContent>);
  const content: VariantsTableContent = {
    heading: rawContent.heading ?? '',
    rows: rawContent.rows ?? [],
  };

  const [resolvedRows, setResolvedRows] = useState<ResolvedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (content.rows.length === 0) {
      setLoading(false);
      return;
    }

    const slugs = content.rows.map((r) => r.page_slug);

    fetchPublicPagesBatch(slugs)
      .then((pages) => {
        const pageMap = new Map<string, PageResponse>();
        for (const page of pages) {
          pageMap.set(page.slug, page);
        }

        const rows: ResolvedRow[] = content.rows.map((row) => {
          const page = pageMap.get(row.page_slug);
          const columnValues: Record<string, string> = {};

          for (const col of meta.columns) {
            if (!col.visible) continue;
            columnValues[col.key] = page
              ? extractColumnValue(page, col.key, row.custom_fields)
              : row.custom_fields[col.key] ?? '';
          }

          return {
            slug: row.page_slug,
            title: page?.title ?? row.page_slug,
            badge: row.badge,
            highlighted: row.highlighted,
            columnValues,
          };
        });

        setResolvedRows(rows);
      })
      .catch(() => {
        // Graceful fallback — show rows with custom_fields only
        setResolvedRows(
          content.rows.map((row) => ({
            slug: row.page_slug,
            title: row.page_slug,
            badge: row.badge,
            highlighted: row.highlighted,
            columnValues: { ...row.custom_fields },
          })),
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleColumns = meta.columns.filter((c) => c.visible);

  if (!content.heading && content.rows.length === 0) return null;

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
        {content.heading && (
          <h2
            className={`text-2xl font-bold mb-6 ${headingClass}`}
            style={{ color: meta.headingColor }}
          >
            {content.heading}
          </h2>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : resolvedRows.length === 0 ? (
          <div className="rounded-lg border border-gray-200 px-4 py-8 text-center text-gray-400">
            {t.noVariants}
          </div>
        ) : (
          <>
            {/* ── Desktop table (lg+) ── */}
            <div className="hidden lg:block rounded-lg border border-gray-200">
              <table className="w-full border-collapse text-sm" style={{ tableLayout: 'auto' }}>
                <thead className="sticky top-0 z-10">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-3 text-left font-semibold"
                        style={{
                          backgroundColor: meta.headerBgColor,
                          color: meta.headerTextColor,
                          width: col.width,
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                    {meta.actionButtons.length > 0 && (
                      <th
                        className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: meta.headerBgColor,
                          color: meta.headerTextColor,
                        }}
                      >
                        {t.actionsHeader}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {resolvedRows.map((row, rowIdx) => {
                    const rowBg =
                      row.highlighted === true
                        ? meta.highlightRowColor
                        : rowIdx % 2 === 0
                          ? meta.rowBgColor
                          : meta.rowAltBgColor;

                    return (
                      <tr
                        key={row.slug}
                        style={{ backgroundColor: rowBg }}
                        className="border-t border-gray-100"
                      >
                        {visibleColumns.map((col) => (
                          <td
                            key={col.key}
                            className="px-3 py-3"
                            style={{ color: meta.rowTextColor }}
                          >
                            {col.key === 'product_name' ? (
                              <span className="flex items-center gap-2">
                                <Link
                                  href={sanitizeUrl(`/${row.slug}`)}
                                  className="font-medium text-blue-700 hover:underline"
                                >
                                  {row.columnValues.product_name || row.title}
                                </Link>
                                {row.badge && (
                                  <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                                    {row.badge}
                                  </span>
                                )}
                              </span>
                            ) : (
                              row.columnValues[col.key] ?? ''
                            )}
                          </td>
                        ))}
                        {meta.actionButtons.length > 0 && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {meta.actionButtons.map((btn, bi) => {
                                const href = resolveActionHref(btn.type, row.slug);
                                return (
                                  <Link
                                    key={bi}
                                    href={sanitizeUrl(href)}
                                    className="inline-block rounded px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                                    style={{
                                      backgroundColor: btn.bgColor,
                                      color: btn.textColor,
                                    }}
                                  >
                                    {btn.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile / tablet card layout (< lg) ── */}
            <div className="lg:hidden flex flex-col gap-4">
              {resolvedRows.map((row) => {
                const isHighlighted = row.highlighted === true;

                return (
                  <div
                    key={row.slug}
                    className="rounded-lg border border-gray-200 overflow-hidden text-sm"
                    style={{
                      backgroundColor: meta.rowBgColor,
                      borderLeftWidth: isHighlighted ? 4 : undefined,
                      borderLeftColor: isHighlighted
                        ? meta.highlightRowColor
                        : undefined,
                    }}
                  >
                    {/* Card header — product name */}
                    <div
                      className="px-4 py-3 font-semibold"
                      style={{
                        backgroundColor: meta.headerBgColor,
                        color: meta.headerTextColor,
                      }}
                    >
                      <span className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={sanitizeUrl(`/${row.slug}`)}
                          className="hover:underline"
                          style={{ color: meta.headerTextColor }}
                        >
                          {row.columnValues.product_name || row.title}
                        </Link>
                        {row.badge && (
                          <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                            {row.badge}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Card body — key-value pairs */}
                    <div className="divide-y divide-gray-100">
                      {visibleColumns
                        .filter((col) => col.key !== 'product_name')
                        .map((col) => (
                          <div
                            key={col.key}
                            className="flex justify-between gap-4 px-4 py-2"
                            style={{ color: meta.rowTextColor }}
                          >
                            <span className="font-medium text-gray-500 shrink-0">
                              {col.label}
                            </span>
                            <span className="text-right">
                              {row.columnValues[col.key] ?? ''}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Card footer — action buttons */}
                    {meta.actionButtons.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-100">
                        {meta.actionButtons.map((btn, bi) => {
                          const href = resolveActionHref(btn.type, row.slug);
                          return (
                            <Link
                              key={bi}
                              href={sanitizeUrl(href)}
                              className="inline-block rounded px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                              style={{
                                backgroundColor: btn.bgColor,
                                color: btn.textColor,
                              }}
                            >
                              {btn.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function resolveActionHref(type: string, slug: string): string {
  switch (type) {
    case 'buy_now':
      return `/${slug}#order_samples`;
    case 'pre_order':
      return `/${slug}#order_samples`;
    case 'contact_us':
      return '/contact';
    case 'download':
      return `/${slug}#documents`;
    default:
      return `/${slug}`;
  }
}
