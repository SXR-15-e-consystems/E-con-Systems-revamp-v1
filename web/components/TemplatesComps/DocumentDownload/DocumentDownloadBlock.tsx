'use client';

import { useState, useCallback, useMemo } from 'react';
import { sanitizeUrl } from '@/lib/security';
import { DownloadFormModal } from '../../blocks/ProductTabs/renderers/DownloadFormModal';
import { getUiStrings } from '@/lib/ui-strings';
import type { UiStrings } from '@/lib/ui-strings';
import type {
  DocumentDownloadData,
  DocumentDownloadMeta,
  DocumentDownloadContent,
  DocumentFile,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — DocumentDownloadBlock
// Downloadable documents section with categories, checkboxes, bulk download.
// ─────────────────────────────────────────────────────────────────────────────

interface DocumentDownloadBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: DocumentDownloadMeta = {
  bgColor: '#ffffff',
  headerColor: '#1f2937',
  linkColor: '#2563eb',
  checkboxColor: '#2563eb',
  columns: 2,
  width: '100%',
  headingColor: '#111827',
  headingAlign: 'left',
};

const HEADING_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  zip: '📦',
  doc: '📝',
  docx: '📝',
  xlsx: '📊',
  xls: '📊',
};

function fileIcon(fileType: string): string {
  return FILE_ICONS[fileType.toLowerCase()] ?? '📎';
}

export function DocumentDownloadBlock({ data }: DocumentDownloadBlockProps) {
  const t = getUiStrings(data.__ui as UiStrings | undefined);
  const raw = data as unknown as DocumentDownloadData;
  const meta: DocumentDownloadMeta = { ...DEFAULT_META, ...raw.meta };
  const content: DocumentDownloadContent = { ...{ heading: '', products: [] }, ...raw.content };
  const pageProductName = (data.__page_product_name as string) ?? '';

  const { heading, products } = content;

  // Count total files for toggle-all
  const totalFiles = products.reduce(
    (sum, p) => sum + p.categories.reduce((s, c) => s + c.files.length, 0),
    0,
  );

  // Track selected files as Set of "productIndex-categoryIndex-fileIndex" keys
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleFile = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === totalFiles) return new Set();
      const all = new Set<string>();
      products.forEach((product, pi) => {
        product.categories.forEach((cat, ci) => {
          cat.files.forEach((_, fi) => {
            all.add(`${pi}-${ci}-${fi}`);
          });
        });
      });
      return all;
    });
  }, [products, totalFiles]);

  const [showDownloadForm, setShowDownloadForm] = useState(false);

  const selectedDocumentsForModal = useMemo(() => {
    const docs: { name: string; url: string }[] = [];
    selected.forEach((key) => {
      const [pi, ci, fi] = key.split('-').map(Number);
      const file = products[pi]?.categories[ci]?.files[fi];
      if (file) {
        const url = sanitizeUrl(file.url);
        if (url) docs.push({ name: file.name, url });
      }
    });
    return docs;
  }, [selected, products]);

  const downloadSelected = useCallback(() => {
    if (selected.size === 0) return;
    setShowDownloadForm(true);
  }, [selected]);

  if (!heading && products.length === 0) return null;

  const gridCols = meta.columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1';

  return (
    <section
      style={{
        width: meta.width,
        maxWidth: '100%',
        backgroundColor: meta.bgColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          {heading && (
            <h2
              className={`text-xl sm:text-2xl font-bold ${HEADING_ALIGN[meta.headingAlign] ?? 'text-left'}`}
              style={{ color: meta.headingColor }}
            >
              {heading}
            </h2>
          )}

          {totalFiles > 0 && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={toggleAll}
                className="text-sm font-medium hover:underline"
                style={{ color: meta.linkColor }}
              >
                {selected.size === totalFiles ? t.deselectAll : t.selectAll}
              </button>
              <button
                type="button"
                onClick={downloadSelected}
                disabled={selected.size === 0}
                className="rounded px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: meta.linkColor }}
              >
                Download ({selected.size})
              </button>
            </div>
          )}
        </div>

        {/* Product sections */}
        {products.map((product, pi) => (
          <div key={pi} className="mb-10 last:mb-0">
            {product.label && (
              <h3
                className="text-lg font-semibold mb-4 border-b border-gray-200 pb-2"
                style={{ color: meta.headerColor }}
              >
                {product.label}
              </h3>
            )}

            <div className={`grid gap-6 ${gridCols}`}>
              {product.categories.map((cat, ci) => (
                <div key={ci}>
                  {/* Category header */}
                  <div
                    className="flex items-center gap-2 mb-3 font-semibold"
                    style={{ color: meta.headerColor }}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span>{cat.category_name}</span>
                  </div>

                  {/* File list */}
                  <ul className="space-y-2">
                    {cat.files.map((file, fi) => {
                      const key = `${pi}-${ci}-${fi}`;
                      const isChecked = selected.has(key);
                      const safeUrl = sanitizeUrl(file.url);

                      return (
                        <li key={fi} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFile(key)}
                            className="h-4 w-4 rounded cursor-pointer"
                            style={{ accentColor: meta.checkboxColor }}
                          />
                          <span className="text-base">{fileIcon(file.file_type)}</span>
                          {safeUrl ? (
                            <a
                              href={safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                              style={{ color: meta.linkColor }}
                            >
                              {file.name}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">{file.name}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bottom download bar */}
        {totalFiles > 0 && selected.size > 0 && (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={downloadSelected}
              className="rounded px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: meta.linkColor }}
            >
              Download Selected ({selected.size})
            </button>
          </div>
        )}
      </div>

      <DownloadFormModal
        open={showDownloadForm}
        onClose={() => setShowDownloadForm(false)}
        documents={selectedDocumentsForModal}
        productName={pageProductName || content.products[0]?.label || content.heading}
      />
    </section>
  );
}
