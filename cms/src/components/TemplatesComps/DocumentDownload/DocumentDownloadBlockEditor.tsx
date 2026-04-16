import { useState, useEffect } from 'react';
import type {
  DocumentDownloadData,
  DocumentDownloadMeta,
  DocumentDownloadContent,
  DocumentDownloadProduct,
  DocumentCategory,
  DocumentFile,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import { fetchPageSummaries, type PageSummary } from '../../../api/endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills heading, products, categories, files
// ─────────────────────────────────────────────────────────────────────────────

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

const DEFAULT_CONTENT: DocumentDownloadContent = {
  heading: '',
  products: [],
};

const FILE_TYPE_OPTIONS = ['pdf', 'zip', 'doc', 'xlsx'] as const;

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function DocumentDownloadBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as DocumentDownloadData;
  const meta: DocumentDownloadMeta = { ...DEFAULT_META, ...data.meta };
  const content: DocumentDownloadContent = { ...DEFAULT_CONTENT, ...data.content };

  const [summaries, setSummaries] = useState<PageSummary[]>([]);
  useEffect(() => {
    fetchPageSummaries().then(setSummaries).catch(() => {});
  }, []);

  function updateContent(patch: Partial<DocumentDownloadContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  function updateProduct(index: number, patch: Partial<DocumentDownloadProduct>) {
    const products = content.products.map((p, i) =>
      i === index ? { ...p, ...patch } : p,
    );
    updateContent({ products });
  }

  function removeProduct(index: number) {
    updateContent({ products: content.products.filter((_, i) => i !== index) });
  }

  function addProduct(slug: string, title: string) {
    const product: DocumentDownloadProduct = {
      page_slug: slug,
      label: title,
      categories: [],
    };
    updateContent({ products: [...content.products, product] });
  }

  function updateCategory(productIdx: number, catIdx: number, patch: Partial<DocumentCategory>) {
    const product = content.products[productIdx];
    const categories = product.categories.map((c, i) =>
      i === catIdx ? { ...c, ...patch } : c,
    );
    updateProduct(productIdx, { categories });
  }

  function removeCategory(productIdx: number, catIdx: number) {
    const product = content.products[productIdx];
    updateProduct(productIdx, {
      categories: product.categories.filter((_, i) => i !== catIdx),
    });
  }

  function addCategory(productIdx: number) {
    const product = content.products[productIdx];
    const cat: DocumentCategory = { category_name: '', icon: '📄', files: [] };
    updateProduct(productIdx, { categories: [...product.categories, cat] });
  }

  function updateFile(
    productIdx: number,
    catIdx: number,
    fileIdx: number,
    patch: Partial<DocumentFile>,
  ) {
    const product = content.products[productIdx];
    const cat = product.categories[catIdx];
    const files = cat.files.map((f, i) => (i === fileIdx ? { ...f, ...patch } : f));
    updateCategory(productIdx, catIdx, { files });
  }

  function removeFile(productIdx: number, catIdx: number, fileIdx: number) {
    const cat = content.products[productIdx].categories[catIdx];
    updateCategory(productIdx, catIdx, {
      files: cat.files.filter((_, i) => i !== fileIdx),
    });
  }

  function addFile(productIdx: number, catIdx: number) {
    const cat = content.products[productIdx].categories[catIdx];
    const file: DocumentFile = { name: '', url: '', file_type: 'pdf' };
    updateCategory(productIdx, catIdx, { files: [...cat.files, file] });
  }

  // Pages already used as products
  const usedSlugs = new Set(content.products.map((p) => p.page_slug));

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Columns:</strong> {meta.columns}
        </span>
        <span>
          <strong>Width:</strong> {meta.width}
        </span>
        <span>
          <strong>Header:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.headerColor }}
          />
        </span>
        <span>
          <strong>Links:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.linkColor }}
          />
        </span>
      </div>

      {/* Heading */}
      <div className="border border-gray-200 rounded p-4 space-y-4">
        <label className="flex flex-col gap-1">
          {label('Section Heading *')}
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.heading}
            placeholder='e.g. "Downloads"'
            onChange={(e) => updateContent({ heading: e.target.value })}
          />
        </label>
      </div>

      {/* Products */}
      {content.products.map((product, pi) => (
        <fieldset
          key={pi}
          className="border border-gray-200 rounded p-4 space-y-4"
        >
          <legend className="text-xs font-bold text-gray-700 px-1">
            Product {pi + 1}: {product.label || product.page_slug}
          </legend>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              {label('Product Label')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={product.label}
                onChange={(e) => updateProduct(pi, { label: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1">
              {label('Page Slug')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm bg-gray-50"
                value={product.page_slug}
                readOnly
              />
            </label>
          </div>

          {/* Categories */}
          {product.categories.map((cat, ci) => (
            <fieldset
              key={ci}
              className="border border-dashed border-gray-300 rounded p-3 space-y-3"
            >
              <legend className="text-xs font-semibold text-gray-600 px-1">
                Category {ci + 1}
              </legend>

              <div className="grid grid-cols-[1fr_60px] gap-2">
                <label className="flex flex-col gap-1">
                  {label('Category Name')}
                  <input
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                    value={cat.category_name}
                    placeholder="e.g. Datasheets"
                    onChange={(e) =>
                      updateCategory(pi, ci, { category_name: e.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  {label('Icon')}
                  <input
                    className="rounded border border-gray-300 px-3 py-2 text-sm text-center"
                    value={cat.icon}
                    onChange={(e) => updateCategory(pi, ci, { icon: e.target.value })}
                  />
                </label>
              </div>

              {/* Files */}
              {cat.files.map((file, fi) => (
                <div
                  key={fi}
                  className="flex items-end gap-2 bg-gray-50 rounded p-2"
                >
                  <label className="flex flex-col gap-1 flex-[2]">
                    {label('File Name')}
                    <input
                      className="rounded border border-gray-300 px-2 py-1.5 text-xs"
                      value={file.name}
                      placeholder="Product_Datasheet.pdf"
                      onChange={(e) =>
                        updateFile(pi, ci, fi, { name: e.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1 flex-[3]">
                    {label('URL')}
                    <input
                      className="rounded border border-gray-300 px-2 py-1.5 text-xs"
                      value={file.url}
                      placeholder="https://…/file.pdf"
                      onChange={(e) =>
                        updateFile(pi, ci, fi, { url: e.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1 w-20">
                    {label('Type')}
                    <select
                      className="rounded border border-gray-300 px-2 py-1.5 text-xs"
                      value={file.file_type}
                      onChange={(e) =>
                        updateFile(pi, ci, fi, { file_type: e.target.value })
                      }
                    >
                      {FILE_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeFile(pi, ci, fi)}
                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1.5"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addFile(pi, ci)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add File
                </button>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => removeCategory(pi, ci)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove Category
                </button>
              </div>
            </fieldset>
          ))}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addCategory(pi)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Category
            </button>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => removeProduct(pi)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove Product
            </button>
          </div>
        </fieldset>
      ))}

      {/* Add product dropdown */}
      <div>
        <label className="flex flex-col gap-1">
          {label('Add Product')}
          <select
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value=""
            onChange={(e) => {
              const s = summaries.find((s) => s.slug === e.target.value);
              if (s) addProduct(s.slug, s.title);
            }}
          >
            <option value="" disabled>
              Select a page…
            </option>
            {summaries
              .filter((s) => !usedSlugs.has(s.slug))
              .map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.title} ({s.slug})
                </option>
              ))}
          </select>
        </label>
      </div>
    </div>
  );
}
