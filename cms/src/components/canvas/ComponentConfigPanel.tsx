import { useState } from 'react';
import type { TemplateComponent, GridConfig } from '../../types/template';
import { getTemplateConfigEditor } from '../blocks/BlockEditorRegistry';
import type { BlockType } from '../../types';
import { TRAY_COMPONENTS } from './ComponentTray';

// ─────────────────────────────────────────────────────────────────────────────
// Spacing / Border types stored inside component.meta under __ prefixed keys
// ─────────────────────────────────────────────────────────────────────────────

interface BoxSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BorderSide {
  width: number;
  style: 'none' | 'solid' | 'dashed' | 'dotted';
  color: string;
}

interface BoxBorder {
  top: BorderSide;
  right: BorderSide;
  bottom: BorderSide;
  left: BorderSide;
}

const ZERO_SIDES: BoxSides = { top: 0, right: 0, bottom: 0, left: 0 };
const ZERO_BORDER_SIDE: BorderSide = { width: 0, style: 'none', color: '#e5e7eb' };
const ZERO_BORDER: BoxBorder = {
  top: { ...ZERO_BORDER_SIDE },
  right: { ...ZERO_BORDER_SIDE },
  bottom: { ...ZERO_BORDER_SIDE },
  left: { ...ZERO_BORDER_SIDE },
};

function readMeta<T>(meta: Record<string, unknown>, key: string, fallback: T): T {
  const val = meta[key];
  if (val !== undefined && val !== null && typeof val === 'object') return val as T;
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable sub-components
// ─────────────────────────────────────────────────────────────────────────────

const CANVAS_REF_WIDTH = 1440;

function pxLabel(value: number): string {
  return `${value} px`;
}

/** Collapsible section wrapper */
function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide hover:bg-slate-100 transition-colors"
      >
        {title}
        <svg
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-4 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

/** 4-side numeric input (top, right, bottom, left) with visual box layout */
function FourSideInput({
  label,
  value,
  onChange,
  max,
  accentColor,
}: {
  label: string;
  value: BoxSides;
  onChange: (v: BoxSides) => void;
  max: number;
  accentColor: string;
}) {
  const update = (side: keyof BoxSides, n: number) => {
    onChange({ ...value, [side]: Math.max(0, Math.min(max, n)) });
  };

  const inputCls = `w-12 rounded border border-slate-300 px-1 py-1 text-[11px] text-center font-mono focus:border-${accentColor}-400 focus:ring-1 focus:ring-${accentColor}-200 outline-none`;

  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500 mb-1.5">{label}</p>
      <div className="flex flex-col items-center gap-1">
        {/* Top */}
        <input
          type="number"
          min={0}
          max={max}
          value={value.top}
          onChange={(e) => update('top', Number(e.target.value))}
          className={inputCls}
          title={`${label} top`}
        />
        {/* Left — Box — Right */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={max}
            value={value.left}
            onChange={(e) => update('left', Number(e.target.value))}
            className={inputCls}
            title={`${label} left`}
          />
          <div
            className="w-10 h-7 rounded border-2 border-dashed flex items-center justify-center text-[8px] font-mono text-slate-300"
            style={{ borderColor: `var(--tw-color-${accentColor}-300, #94a3b8)` }}
          >
            px
          </div>
          <input
            type="number"
            min={0}
            max={max}
            value={value.right}
            onChange={(e) => update('right', Number(e.target.value))}
            className={inputCls}
            title={`${label} right`}
          />
        </div>
        {/* Bottom */}
        <input
          type="number"
          min={0}
          max={max}
          value={value.bottom}
          onChange={(e) => update('bottom', Number(e.target.value))}
          className={inputCls}
          title={`${label} bottom`}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────

interface ComponentConfigPanelProps {
  component: TemplateComponent | null;
  onChange: (updated: TemplateComponent) => void;
  grid: GridConfig;
}

export function ComponentConfigPanel({ component, onChange, grid }: ComponentConfigPanelProps) {
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

  // Dynamic pixel approximations using actual grid config
  const totalColumns = grid.columns;
  const rowHeight = grid.row_height;
  const gridGap = grid.gap;
  const trackW = (CANVAS_REF_WIDTH - gridGap * (totalColumns - 1)) / totalColumns;
  const approxW = Math.round(trackW * colSpan + gridGap * (colSpan - 1));
  const approxH = rowHeight * rowSpan + gridGap * (rowSpan - 1);

  // ── Spacing meta helpers ──
  const meta = component.meta;
  const margin = readMeta<BoxSides>(meta, '__margin', { ...ZERO_SIDES });
  const padding = readMeta<BoxSides>(meta, '__padding', { ...ZERO_SIDES });
  const border = readMeta<BoxBorder>(meta, '__border', JSON.parse(JSON.stringify(ZERO_BORDER)));
  const maxWidth = (meta.__maxWidth as string) ?? '';
  const minHeight = (meta.__minHeight as string) ?? '';

  const updateMeta = (patch: Record<string, unknown>) => {
    onChange({ ...component, meta: { ...component.meta, ...patch } });
  };

  // ── Grid placement helpers ──
  const setColStart = (v: number) => {
    const clamped = Math.max(1, Math.min(totalColumns, v));
    const newEnd = Math.max(clamped + 1, col_end <= clamped ? clamped + colSpan : col_end);
    onChange({ ...component, grid_placement: { ...component.grid_placement, col_start: clamped, col_end: newEnd } });
  };
  const setColSpan = (v: number) => {
    const clamped = Math.max(1, Math.min(totalColumns - col_start + 1, v));
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

  // ── Border helper ──
  const updateBorderSide = (side: keyof BoxBorder, patch: Partial<BorderSide>) => {
    const newBorder: BoxBorder = {
      ...border,
      [side]: { ...border[side], ...patch },
    };
    // Auto-set style to 'solid' if user only sets width
    if (patch.width && patch.width > 0 && newBorder[side].style === 'none') {
      newBorder[side].style = 'solid';
    }
    updateMeta({ __border: newBorder });
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
        <Section title="General" defaultOpen={true}>
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
        </Section>

        {/* ── Live Pixel Readout ── */}
        <Section title="Dimensions" defaultOpen={true}>
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
              {CANVAS_REF_WIDTH}px ref · {totalColumns} cols · {rowHeight}px/row · gap {gridGap}px
            </div>
          </div>
          {/* Max width / Min height */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-500">Max width</span>
              <input
                className="rounded border border-slate-300 px-2 py-1 text-xs font-mono"
                value={maxWidth}
                onChange={(e) => updateMeta({ __maxWidth: e.target.value })}
                placeholder="e.g. 600px"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-500">Min height</span>
              <input
                className="rounded border border-slate-300 px-2 py-1 text-xs font-mono"
                value={minHeight}
                onChange={(e) => updateMeta({ __minHeight: e.target.value })}
                placeholder="e.g. 200px"
              />
            </label>
          </div>
        </Section>

        {/* ── Column Placement ── */}
        <Section title="Column Placement" defaultOpen={true}>
          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Start column</span>
              <span className="text-[10px] text-blue-500 font-mono">col {col_start}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={totalColumns}
                value={col_start}
                onChange={(e) => setColStart(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <input
                type="number"
                min={1}
                max={totalColumns}
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
                max={totalColumns - col_start + 1}
                value={colSpan}
                onChange={(e) => setColSpan(Number(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <input
                type="number"
                min={1}
                max={totalColumns - col_start + 1}
                value={colSpan}
                onChange={(e) => setColSpan(Number(e.target.value))}
                className="w-14 rounded border border-slate-300 px-2 py-1 text-xs text-center"
              />
            </div>
          </label>
        </Section>

        {/* ── Row Placement ── */}
        <Section title="Row Placement" defaultOpen={true}>
          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Start row</span>
              <span className="text-[10px] text-emerald-500 font-mono">row {row_start}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={200}
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
                max={200}
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
        </Section>

        {/* ── Public Page Layout ── */}
        <Section title="Public Page Layout" defaultOpen={true}>
          <p className="text-[10px] text-slate-400 mb-2">
            Controls how this block renders on the live page (independent of canvas grid rows).
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Height</span>
            <input
              className="rounded border border-slate-300 px-2 py-1.5 text-xs font-mono"
              value={(meta.__height as string) ?? 'auto'}
              onChange={(e) => updateMeta({ __height: e.target.value || 'auto' })}
              placeholder="auto"
            />
            <span className="text-[10px] text-slate-400">auto · 400px · 50vh · 100%</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Stack Order</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={typeof meta.__order === 'number' ? meta.__order : component.order}
                onChange={(e) => updateMeta({ __order: Math.max(0, Number(e.target.value)) })}
                className="rounded border border-slate-300 px-2 py-1.5 text-xs font-mono w-20"
              />
              <span className="text-[10px] text-slate-400">Lower = higher on page</span>
            </div>
          </label>
        </Section>

        {/* ── Spacing (Margin + Padding) ── */}
        <Section title="Spacing" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-4">
            <FourSideInput
              label="Margin"
              value={margin}
              onChange={(v) => updateMeta({ __margin: v })}
              max={200}
              accentColor="violet"
            />
            <FourSideInput
              label="Padding"
              value={padding}
              onChange={(v) => updateMeta({ __padding: v })}
              max={200}
              accentColor="blue"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Margin adds space outside the block. Padding adds space inside.
          </p>
        </Section>

        {/* ── Border ── */}
        <Section title="Border" defaultOpen={false}>
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side} className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 w-10 capitalize">{side}</span>
              <input
                type="number"
                min={0}
                max={20}
                value={border[side].width}
                onChange={(e) => updateBorderSide(side, { width: Math.max(0, Number(e.target.value)) })}
                className="w-12 rounded border border-slate-300 px-1.5 py-1 text-[11px] text-center font-mono"
                title={`${side} border width`}
              />
              <select
                value={border[side].style}
                onChange={(e) => updateBorderSide(side, { style: e.target.value as BorderSide['style'] })}
                className="rounded border border-slate-300 px-1 py-1 text-[11px]"
              >
                <option value="none">none</option>
                <option value="solid">solid</option>
                <option value="dashed">dashed</option>
                <option value="dotted">dotted</option>
              </select>
              <input
                type="color"
                value={border[side].color}
                onChange={(e) => updateBorderSide(side, { color: e.target.value })}
                className="h-6 w-6 rounded border border-slate-300 cursor-pointer p-0"
                title={`${side} border color`}
              />
            </div>
          ))}
          <p className="text-[10px] text-slate-400 mt-1">
            Set width &gt; 0 and pick a style to show the border on the public page.
          </p>
        </Section>

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
