import type { MenuColumn, MenuItem } from "../../types/navigation";
import { createEmptyMenuItem } from "../../types/navigation";

interface Props {
  column: MenuColumn;
  onChange: (updated: MenuColumn) => void;
  onDelete: () => void;
  activeLocale?: string;
  localeFlat?: Record<string, string>;
  onLocaleChange?: (key: string, val: string) => void;
}

export function ColumnEditor({ column, onChange, onDelete, activeLocale, localeFlat, onLocaleChange }: Props) {
  const isTranslating = !!(activeLocale && activeLocale !== 'en');
  const updateItem = (index: number, updated: MenuItem) => {
    const items = [...column.items];
    items[index] = updated;
    onChange({ ...column, items });
  };

  const addItem = () => {
    onChange({ ...column, items: [...column.items, createEmptyMenuItem()] });
  };

  const removeItem = (index: number) => {
    onChange({ ...column, items: column.items.filter((_, i) => i !== index) });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const items = [...column.items];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    onChange({ ...column, items });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      {/* Column header */}
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={isTranslating ? (localeFlat?.[`c_${column.col_id}`] ?? '') : column.title}
            onChange={(e) =>
              isTranslating
                ? onLocaleChange?.(`c_${column.col_id}`, e.target.value)
                : onChange({ ...column, title: e.target.value })
            }
            placeholder={isTranslating ? (column.title || 'Column title') : 'Column title'}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm font-medium focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={column.icon_url ?? ""}
            onChange={(e) => onChange({ ...column, icon_url: e.target.value || null })}
            placeholder="Icon URL (optional)"
            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="flex-shrink-0 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
          title="Delete column"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {column.items.map((item, i) => (
          <div key={`item-${i}`} className="group flex items-center gap-1.5">
            {/* Reorder */}
            <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => moveItem(i, -1)}
                disabled={i === 0}
                className="p-0 text-slate-400 hover:text-slate-700 disabled:opacity-30"
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => moveItem(i, 1)}
                disabled={i === column.items.length - 1}
                className="p-0 text-slate-400 hover:text-slate-700 disabled:opacity-30"
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <input
              type="text"
              value={isTranslating ? (localeFlat?.[`ci_${column.col_id}_${i}`] ?? '') : item.label}
              onChange={(e) =>
                isTranslating
                  ? onLocaleChange?.(`ci_${column.col_id}_${i}`, e.target.value)
                  : updateItem(i, { ...item, label: e.target.value })
              }
              placeholder={isTranslating ? (item.label || 'Label') : 'Label'}
              className="flex-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={item.url}
              onChange={(e) => updateItem(i, { ...item, url: e.target.value })}
              placeholder="URL"
              className="flex-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={item.icon_url ?? ""}
              onChange={(e) => updateItem(i, { ...item, icon_url: e.target.value || null })}
              placeholder="Icon"
              className="w-20 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="flex-shrink-0 p-0.5 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-2 text-xs text-blue-600 hover:underline"
      >
        + Add link
      </button>
    </div>
  );
}
