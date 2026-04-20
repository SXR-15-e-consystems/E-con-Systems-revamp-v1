import type { MenuColumn, PromoBanner } from "../../types/navigation";
import { createEmptyColumn } from "../../types/navigation";
import { ColumnEditor } from "./ColumnEditor";
import { PromoBannerEditor } from "./PromoBannerEditor";

interface Props {
  columns: MenuColumn[];
  onChange: (columns: MenuColumn[]) => void;
  promoBanner: PromoBanner | null;
  onPromoBannerChange: (pb: PromoBanner | null) => void;
}

export function MegaColumnEditor({ columns, onChange, promoBanner, onPromoBannerChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">
          Columns ({columns.length})
        </span>
        <button
          type="button"
          onClick={() => onChange([...columns, createEmptyColumn()])}
          className="rounded border border-dashed border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600"
        >
          + Column
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((col, ci) => (
          <ColumnEditor
            key={col.col_id}
            column={col}
            onChange={(updated) => {
              const cols = [...columns];
              cols[ci] = updated;
              onChange(cols);
            }}
            onDelete={() => onChange(columns.filter((_, i) => i !== ci))}
          />
        ))}
      </div>

      {columns.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-400">
          No columns yet. Click "+ Column" to add your first column.
        </div>
      )}

      {/* Promo banner */}
      <PromoBannerEditor value={promoBanner} onChange={onPromoBannerChange} />
    </div>
  );
}
