import { useState } from 'react';
import type {
  TargetedApplicationsData,
  TargetedApplicationsMeta,
  TargetedApplicationsContent,
  TargetedApplicationItem,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — heading + application cards (page level)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: TargetedApplicationsMeta = {
  bgColor: '#f3f4f6',
  headingColor: '#111827',
  headingSize: '1.75rem',
  headingAlign: 'center',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  cardGap: '16px',
  titleColor: '#1f2937',
  titleSize: '0.9375rem',
  imageAspectRatio: '4/3',
  visibleCards: 4,
  sectionPadding: '40px 0',
};

function emptyItem(): TargetedApplicationItem {
  return { image_url: '', image_alt: '', title: '', link: '' };
}

function lbl(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function TargetedApplicationsBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as TargetedApplicationsData;
  const meta: TargetedApplicationsMeta = { ...DEFAULT_META, ...data.meta };
  const content: TargetedApplicationsContent = {
    heading: data.content?.heading ?? '',
    items: data.content?.items ?? [],
  };

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function updateContent(patch: Partial<TargetedApplicationsContent>) {
    onChange({ ...data, meta, content: { ...content, ...patch } });
  }

  function updateItem(idx: number, patch: Partial<TargetedApplicationItem>) {
    const updated = content.items.map((item, i) => (i === idx ? { ...item, ...patch } : item));
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
      {/* Heading */}
      <label className="flex flex-col gap-1">
        {lbl('Section Heading')}
        <input
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          value={content.heading}
          placeholder='e.g. "Applications"'
          onChange={(e) => updateContent({ heading: e.target.value })}
        />
      </label>

      {/* Items */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">
            Applications ({content.items.length})
          </span>
          <button
            type="button"
            onClick={addItem}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            + Add Application
          </button>
        </div>

        <div className="space-y-2">
          {content.items.map((item, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <div key={idx} className="rounded border border-gray-200 bg-white">
                {/* Header */}
                <div
                  className="flex cursor-pointer select-none items-center gap-2 px-3 py-2"
                  onClick={() => setExpandedIdx(isOpen ? null : idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setExpandedIdx(isOpen ? null : idx);
                  }}
                >
                  <span className="text-xs text-gray-400">{isOpen ? '▼' : '▶'}</span>
                  <span className="flex-1 truncate text-sm font-medium text-gray-700">
                    {item.title || `Application ${idx + 1}`}
                  </span>
                  <div className="flex gap-1">
                    <button type="button" onClick={(e) => { e.stopPropagation(); moveItem(idx, -1); }} disabled={idx === 0} className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move up">▲</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); moveItem(idx, 1); }} disabled={idx === content.items.length - 1} className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move down">▼</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeItem(idx); }} className="ml-1 text-xs text-red-400 hover:text-red-600" title="Remove">✕</button>
                  </div>
                </div>

                {/* Expanded form */}
                {isOpen && (
                  <div className="space-y-3 border-t border-gray-100 px-3 py-3">
                    <label className="flex flex-col gap-1">
                      {lbl('Title *')}
                      <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={item.title} placeholder="e.g. Traffic Control" onChange={(e) => updateItem(idx, { title: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      {lbl('Image URL *')}
                      <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={item.image_url} placeholder="https://…/image.jpg" onChange={(e) => updateItem(idx, { image_url: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      {lbl('Image Alt Text')}
                      <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={item.image_alt} placeholder="Description of image" onChange={(e) => updateItem(idx, { image_alt: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      {lbl('Link URL (optional)')}
                      <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={item.link ?? ''} placeholder="https://…" onChange={(e) => updateItem(idx, { link: e.target.value })} />
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
