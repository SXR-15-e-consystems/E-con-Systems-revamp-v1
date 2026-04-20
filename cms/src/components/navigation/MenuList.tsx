import type { NavMenuEntry } from "../../types/navigation";
import { MENU_TYPE_LABELS } from "../../types/navigation";

interface Props {
  menus: NavMenuEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function MenuList({
  menus,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
}: Props) {
  const sorted = [...menus].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <span className="text-sm font-semibold text-slate-800">Menu Items</span>
        <button
          type="button"
          onClick={onAdd}
          className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-slate-400">
            No menu items yet. Click + Add to create one.
          </div>
        )}
        {sorted.map((menu, index) => {
          const isSelected = menu.menu_id === selectedId;
          return (
            <div
              key={menu.menu_id}
              className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-blue-50 border-l-2 border-l-blue-600"
                  : "hover:bg-slate-50 border-l-2 border-l-transparent"
              }`}
              onClick={() => onSelect(menu.menu_id)}
            >
              {/* Drag handle (up/down arrows) */}
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index > 0) onReorder(index, index - 1);
                  }}
                  disabled={index === 0}
                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="Move up"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index < sorted.length - 1) onReorder(index, index + 1);
                  }}
                  disabled={index === sorted.length - 1}
                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="Move down"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`truncate text-sm font-medium ${
                      isSelected ? "text-blue-700" : "text-slate-700"
                    }`}
                  >
                    {menu.label || "Untitled"}
                  </span>
                  {!menu.visible && (
                    <span className="rounded bg-slate-200 px-1 py-0.5 text-[10px] font-semibold text-slate-500">
                      HIDDEN
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                  {MENU_TYPE_LABELS[menu.menu_type]}
                </div>
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(menu.menu_id);
                }}
                className="flex-shrink-0 rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                title="Delete menu"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
