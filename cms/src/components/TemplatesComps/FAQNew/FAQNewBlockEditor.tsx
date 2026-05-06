import { useState } from 'react';

import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import type { FAQNewContent, FAQNewItem } from '../../../types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Editor — FAQNewBlockEditor
// Content editor: section heading + accordion list of Q&A pairs.
// Each item: question, answer (HTML with embedded links), optional CTA link.
// ─────────────────────────────────────────────────────────────────────────────

export function FAQNewBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as { meta?: unknown; content?: Partial<FAQNewContent> };
  const content: FAQNewContent = {
    heading: data.content?.heading ?? '',
    items: data.content?.items ?? [],
  };

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function updateContent(updates: Partial<FAQNewContent>) {
    onChange({ ...block.data, content: { ...content, ...updates } });
  }

  function updateItem(i: number, updates: Partial<FAQNewItem>) {
    const items = [...content.items];
    items[i] = { ...items[i], ...updates };
    updateContent({ items });
  }

  function addItem() {
    const newItems: FAQNewItem[] = [
      ...content.items,
      { question: '', answer: '', link_text: '', link_href: '' },
    ];
    updateContent({ items: newItems });
    setOpenIdx(newItems.length - 1);
  }

  function removeItem(i: number) {
    updateContent({ items: content.items.filter((_, idx) => idx !== i) });
    setOpenIdx(null);
  }

  function moveItem(i: number, dir: -1 | 1) {
    const items = [...content.items];
    const target = i + dir;
    if (target < 0 || target >= items.length) return;
    [items[i], items[target]] = [items[target], items[i]];
    updateContent({ items });
    setOpenIdx(target);
  }

  const inp =
    'rounded border border-slate-200 px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400';
  const lbl = 'text-xs text-slate-500 font-medium';

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
        FAQ (New) — Content
      </h3>

      {/* Section heading */}
      <div className="flex flex-col gap-1">
        <label className={lbl}>Section Heading</label>
        <input
          type="text"
          value={content.heading}
          onChange={(e) => updateContent({ heading: e.target.value })}
          className={inp}
          placeholder="Frequently Asked Questions"
        />
      </div>

      {/* Q&A list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-600">
            Questions &amp; Answers ({content.items.length})
          </span>
          <button
            onClick={addItem}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium"
          >
            + Add FAQ
          </button>
        </div>

        {content.items.length === 0 && (
          <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-lg">
            No questions yet. Click &quot;+ Add FAQ&quot; to start.
          </p>
        )}

        {content.items.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer bg-slate-50 hover:bg-slate-100 select-none"
                onClick={() => setOpenIdx(isOpen ? null : i)}
              >
                <span className="text-xs font-medium text-slate-700 truncate flex-1">
                  {item.question ? item.question : <span className="text-slate-400 italic">Question {i + 1}</span>}
                </span>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveItem(i, -1); }}
                    disabled={i === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs"
                    title="Move up"
                  >▲</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveItem(i, 1); }}
                    disabled={i === content.items.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs"
                    title="Move down"
                  >▼</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                    className="p-1 text-red-400 hover:text-red-600 text-xs"
                    title="Delete"
                  >✕</button>
                  <span className="text-slate-400 text-xs ml-1">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Content (open) */}
              {isOpen && (
                <div className="p-3 flex flex-col gap-3 bg-white">
                  {/* Question */}
                  <div className="flex flex-col gap-1">
                    <label className={lbl}>Question *</label>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateItem(i, { question: e.target.value })}
                      className={inp}
                      placeholder="e.g. What is unique about the See3CAM_37CUGM?"
                    />
                  </div>

                  {/* Answer */}
                  <div className="flex flex-col gap-1">
                    <label className={lbl}>
                      Answer{' '}
                      <span className="text-slate-400 font-normal">
                        (HTML supported — e.g. &lt;a href=&quot;/page&quot;&gt;click here&lt;/a&gt;,
                        &lt;strong&gt;bold&lt;/strong&gt;, &lt;ul&gt;…&lt;/ul&gt;)
                      </span>
                    </label>
                    <textarea
                      rows={6}
                      value={item.answer}
                      onChange={(e) => updateItem(i, { answer: e.target.value })}
                      className={inp + ' font-mono text-xs resize-y leading-relaxed'}
                      placeholder={`The product is unique because...\n\nFor more details, <a href="/product-page">visit this page</a> or <a href="https://youtu.be/..." target="_blank">watch the video</a>.`}
                    />
                    <p className="text-xs text-slate-400">
                      Tip: Wrap links as{' '}
                      <code className="bg-slate-100 px-1 rounded">
                        {'<a href="url">text</a>'}
                      </code>
                      . External links will open in a new tab automatically.
                    </p>
                  </div>

                  {/* Optional CTA link */}
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      Optional CTA link{' '}
                      <span className="font-normal text-slate-400">
                        (shown as a labelled arrow link below the answer)
                      </span>
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label className={lbl}>Link Text</label>
                        <input
                          type="text"
                          value={item.link_text ?? ''}
                          onChange={(e) => updateItem(i, { link_text: e.target.value })}
                          className={inp}
                          placeholder="e.g. Learn more, Watch video, See product page"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={lbl}>Link URL</label>
                        <input
                          type="text"
                          value={item.link_href ?? ''}
                          onChange={(e) => updateItem(i, { link_href: e.target.value })}
                          className={inp}
                          placeholder="/product-page  or  https://youtu.be/..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
