import { useState } from "react";
import type {
  MegaMenuTab,
  MenuColumn,
  MenuItem,
  BottomSection,
  PromoBanner,
} from "../../types/navigation";
import {
  createEmptyTab,
  createEmptyColumn,
  createEmptyMenuItem,
} from "../../types/navigation";
import { PromoBannerEditor } from "./PromoBannerEditor";
import { ColumnEditor } from "./ColumnEditor";

interface Props {
  tabs: MegaMenuTab[];
  onChange: (tabs: MegaMenuTab[]) => void;
  promoBanner: PromoBanner | null;
  onPromoBannerChange: (pb: PromoBanner | null) => void;
}

export function MegaTabEditor({ tabs, onChange, promoBanner, onPromoBannerChange }: Props) {
  const [activeTabId, setActiveTabId] = useState<string | null>(
    tabs.find((t) => t.is_default)?.tab_id ?? tabs[0]?.tab_id ?? null,
  );

  const activeTab = tabs.find((t) => t.tab_id === activeTabId) ?? null;

  const addTab = () => {
    const newTab = createEmptyTab();
    newTab.order = tabs.length;
    newTab.is_default = tabs.length === 0;
    const updated = [...tabs, newTab];
    onChange(updated);
    setActiveTabId(newTab.tab_id);
  };

  const updateTab = (updated: MegaMenuTab) => {
    onChange(tabs.map((t) => (t.tab_id === updated.tab_id ? updated : t)));
  };

  const deleteTab = (tabId: string) => {
    const updated = tabs.filter((t) => t.tab_id !== tabId);
    onChange(updated);
    if (activeTabId === tabId) {
      setActiveTabId(updated[0]?.tab_id ?? null);
    }
  };

  const setDefault = (tabId: string) => {
    onChange(
      tabs.map((t) => ({ ...t, is_default: t.tab_id === tabId })),
    );
  };

  const moveTab = (index: number, direction: -1 | 1) => {
    const arr = [...tabs].sort((a, b) => a.order - b.order);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= arr.length) return;
    [arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]];
    onChange(arr.map((t, i) => ({ ...t, order: i })));
  };

  const sorted = [...tabs].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        {sorted.map((tab, idx) => (
          <div
            key={tab.tab_id}
            className={`group flex items-center gap-1 rounded-t px-3 py-1.5 text-sm cursor-pointer transition-colors ${
              activeTabId === tab.tab_id
                ? "bg-blue-50 text-blue-700 font-semibold border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTabId(tab.tab_id)}
          >
            <span className="truncate max-w-[120px]">{tab.label || "Untitled"}</span>
            {tab.is_default && (
              <span className="rounded bg-blue-200 px-1 py-0.5 text-[9px] font-bold text-blue-800">
                DEFAULT
              </span>
            )}
            {/* Actions on hover */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); moveTab(idx, -1); }}
                className="p-0.5 text-slate-400 hover:text-slate-700"
                title="Move left"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); moveTab(idx, 1); }}
                className="p-0.5 text-slate-400 hover:text-slate-700"
                title="Move right"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); deleteTab(tab.tab_id); }}
                className="p-0.5 text-red-400 hover:text-red-600"
                title="Delete tab"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTab}
          className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
        >
          + Tab
        </button>
      </div>

      {/* Active tab editor */}
      {activeTab && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tab Label</label>
              <input
                type="text"
                value={activeTab.label}
                onChange={(e) => updateTab({ ...activeTab, label: e.target.value })}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end pb-0.5">
              <button
                type="button"
                onClick={() => setDefault(activeTab.tab_id)}
                disabled={activeTab.is_default}
                className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {activeTab.is_default ? "Default Tab" : "Set as Default"}
              </button>
            </div>
          </div>

          {/* Columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">
                Columns ({activeTab.columns.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  const newCol = createEmptyColumn();
                  updateTab({ ...activeTab, columns: [...activeTab.columns, newCol] });
                }}
                className="rounded border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600"
              >
                + Column
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeTab.columns.map((col, ci) => (
                <ColumnEditor
                  key={col.col_id}
                  column={col}
                  onChange={(updated: MenuColumn) => {
                    const cols = [...activeTab.columns];
                    cols[ci] = updated;
                    updateTab({ ...activeTab, columns: cols });
                  }}
                  onDelete={() => {
                    updateTab({
                      ...activeTab,
                      columns: activeTab.columns.filter((_, i) => i !== ci),
                    });
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom section */}
          <fieldset className="rounded-md border border-slate-200 p-4">
            <legend className="px-2 text-xs font-semibold text-slate-600">Bottom Section</legend>
            <label className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <input
                type="checkbox"
                checked={activeTab.bottom_section?.enabled ?? false}
                onChange={(e) => {
                  const current = activeTab.bottom_section ?? {
                    enabled: false,
                    title: "",
                    items: [],
                  };
                  updateTab({
                    ...activeTab,
                    bottom_section: { ...current, enabled: e.target.checked },
                  });
                }}
                className="rounded border-slate-300"
              />
              Enable bottom section
            </label>
            {activeTab.bottom_section?.enabled && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={activeTab.bottom_section.title}
                  onChange={(e) =>
                    updateTab({
                      ...activeTab,
                      bottom_section: { ...activeTab.bottom_section!, title: e.target.value },
                    })
                  }
                  placeholder="Section title"
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
                {activeTab.bottom_section.items.map((item, mi) => (
                  <div key={`bs-${mi}`} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => {
                        const items = [...activeTab.bottom_section!.items];
                        items[mi] = { ...items[mi], label: e.target.value };
                        updateTab({
                          ...activeTab,
                          bottom_section: { ...activeTab.bottom_section!, items },
                        });
                      }}
                      placeholder="Label"
                      className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) => {
                        const items = [...activeTab.bottom_section!.items];
                        items[mi] = { ...items[mi], url: e.target.value };
                        updateTab({
                          ...activeTab,
                          bottom_section: { ...activeTab.bottom_section!, items },
                        });
                      }}
                      placeholder="URL"
                      className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const items = activeTab.bottom_section!.items.filter((_, i) => i !== mi);
                        updateTab({
                          ...activeTab,
                          bottom_section: { ...activeTab.bottom_section!, items },
                        });
                      }}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const items = [
                      ...activeTab.bottom_section!.items,
                      createEmptyMenuItem(),
                    ];
                    updateTab({
                      ...activeTab,
                      bottom_section: { ...activeTab.bottom_section!, items },
                    });
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Add item
                </button>
              </div>
            )}
          </fieldset>
        </div>
      )}

      {tabs.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-400">
          No tabs yet. Click "+ Tab" to add your first tab.
        </div>
      )}

      {/* Promo banner */}
      <PromoBannerEditor value={promoBanner} onChange={onPromoBannerChange} />
    </div>
  );
}
