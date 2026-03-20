import type { TemplateComponent } from '../../types/template';
import { getTemplateConfigEditor } from '../blocks/BlockEditorRegistry';
import type { BlockType } from '../../types';
import { TRAY_COMPONENTS } from './ComponentTray';

// ─────────────────────────────────────────────────────────────────────────────
// Right sidebar — shows L1 config editor for the selected canvas component
// ─────────────────────────────────────────────────────────────────────────────

interface ComponentConfigPanelProps {
  component: TemplateComponent | null;
  onChange: (updated: TemplateComponent) => void;
}

export function ComponentConfigPanel({ component, onChange }: ComponentConfigPanelProps) {
  if (!component) {
    return (
      <aside className="flex h-full w-80 flex-col border-l border-slate-200 bg-slate-50">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Properties
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-3xl mb-2">👆</p>
            <p className="text-sm text-slate-400 font-medium">Select a component</p>
            <p className="mt-1 text-xs text-slate-300">
              Click on a component on the canvas to edit its properties
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const def = TRAY_COMPONENTS.find((c) => c.type === component.type);
  const TemplateConfig = getTemplateConfigEditor(component.type as BlockType);

  /* Fake block envelope so existing TemplateConfig editors work unchanged */
  const fakeBlock = {
    block_id: component.component_id,
    type: component.type as BlockType,
    order: component.order,
    visible: true,
    data: { meta: component.meta, content: {} },
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-slate-200 bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Properties
        </h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg">{def?.icon ?? '📦'}</span>
          <span className="text-sm font-semibold text-slate-600">
            {component.label || def?.label || component.type}
          </span>
        </div>
      </div>

      {/* Common fields */}
      <div className="border-b border-slate-200 px-4 py-3 space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Label</span>
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={component.label}
            onChange={(e) => onChange({ ...component, label: e.target.value })}
            placeholder={def?.label ?? component.type}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-600">Grid Columns</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={13}
              className="w-20 rounded border border-slate-300 px-2 py-2 text-sm"
              value={component.grid_placement.col_start}
              onChange={(e) =>
                onChange({
                  ...component,
                  grid_placement: {
                    ...component.grid_placement,
                    col_start: Number(e.target.value),
                  },
                })
              }
            />
            <span className="self-center text-slate-400 text-xs">to</span>
            <input
              type="number"
              min={1}
              max={13}
              className="w-20 rounded border border-slate-300 px-2 py-2 text-sm"
              value={component.grid_placement.col_end}
              onChange={(e) =>
                onChange({
                  ...component,
                  grid_placement: {
                    ...component.grid_placement,
                    col_end: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <span className="text-[10px] text-slate-400">
            {component.grid_placement.col_end - component.grid_placement.col_start} of 12 columns
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={component.required}
            onChange={(e) => onChange({ ...component, required: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm text-slate-600">Required for publishing</span>
        </label>
      </div>

      {/* L1 template config editor (if available for this type) */}
      <div className="flex-1 overflow-y-auto">
        {TemplateConfig ? (
          <TemplateConfig
            block={fakeBlock}
            onChange={(updatedData) => {
              const d = updatedData as { meta?: Record<string, unknown> };
              onChange({
                ...component,
                meta: d.meta ?? component.meta,
              });
            }}
          />
        ) : (
          <div className="p-4">
            <p className="text-xs text-slate-400 bg-slate-100 rounded px-3 py-2">
              No additional configuration available for this component type.
              Content will be added during page creation.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
