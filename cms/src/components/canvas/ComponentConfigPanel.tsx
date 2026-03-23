import { useMemo } from 'react';
import type { TemplateComponent } from '../../types/template';
import { getTemplateConfigEditor } from '../blocks/BlockEditorRegistry';
import type { BlockType } from '../../types';
import { TRAY_COMPONENTS } from './ComponentTray';

// ─────────────────────────────────────────────────────────────────────────────
// Right sidebar — grid placement + L1 config editor
// ─────────────────────────────────────────────────────────────────────────────

const CANVAS_REF_WIDTH = 1440; // reference px width for display calculations
const TOTAL_COLUMNS = 40;

interface ComponentConfigPanelProps {
  component: TemplateComponent | null;
  onChange: (updated: TemplateComponent) => void;
}

function pxLabel(value: number): string {
  return `${value} px`;
}

export function ComponentConfigPanel({ component, onChange }: ComponentConfigPanelProps) {
  if (!component) {
    return (
      <aside className="flex h-full w-72 flex-col border-l border-slate-200 bg-slate-50">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-3xl mb-2">👆</p>
            <p className="text-sm text-slate-400 font-medium">Select a component</p>
            <p className="mt-1 text-xs text-slate-300">Click on a component to edit its properties</p>
          </div>
        </div>
      </aside>
    );
  }

  const def = TRAY_COMPONENTS.find((c) => c.type === component.type);
  const TemplateConfig = getTemplateConfigEditor(component.type as BlockType);

  const fakeBlock = {
    block_id: component.component_id,
    type: component.type as BlockType,
    order: component.order,
    visible: true,
    data: { meta: component.meta, content: {} },
  };

  const { col_start, col_end, row_start, row_end } = component.grid_placement;
  const colSpan = col_end - col_start;
  const rowSpan = row_end - row_start;

  // Pixel approximations (based on reference width)
  const gap = 8; // reference canvas gap
  const trackW = (CANVAS_REF_WIDTH - gap * (TOTAL_COLUMNS - 1)) / TOTAL_COLUMNS;
  const approxW = Math.round(trackW * colSpan + gap * (colSpan - 1));
  const ROW_HEIGHT = 40; // px per row unit
  const approxH = ROW_HEIGHT * rowSpan + gap * (rowSpan - 1);

  // Helpers that make numeric field changes clean
  const setColStart = (v: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_COLUMNS, v));
    const newEnd = Math.max(clamped + 1, col_end <= clamped ? clamped + colSpan : col_end);
    onChange({ ...component, grid_placement: { ...component.grid_placement, col_start: clamped, col_end: newEnd } });
  };
  const setColSpan = (v: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_COLUMNS - col_start + 1, v));
    onChange({ ...component, grid_placement: { ...component.grid_placement, col_end: col_start + clamped } });
  };
  const setRowStart = (v: number) => {
    const clamped = Math.max(1, v);
    const newEnd = Math.max(clamped + 1, row_end <= clamped ? clamped + rowSpan : row_end);
    onChange({ ...component, grid_placement: { ...component.grid_placement, row_start: clamped, row_end: newEnd } });
  };
  const setRowSpan = (v: number) => {
    const clamped = Math.max(1, v);
    onChange({ ...component, grid_placement: { ...component.grid_placement, row_end: row_start + clamped } });
  };

  return (
    <aside className="flex h-full w-72 flex-col border-l border-slate-200 bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Properties</h2>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg">{def?.icon ?? '📦'}</span>
          <span className="text-sm font-semibold text-slate-600">
            {component.label || def?.label || component.type}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Basic Fields ── */}
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

        {/* ── Live Pixel Readout ── */}
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold text-slate-600 mb-2">Dimensions (approx.)</p>
          <div className="rounded-lg bg-slate-900 text-white px-3 py-2.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Width</span>
              <span className="text-blue-300 font-bold">{pxLabel(approxW)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-400">Height</span>
              <span className="text-emerald-300 font-bold">{pxLabel(approxH)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700 text-slate-500 text-[10px]">
              Based on 1440px canvas · 40 cols · 40px/row
            </div>
          </div>
        </div>

        {/* ── Column Placement ── */}
        <div className="border-b border-slate-200 px-4 py-3 space-y-3">
          <p className="text-xs font-semibold text-slate-600">Column Placement</p>

          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Start column</span>
              <span className="text-[10px] text-blue-500 font-mono">col {col_start}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={TOTAL_COLUMNS}
                value={col_start}
                onChange={(e) => setColStart(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <input
                type="number"
                min={1}
                max={TOTAL_COLUMNS}
                value={col_start}
                onChange={(e) => setColStart(Number(e.target.value))}
                className="w-14 rounded border border-slate-300 px-2 py-1 text-xs text-center"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Column span</span>
              <span className="text-[10px] text-blue-500 font-mono">
                {colSpan} cols · ≈{pxLabel(approxW)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={TOTAL_COLUMNS - col_start + 1}
                value={colSpan}
                onChange={(e) => setColSpan(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <input
                type="number"
                min={1}
                max={TOTAL_COLUMNS - col_start + 1}
                value={colSpan}
                onChange={(e) => setColSpan(Number(e.target.value))}
                className="w-14 rounded border border-slate-300 px-2 py-1 text-xs text-center"
              />
            </div>
          </label>
        </div>

        {/* ── Row Placement ── */}
        <div className="border-b border-slate-200 px-4 py-3 space-y-3">
          <p className="text-xs font-semibold text-slate-600">Row Placement</p>

          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Start row</span>
              <span className="text-[10px] text-emerald-500 font-mono">row {row_start}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={30}
                value={row_start}
                onChange={(e) => setRowStart(Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min={1}
                value={row_start}
                onChange={(e) => setRowStart(Number(e.target.value))}
                className="w-14 rounded border border-slate-300 px-2 py-1 text-xs text-center"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Row span</span>
              <span className="text-[10px] text-emerald-500 font-mono">
                {rowSpan} rows · ≈{pxLabel(approxH)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={30}
                value={rowSpan}
                onChange={(e) => setRowSpan(Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number"
                min={1}
                value={rowSpan}
                onChange={(e) => setRowSpan(Number(e.target.value))}
                className="w-14 rounded border border-slate-300 px-2 py-1 text-xs text-center"
              />
            </div>
          </label>
        </div>

        {/* ── L1 template config editor ── */}
        <div>
          {TemplateConfig ? (
            <TemplateConfig
              block={fakeBlock}
              onChange={(updatedData) => {
                const d = updatedData as { meta?: Record<string, unknown> };
                onChange({ ...component, meta: d.meta ?? component.meta });
              }}
            />
          ) : (
            <div className="p-4">
              <p className="text-xs text-slate-400 bg-slate-100 rounded px-3 py-2">
                No additional configuration for this component type.
                Content will be added during page creation.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
