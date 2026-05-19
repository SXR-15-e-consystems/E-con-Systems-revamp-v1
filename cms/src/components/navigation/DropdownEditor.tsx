import type { DropdownChild } from "../../types/navigation";
import { createEmptyDropdownChild } from "../../types/navigation";

interface Props {
  children: DropdownChild[];
  onChange: (children: DropdownChild[]) => void;
  allowNesting: boolean;
  activeLocale?: string;
  localeFlat?: Record<string, string>;
  onLocaleChange?: (key: string, val: string) => void;
}

export function DropdownEditor({ children, onChange, allowNesting, activeLocale, localeFlat, onLocaleChange }: Props) {
  const addChild = () => {
    onChange([...children, createEmptyDropdownChild()]);
  };

  const updateChild = (index: number, updated: DropdownChild) => {
    const arr = [...children];
    arr[index] = updated;
    onChange(arr);
  };

  const removeChild = (index: number) => {
    onChange(children.filter((_, i) => i !== index));
  };

  const moveChild = (index: number, direction: -1 | 1) => {
    const arr = [...children];
    const target = index + direction;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    onChange(arr);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">
          {allowNesting ? "Nested Menu Items" : "Dropdown Items"} ({children.length})
        </span>
        <button
          type="button"
          onClick={addChild}
          className="rounded border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600"
        >
          + Add Item
        </button>
      </div>

      {children.length === 0 && (
        <div className="py-6 text-center text-sm text-slate-400">
          No items yet.
        </div>
      )}

      <div className="space-y-2">
        {children.map((child, i) => (
          <DropdownItemRow
            key={child.item_id}
            item={child}
            index={i}
            total={children.length}
            onChange={(updated) => updateChild(i, updated)}
            onDelete={() => removeChild(i)}
            onMove={(dir) => moveChild(i, dir)}
            allowNesting={allowNesting}
            depth={0}
            activeLocale={activeLocale}
            localeFlat={localeFlat}
            onLocaleChange={onLocaleChange}
          />
        ))}
      </div>
    </div>
  );
}

interface ItemRowProps {
  item: DropdownChild;
  index: number;
  total: number;
  onChange: (updated: DropdownChild) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  allowNesting: boolean;
  depth: number;
  activeLocale?: string;
  localeFlat?: Record<string, string>;
  onLocaleChange?: (key: string, val: string) => void;
}

function DropdownItemRow({
  item,
  index,
  total,
  onChange,
  onDelete,
  onMove,
  allowNesting,
  depth,
  activeLocale,
  localeFlat,
  onLocaleChange,
}: ItemRowProps) {
  const isTranslating = !!(activeLocale && activeLocale !== 'en') && depth === 0;
  const addSubChild = () => {
    onChange({
      ...item,
      children: [...item.children, createEmptyDropdownChild()],
    });
  };

  const updateSubChild = (ci: number, updated: DropdownChild) => {
    const kids = [...item.children];
    kids[ci] = updated;
    onChange({ ...item, children: kids });
  };

  const removeSubChild = (ci: number) => {
    onChange({ ...item, children: item.children.filter((_, i) => i !== ci) });
  };

  const moveSubChild = (ci: number, direction: -1 | 1) => {
    const kids = [...item.children];
    const target = ci + direction;
    if (target < 0 || target >= kids.length) return;
    [kids[ci], kids[target]] = [kids[target], kids[ci]];
    onChange({ ...item, children: kids });
  };

  return (
    <div
      className="rounded border border-slate-200 bg-white"
      style={{ marginLeft: depth * 20 }}
    >
      <div className="group flex items-center gap-2 p-2">
        {/* Reorder */}
        <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          value={isTranslating ? (localeFlat?.[`d_${item.item_id}`] ?? '') : item.label}
          onChange={(e) =>
            isTranslating
              ? onLocaleChange?.(`d_${item.item_id}`, e.target.value)
              : onChange({ ...item, label: e.target.value })
          }
          placeholder={isTranslating ? (item.label || 'Label') : 'Label'}
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
        <input
          type="text"
          value={item.url}
          onChange={(e) => onChange({ ...item, url: e.target.value })}
          placeholder="URL"
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={item.target}
          onChange={(e) => onChange({ ...item, target: e.target.value as "_self" | "_blank" })}
          className="w-24 rounded border border-slate-300 px-1 py-1 text-xs focus:border-blue-500 focus:outline-none"
        >
          <option value="_self">Same tab</option>
          <option value="_blank">New tab</option>
        </select>

        {allowNesting && depth < 2 && (
          <button
            type="button"
            onClick={addSubChild}
            className="flex-shrink-0 rounded px-1.5 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50"
            title="Add sub-item"
          >
            + Sub
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="flex-shrink-0 rounded p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Nested children */}
      {allowNesting && item.children.length > 0 && (
        <div className="border-t border-slate-100 p-2 space-y-1.5">
          {item.children.map((sub, si) => (
            <DropdownItemRow
              key={sub.item_id}
              item={sub}
              index={si}
              total={item.children.length}
              onChange={(updated) => updateSubChild(si, updated)}
              onDelete={() => removeSubChild(si)}
              onMove={(dir) => moveSubChild(si, dir)}
              allowNesting={allowNesting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
