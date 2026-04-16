import { useState, useEffect } from 'react';
import type {
  CategoryFilterData,
  CategoryFilterMeta,
  CategoryFilterContent,
  CategoryItem,
  ProductReference,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import { fetchPageSummaries, type PageSummary } from '../../../api/endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — categories, products, section info
// ─────────────────────────────────────────────────────────────────────────────

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

const DEFAULT_CONTENT: CategoryFilterContent = {
  section_title: '',
  section_icon: '📷',
  categories: [],
  products: [],
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function CategoryFilterBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as CategoryFilterData;
  const meta: CategoryFilterMeta = { ...DEFAULT_META, ...data.meta };
  const content: CategoryFilterContent = { ...DEFAULT_CONTENT, ...data.content };

  const [summaries, setSummaries] = useState<PageSummary[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    fetchPageSummaries().then(setSummaries).catch(() => {
      /* silently ignore — summaries stay empty */
    });
  }, []);

  function updateContent(patch: Partial<CategoryFilterContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  // ── Category helpers ──
  function addCategory() {
    updateContent({
      categories: [...content.categories, { label: '', filter_key: '' }],
    });
  }

  function updateCategory(index: number, patch: Partial<CategoryItem>) {
    const updated = content.categories.map((cat, i) =>
      i === index ? { ...cat, ...patch } : cat,
    );
    updateContent({ categories: updated });
  }

  function removeCategory(index: number) {
    updateContent({
      categories: content.categories.filter((_, i) => i !== index),
    });
  }

  // ── Product helpers ──
  function addProduct(slug: string) {
    const exists = content.products.some((p) => p.page_slug === slug);
    if (exists) return;
    const newProduct: ProductReference = {
      page_slug: slug,
      categories: [],
      badge: '',
      sort_order: content.products.length,
      description: '',
    };
    updateContent({ products: [...content.products, newProduct] });
    setShowProductPicker(false);
  }

  function updateProduct(index: number, patch: Partial<ProductReference>) {
    const updated = content.products.map((p, i) =>
      i === index ? { ...p, ...patch } : p,
    );
    updateContent({ products: updated });
  }

  function removeProduct(index: number) {
    updateContent({
      products: content.products.filter((_, i) => i !== index),
    });
  }

  function toggleProductCategory(productIndex: number, filterKey: string) {
    const product = content.products[productIndex];
    const cats = product.categories.includes(filterKey)
      ? product.categories.filter((k) => k !== filterKey)
      : [...product.categories, filterKey];
    updateProduct(productIndex, { categories: cats });
  }

  // Pages not yet added as products
  const availablePages = summaries.filter(
    (s) => !content.products.some((p) => p.page_slug === s.slug),
  );

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Columns:</strong> {meta.columns}
        </span>
        <span>
          <strong>Sidebar:</strong> {meta.sidebarWidth}
        </span>
        <span>
          <strong>Title:</strong>{' '}
          <span style={{ color: meta.titleColor, fontWeight: meta.titleBold ? 700 : 400, fontStyle: meta.titleItalic ? 'italic' : 'normal' }}>
            {meta.titleFontSize}
          </span>
        </span>
        <span>
          <strong>Desc:</strong>{' '}
          <span style={{ color: meta.descColor, fontWeight: meta.descBold ? 700 : 400, fontStyle: meta.descItalic ? 'italic' : 'normal' }}>
            {meta.descFontSize}
          </span>
        </span>
        <span>
          <strong>Active filter:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.activeFilterColor }}
          />
        </span>
        <span>
          <strong>Badge:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.badgeBgColor }}
          />
        </span>
      </div>

      {/* Section info */}
      <div className="border border-gray-200 rounded p-4 space-y-4">
        <div className="grid grid-cols-[1fr_80px] gap-3">
          <label className="flex flex-col gap-1">
            {label('Section Title')}
            <input
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              value={content.section_title}
              placeholder='e.g. "Camera Modules"'
              onChange={(e) => updateContent({ section_title: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            {label('Icon')}
            <input
              className="rounded border border-gray-300 px-3 py-2 text-sm text-center"
              value={content.section_icon}
              placeholder="📷"
              onChange={(e) => updateContent({ section_icon: e.target.value })}
            />
          </label>
        </div>
      </div>

      {/* Categories */}
      <fieldset className="border border-gray-200 rounded p-4 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Categories</legend>

        {content.categories.length === 0 && (
          <p className="text-xs text-gray-400 italic">No categories yet. Add one below.</p>
        )}

        {content.categories.map((cat, i) => (
          <div key={i} className="flex items-end gap-2">
            <label className="flex-1 flex flex-col gap-1">
              {i === 0 && label('Label')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={cat.label}
                placeholder="USB Camera"
                onChange={(e) => updateCategory(i, { label: e.target.value })}
              />
            </label>
            <label className="flex-1 flex flex-col gap-1">
              {i === 0 && label('Filter Key')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm font-mono"
                value={cat.filter_key}
                placeholder="usb_camera"
                onChange={(e) => updateCategory(i, { filter_key: e.target.value })}
              />
            </label>
            <button
              type="button"
              onClick={() => removeCategory(i)}
              className="px-2 py-2 text-red-500 hover:text-red-700 text-sm"
              title="Remove category"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addCategory}
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          + Add Category
        </button>
      </fieldset>

      {/* Products */}
      <fieldset className="border border-gray-200 rounded p-4 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Products</legend>

        {content.products.length === 0 && (
          <p className="text-xs text-gray-400 italic">No products assigned. Add one below.</p>
        )}

        {content.products.map((product, i) => (
          <div
            key={product.page_slug}
            className="border border-gray-200 rounded p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                {product.page_slug}
              </span>
              <button
                type="button"
                onClick={() => removeProduct(i)}
                className="px-2 py-1 text-red-500 hover:text-red-700 text-xs"
                title="Remove product"
              >
                ✕ Remove
              </button>
            </div>

            {/* Category checkboxes */}
            {content.categories.length > 0 && (
              <div>
                {label('Categories')}
                <div className="flex flex-wrap gap-2 mt-1">
                  {content.categories.map((cat) => (
                    <label
                      key={cat.filter_key}
                      className="flex items-center gap-1 text-xs text-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={product.categories.includes(cat.filter_key)}
                        onChange={() => toggleProductCategory(i, cat.filter_key)}
                        className="rounded border-gray-300"
                      />
                      {cat.label || cat.filter_key}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                {label('Badge')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={product.badge}
                  placeholder='e.g. "New", "Launching Soon"'
                  onChange={(e) => updateProduct(i, { badge: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('Sort Order')}
                <input
                  type="number"
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={product.sort_order}
                  onChange={(e) =>
                    updateProduct(i, { sort_order: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </label>
            </div>

            {/* Hub Page Description */}
            <label className="flex flex-col gap-1">
              {label('Hub Page Description')}
              <textarea
                className="rounded border border-gray-300 px-3 py-2 text-sm resize-none"
                rows={2}
                value={product.description}
                placeholder={
                  summaries.find((s) => s.slug === product.page_slug)?.meta_description ||
                  'One-line product description for this hub page'
                }
                onChange={(e) => updateProduct(i, { description: e.target.value })}
              />
              {!product.description && (
                <span className="text-[11px] text-blue-500">
                  Leave empty to use the product page&apos;s meta description.
                </span>
              )}
            </label>
          </div>
        ))}

        {/* Add product picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProductPicker(!showProductPicker)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            + Add Product
          </button>

          {showProductPicker && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded border border-gray-300 bg-white shadow-lg">
              {availablePages.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400 italic">
                  {summaries.length === 0
                    ? 'Loading pages…'
                    : 'All pages already added.'}
                </p>
              ) : (
                availablePages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => addProduct(page.slug)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-medium">{page.title}</span>
                    <span className="ml-2 text-xs text-gray-400">/{page.slug}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </fieldset>
    </div>
  );
}
