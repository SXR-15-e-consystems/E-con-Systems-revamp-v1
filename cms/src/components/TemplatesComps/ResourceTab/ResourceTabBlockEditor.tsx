import { useState, useEffect } from 'react';
import type {
  ResourceTabData,
  ResourceTabMeta,
  ResourceTabContent,
  ResourceTabItem,
  ResourceTabCard,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — tab names + cards per tab (page level)
// tabCount is read from meta (set at template level) — cannot be changed here.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ResourceTabMeta = {
  bgColor: '#f3f4f6',
  sidebarBgColor: '#f3f4f6',
  tabActiveColor: '#16a34a',
  tabInactiveColor: '#111827',
  tabFontSize: '0.9375rem',
  cardBgColor: '#ffffff',
  cardBorderRadius: '12px',
  cardGap: '20px',
  titleColor: '#111827',
  titleSize: '0.9375rem',
  descColor: '#4b5563',
  descSize: '0.8125rem',
  ctaBgColor: '#16a34a',
  ctaTextColor: '#ffffff',
  ctaBorderRadius: '4px',
  ctaSize: '0.8125rem',
  imageAspectRatio: '4/3',
  visibleCards: 3,
  tabCount: 3,
  sectionPadding: '40px 0',
};

function emptyCard(): ResourceTabCard {
  return { image_url: '', image_alt: '', title: '', description: '', cta_text: '', cta_link: '' };
}

function defaultTabs(count: number): ResourceTabItem[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Tab ${i + 1}`,
    cards: [],
  }));
}

function lbl(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function ResourceTabBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ResourceTabData;
  const meta: ResourceTabMeta = { ...DEFAULT_META, ...data.meta };
  const tabCount = meta.tabCount;

  // Ensure tabs array always matches tabCount
  const rawTabs = data.content?.tabs ?? [];
  const syncedTabs: ResourceTabItem[] = Array.from({ length: tabCount }, (_, i) =>
    rawTabs[i] ?? { name: `Tab ${i + 1}`, cards: [] },
  );
  const content: ResourceTabContent = { tabs: syncedTabs };

  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [expandedCardIdx, setExpandedCardIdx] = useState<number | null>(null);

  // Keep activeTabIdx in bounds if tabCount changes
  useEffect(() => {
    setActiveTabIdx((prev) => Math.min(prev, tabCount - 1));
  }, [tabCount]);

  function save(tabs: ResourceTabItem[]) {
    onChange({ ...data, meta, content: { tabs } });
  }

  function updateTabName(tabIdx: number, name: string) {
    const updated = content.tabs.map((t, i) => (i === tabIdx ? { ...t, name } : t));
    save(updated);
  }

  function updateCard(tabIdx: number, cardIdx: number, patch: Partial<ResourceTabCard>) {
    const updated = content.tabs.map((t, i) => {
      if (i !== tabIdx) return t;
      return { ...t, cards: t.cards.map((c, j) => (j === cardIdx ? { ...c, ...patch } : c)) };
    });
    save(updated);
  }

  function addCard(tabIdx: number) {
    const updated = content.tabs.map((t, i) => {
      if (i !== tabIdx) return t;
      return { ...t, cards: [...t.cards, emptyCard()] };
    });
    save(updated);
    setExpandedCardIdx((updated[tabIdx].cards.length - 1));
  }

  function removeCard(tabIdx: number, cardIdx: number) {
    const updated = content.tabs.map((t, i) => {
      if (i !== tabIdx) return t;
      return { ...t, cards: t.cards.filter((_, j) => j !== cardIdx) };
    });
    save(updated);
    if (expandedCardIdx === cardIdx) setExpandedCardIdx(null);
  }

  function moveCard(tabIdx: number, cardIdx: number, dir: -1 | 1) {
    const target = cardIdx + dir;
    const tab = content.tabs[tabIdx];
    if (target < 0 || target >= tab.cards.length) return;
    const cards = [...tab.cards];
    [cards[cardIdx], cards[target]] = [cards[target], cards[cardIdx]];
    const updated = content.tabs.map((t, i) => (i === tabIdx ? { ...t, cards } : t));
    save(updated);
    setExpandedCardIdx(target);
  }

  const activeTab = content.tabs[activeTabIdx];

  return (
    <div className="space-y-4 p-4">
      {/* Tab count indicator */}
      <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
        <strong>Tab count: {tabCount}</strong> — set in Template Config. Tab names &amp; cards are set here.
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-2">
        {content.tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setActiveTabIdx(i); setExpandedCardIdx(null); }}
            className={`rounded-t px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTabIdx === i
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
            }`}
          >
            {tab.name || `Tab ${i + 1}`}
          </button>
        ))}
      </div>

      {/* Active tab editor */}
      {activeTab && (
        <div className="space-y-4">
          {/* Tab name */}
          <label className="flex flex-col gap-1">
            {lbl('Tab Name *')}
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={activeTab.name}
              placeholder={`e.g. Related Products`}
              onChange={(e) => updateTabName(activeTabIdx, e.target.value)}
            />
          </label>

          {/* Cards */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">
                Cards ({activeTab.cards.length})
              </span>
              <button
                type="button"
                onClick={() => addCard(activeTabIdx)}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                + Add Card
              </button>
            </div>

            <div className="space-y-2">
              {activeTab.cards.map((card, cardIdx) => {
                const isOpen = expandedCardIdx === cardIdx;
                return (
                  <div key={cardIdx} className="rounded border border-gray-200 bg-white">
                    {/* Card header */}
                    <div
                      className="flex cursor-pointer select-none items-center gap-2 px-3 py-2"
                      onClick={() => setExpandedCardIdx(isOpen ? null : cardIdx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          setExpandedCardIdx(isOpen ? null : cardIdx);
                      }}
                    >
                      <span className="text-xs text-gray-400">{isOpen ? '▼' : '▶'}</span>
                      <span className="flex-1 truncate text-sm font-medium text-gray-700">
                        {card.title || `Card ${cardIdx + 1}`}
                      </span>
                      <div className="flex gap-1">
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveCard(activeTabIdx, cardIdx, -1); }} disabled={cardIdx === 0} className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move up">▲</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveCard(activeTabIdx, cardIdx, 1); }} disabled={cardIdx === activeTab.cards.length - 1} className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30" title="Move down">▼</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeCard(activeTabIdx, cardIdx); }} className="ml-1 text-xs text-red-400 hover:text-red-600" title="Remove">✕</button>
                      </div>
                    </div>

                    {/* Expanded form */}
                    {isOpen && (
                      <div className="space-y-3 border-t border-gray-100 px-3 py-3">
                        <label className="flex flex-col gap-1">
                          {lbl('Title *')}
                          <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={card.title} placeholder="e.g. See3CAM_50CUGM" onChange={(e) => updateCard(activeTabIdx, cardIdx, { title: e.target.value })} />
                        </label>
                        <label className="flex flex-col gap-1">
                          {lbl('Image URL *')}
                          <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={card.image_url} placeholder="https://…/product.png" onChange={(e) => updateCard(activeTabIdx, cardIdx, { image_url: e.target.value })} />
                        </label>
                        <label className="flex flex-col gap-1">
                          {lbl('Image Alt Text')}
                          <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={card.image_alt} placeholder="Product image description" onChange={(e) => updateCard(activeTabIdx, cardIdx, { image_alt: e.target.value })} />
                        </label>
                        <label className="flex flex-col gap-1">
                          {lbl('Description (optional)')}
                          <textarea className="w-full rounded border border-gray-300 px-3 py-2 text-sm" rows={2} value={card.description ?? ''} placeholder="Short description…" onChange={(e) => updateCard(activeTabIdx, cardIdx, { description: e.target.value })} />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1">
                            {lbl('CTA Text (optional)')}
                            <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={card.cta_text ?? ''} placeholder="e.g. Know More" onChange={(e) => updateCard(activeTabIdx, cardIdx, { cta_text: e.target.value })} />
                          </label>
                          <label className="flex flex-col gap-1">
                            {lbl('CTA Link (optional)')}
                            <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={card.cta_link ?? ''} placeholder="https://…" onChange={(e) => updateCard(activeTabIdx, cardIdx, { cta_link: e.target.value })} />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {activeTab.cards.length === 0 && (
                <p className="py-4 text-center text-xs text-gray-400">
                  No cards yet. Click "+ Add Card" to add one.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
