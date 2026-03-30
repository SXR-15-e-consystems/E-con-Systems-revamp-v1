import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import type { ProductTabsData, ProductTabsMeta } from '../../../types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — layout & style metadata only, no content values
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ProductTabsMeta = {
  sidebar_width: '160px',
  active_color: '#2563eb',
  mobile_layout: 'horizontal_scroll',
  max_custom_tabs: 2,
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function ProductTabsTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ProductTabsData;
  const meta: ProductTabsMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<ProductTabsMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } } as unknown as Record<string, unknown>);
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Tab content is filled during page creation.
      </p>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>

        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Sidebar Width')}
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.sidebar_width}
              onChange={(e) => updateMeta({ sidebar_width: e.target.value })}
              placeholder="160px"
            />
          </label>
          <label>
            {label('Active Color')}
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-8 rounded border border-gray-300 cursor-pointer"
                value={meta.active_color}
                onChange={(e) => updateMeta({ active_color: e.target.value })}
              />
              <input
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                value={meta.active_color}
                onChange={(e) => updateMeta({ active_color: e.target.value })}
              />
            </div>
          </label>
        </div>

        <label>
          {label('Mobile Layout')}
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.mobile_layout}
            onChange={(e) =>
              updateMeta({ mobile_layout: e.target.value as ProductTabsMeta['mobile_layout'] })
            }
          >
            <option value="horizontal_scroll">Horizontal Scroll</option>
            <option value="dropdown">Dropdown</option>
          </select>
        </label>

        <label>
          {label('Max Custom Tabs')}
          <input
            type="number"
            min={0}
            max={5}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.max_custom_tabs}
            onChange={(e) =>
              updateMeta({ max_custom_tabs: Math.max(0, parseInt(e.target.value, 10) || 2) })
            }
          />
        </label>
      </fieldset>
    </div>
  );
}
