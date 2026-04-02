import { useState } from 'react';
import type {
  EvaluationSectionData,
  EvaluationSectionMeta,
  EvaluationSectionContent,
  EvaluationItem,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — heading + product card items
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: EvaluationSectionMeta = {
  bgColor: '#ffffff',
  headingColor: '#1f2937',
  nameColor: '#2563eb',
  badgeBgColor: '#16a34a',
  badgeTextColor: '#ffffff',
  cardWidth: '180px',
  cardGap: '24px',
};

function emptyItem(): EvaluationItem {
  return { image_url: '', image_alt: '', name: '', link: '', badge: '' };
}

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function EvaluationSectionBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as EvaluationSectionData;
  const meta: EvaluationSectionMeta = { ...DEFAULT_META, ...data.meta };
  const content: EvaluationSectionContent = {
    heading: data.content?.heading ?? '',
    items: data.content?.items ?? [],
  };

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function updateContent(patch: Partial<EvaluationSectionContent>) {
    onChange({ ...data, meta, content: { ...content, ...patch } });
  }

  function updateItem(idx: number, patch: Partial<EvaluationItem>) {
    const updated = content.items.map((itm, i) =>
      i === idx ? { ...itm, ...patch } : itm,
    );
    updateContent({ items: updated });
  }

  function addItem() {
    const updated = [...content.items, emptyItem()];
    updateContent({ items: updated });
    setExpandedIdx(updated.length - 1);
  }

  function removeItem(idx: number) {
    updateContent({ items: content.items.filter((_, i) => i !== idx) });
    if (expandedIdx === idx) setExpandedIdx(null);
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= content.items.length) return;
    const items = [...content.items];
    [items[idx], items[target]] = [items[target], items[idx]];
    updateContent({ items });
    setExpandedIdx(target);
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>BG:</strong>{' '}
          <span
            className="inline-block h-3 w-3 rounded-sm border align-middle"
            style={{ backgroundColor: meta.bgColor }}
          />
        </span>
        <span>
          <strong>Name:</strong>{' '}
          <span
            className="inline-block h-3 w-3 rounded-sm border align-middle"
            style={{ backgroundColor: meta.nameColor }}
          />
        </span>
        <span><strong>Card:</strong> {meta.cardWidth}</span>
        <span><strong>Gap:</strong> {meta.cardGap}</span>
      </div>

      {/* Heading */}
      <label className="flex flex-col gap-1">
        {label('Heading')}
        <input
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={content.heading}
          placeholder='e.g. "Evaluate STURDeCAM31 with,"'
          onChange={(e) => updateContent({ heading: e.target.value })}
        />
        <span className="text-[10px] text-gray-400">
          Use the product name in the heading. Example: &quot;Evaluate STURDeCAM31 with,&quot;
        </span>
      </label>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700">
            Products ({content.items.length})
          </span>
          <button
            type="button"
            onClick={addItem}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            + Add Product
          </button>
        </div>

        <div className="space-y-2">
          {content.items.map((item, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <div
                key={idx}
                className="rounded border border-gray-200 bg-white"
              >
                {/* Collapsed header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
                  onClick={() => setExpandedIdx(isOpen ? null : idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setExpandedIdx(isOpen ? null : idx);
                  }}
                >
                  <span className="text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</span>
                  <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                    {item.name || `Product ${idx + 1}`}
                  </span>
                  {item.badge && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      {item.badge}
                    </span>
                  )}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveItem(idx, -1); }}
                      disabled={idx === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveItem(idx, 1); }}
                      disabled={idx === content.items.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeItem(idx); }}
                      className="text-red-400 hover:text-red-600 text-xs ml-1"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Expanded form */}
                {isOpen && (
                  <div className="space-y-3 border-t border-gray-100 px-3 py-3">
                    <label className="flex flex-col gap-1">
                      {label('Product Name *')}
                      <input
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        value={item.name}
                        placeholder="e.g. See3CAM_CU81"
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      {label('Image URL *')}
                      <input
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        value={item.image_url}
                        placeholder="https://…/product.png"
                        onChange={(e) => updateItem(idx, { image_url: e.target.value })}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      {label('Image Alt')}
                      <input
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        value={item.image_alt}
                        placeholder="Product image alt text"
                        onChange={(e) => updateItem(idx, { image_alt: e.target.value })}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      {label('Link URL *')}
                      <input
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        value={item.link}
                        placeholder="/products/see3cam-cu81"
                        onChange={(e) => updateItem(idx, { link: e.target.value })}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      {label('Badge (optional)')}
                      <input
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        value={item.badge ?? ''}
                        placeholder='e.g. "Launching Soon"'
                        onChange={(e) => updateItem(idx, { badge: e.target.value })}
                      />
                      <span className="text-[10px] text-gray-400">
                        Leave empty for no badge. Shows as a pill in the top-right corner.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
