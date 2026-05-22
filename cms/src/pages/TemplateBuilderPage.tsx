import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';

import { ComponentTray, TRAY_COMPONENTS } from '../components/canvas/ComponentTray';
import { CanvasGrid } from '../components/canvas/CanvasGrid';
import { ComponentConfigPanel } from '../components/canvas/ComponentConfigPanel';
import type { TemplateComponent, GridConfig } from '../types/template';
import type { TrayComponentDef } from '../components/canvas/ComponentTray';
import {
  fetchTemplate,
  createTemplate,
  updateTemplate,
} from '../api/templateEndpoints';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_GRID: GridConfig = { columns: 40, row_height: 40, gap: 8 };

// ─────────────────────────────────────────────────────────────────────────────
// Helper: convert pointer (clientX/Y) → grid cell (col, row)
// ─────────────────────────────────────────────────────────────────────────────

function pointerToCell(
  clientX: number,
  clientY: number,
  canvasEl: HTMLElement,
  columns: number,
  rowHeight: number,
  gap: number,
): { col: number; row: number } {
  const rect = canvasEl.getBoundingClientRect();
  const relX = Math.max(0, clientX - rect.left - gap);
  const relY = Math.max(0, clientY - rect.top - gap);
  const trackW = (rect.width - gap * 2 - gap * (columns - 1)) / columns;
  const col = Math.max(1, Math.min(columns, Math.floor(relX / (trackW + gap)) + 1));
  const row = Math.max(1, Math.floor(relY / (rowHeight + gap)) + 1);
  return { col, row };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: detect & resolve overlapping components
// Pushes overlapped blocks down so nothing visually collides.
// ─────────────────────────────────────────────────────────────────────────────

function rectsOverlap(
  a: { col_start: number; col_end: number; row_start: number; row_end: number },
  b: { col_start: number; col_end: number; row_start: number; row_end: number },
): boolean {
  return (
    a.col_start < b.col_end &&
    a.col_end > b.col_start &&
    a.row_start < b.row_end &&
    a.row_end > b.row_start
  );
}

function resolveOverlaps(
  components: TemplateComponent[],
  movedId: string,
): TemplateComponent[] {
  const result = components.map((c) => ({ ...c, grid_placement: { ...c.grid_placement } }));
  const moved = result.find((c) => c.component_id === movedId);
  if (!moved) return result;

  // Iteratively push down any block that overlaps with the moved block
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = result.length * 2; // safety valve

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;
    for (const other of result) {
      if (other.component_id === movedId) continue;
      if (rectsOverlap(moved.grid_placement, other.grid_placement)) {
        // Push `other` below `moved`
        const rowSpan = other.grid_placement.row_end - other.grid_placement.row_start;
        other.grid_placement.row_start = moved.grid_placement.row_end;
        other.grid_placement.row_end = other.grid_placement.row_start + rowSpan;
        changed = true;
      }
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// RowBackgroundsPanel — shown in right sidebar when no component is selected
// Lets designers assign a full-bleed background color to each template row.
// ─────────────────────────────────────────────────────────────────────────────

function RowBackgroundsPanel({
  components,
  grid,
  onChange,
}: {
  components: TemplateComponent[];
  grid: GridConfig;
  onChange: React.Dispatch<React.SetStateAction<GridConfig>>;
}) {
  const uniqueRows = [...new Set(components.map((c) => c.grid_placement.row_start))].sort(
    (a, b) => a - b,
  );
  const rowBgs = grid.row_backgrounds ?? {};

  const setRowBg = (rowStart: number, color: string) => {
    onChange((g) => ({
      ...g,
      row_backgrounds: { ...(g.row_backgrounds ?? {}), [String(rowStart)]: color },
    }));
  };

  const clearRowBg = (rowStart: number) => {
    onChange((g) => {
      const bgs = { ...(g.row_backgrounds ?? {}) };
      delete bgs[String(rowStart)];
      return { ...g, row_backgrounds: bgs };
    });
  };

  return (
    <div className="w-[320px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Grid &amp; Layout Settings</h3>
        <p className="mt-1 text-[11px] text-slate-400">
          Select a component to configure its layout properties.
        </p>
      </div>

      {/* ── Content max-width ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-0 border-b border-slate-100 space-y-1 pb-4">
        <label className="text-xs font-bold text-slate-600">Content Max Width</label>
        <p className="text-[10px] text-slate-400 leading-snug mb-1">
          Constrains side-by-side columns on wide screens (e.g. 4K / 2560px).
          Row background colours still bleed edge-to-edge.
          Enter a CSS length (e.g.&nbsp;<code className="font-mono">1280px</code>) or leave blank for no limit.
        </p>
        <input
          type="text"
          value={grid.content_max_width ?? ''}
          onChange={(e) =>
            onChange((g) => ({ ...g, content_max_width: e.target.value.trim() || undefined }))
          }
          placeholder="e.g. 1280px  (empty = no limit)"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs font-mono focus:border-blue-400 focus:outline-none"
        />
        {grid.content_max_width && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-green-700 font-medium">
              Active — grid constrained to {grid.content_max_width}
            </span>
          </div>
        )}
      </div>

      {/* ── Row background colours ───────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Row Background Colors</h4>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Full-width bg per row — always extends to viewport edges.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {uniqueRows.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Add components to the canvas to configure row backgrounds.</p>
        ) : (
          uniqueRows.map((rowStart) => {
            const rowComps = components.filter((c) => c.grid_placement.row_start === rowStart);
            const rowLabel = rowComps.map((c) => c.label || c.type).join(', ');
            const currentBg = rowBgs[String(rowStart)] ?? '';
            return (
              <div key={rowStart} className="rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600">Row {rowStart}</span>
                  <span className="text-[10px] text-slate-400 truncate">{rowLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentBg || '#ffffff'}
                    onChange={(e) => setRowBg(rowStart, e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-slate-300 p-0.5"
                    title="Pick background color"
                  />
                  <input
                    type="text"
                    value={currentBg}
                    onChange={(e) => setRowBg(rowStart, e.target.value)}
                    placeholder="transparent"
                    className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-xs font-mono focus:border-blue-400 focus:outline-none"
                  />
                  {currentBg && (
                    <button
                      type="button"
                      onClick={() => clearRowBg(rowStart)}
                      className="text-slate-400 hover:text-red-500 text-xs leading-none"
                      title="Remove background"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {currentBg && (
                  <div
                    className="h-4 w-full rounded border border-slate-200"
                    style={{ backgroundColor: currentBg }}
                    title={currentBg}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TemplateBuilderPage
// ─────────────────────────────────────────────────────────────────────────────

export function TemplateBuilderPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!templateId;

  // ── State ──
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [grid, setGrid] = useState<GridConfig>(DEFAULT_GRID);
  const [components, setComponents] = useState<TemplateComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  // JS injection fields
  const [customJsHead, setCustomJsHead] = useState('');
  const [customJsBody, setCustomJsBody] = useState('');
  const [templateScriptsOpen, setTemplateScriptsOpen] = useState(false);

  // Refs for position-aware drop
  const canvasGridRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  // ── Track pointer position globally during any drag ──
  useEffect(() => {
    const fn = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', fn, { passive: true });
    return () => window.removeEventListener('pointermove', fn);
  }, []);

  // ── Load existing template ──
  const { isLoading, data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => fetchTemplate(templateId!),
    enabled: isEdit,
  });

  // Initialize form state from loaded template in useEffect (fixes CMS-BUG-003)
  useEffect(() => {
    if (template && !initialized) {
      setName(template.name);
      setSlug(template.slug);
      setDescription(template.description);
      setCategory(template.category);
      // Upgrade old 12-col templates to 40 cols
      setGrid({
        ...template.grid,
        columns: template.grid.columns < 40 ? 40 : template.grid.columns,
      });
      // Migrate: ensure __order is set (derive from row_start for legacy templates)
      const migratedComponents = template.components.map((c) => ({
        ...c,
        meta: {
          ...c.meta,
          __order: typeof c.meta.__order === 'number'
            ? c.meta.__order
            : c.grid_placement.row_start,
        },
      }));
      setComponents(migratedComponents);
      setCustomJsHead(template.custom_js_head ?? '');
      setCustomJsBody(template.custom_js_body ?? '');
      setInitialized(true);
    }
  }, [template, initialized]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug,
        description,
        category,
        grid,
        components: components.map((c, i) => ({ ...c, order: i })),
        custom_js_head: customJsHead,
        custom_js_body: customJsBody,
      };
      if (isEdit) return updateTemplate(templateId!, payload);
      return createTemplate(payload);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      if (!isEdit) {
        navigate(`/templates/${saved.id}/edit`, { replace: true });
      }
    },
  });

  // ── DnD sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // ── DnD handlers ──
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDragActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragActiveId(null);
      const { active, over } = event;
      const activeData = active.data.current;

      // Must be dropped over the canvas
      if (!over || over.id !== 'canvas-drop-zone') return;

      // ── Compute grid cell from current pointer position ──
      const computeCell = (): { col: number; row: number } => {
        if (!canvasGridRef.current) return { col: 1, row: 1 };
        return pointerToCell(
          pointerRef.current.x,
          pointerRef.current.y,
          canvasGridRef.current,
          grid.columns,
          grid.row_height,
          grid.gap,
        );
      };

      // ── Drag from component tray ──
      if (activeData?.source === 'tray') {
        const def = activeData.componentDef as TrayComponentDef;
        const { col, row } = computeCell();
        const colEnd = Math.min(grid.columns + 1, col + def.defaultSpan.cols);
        const newComponent: TemplateComponent = {
          component_id: uuidv4(),
          type: def.type,
          label: def.label,
          grid_placement: {
            col_start: col,
            col_end: colEnd,
            row_start: row,
            row_end: row + def.defaultSpan.rows,
          },
          meta: { ...def.defaultMeta, __height: 'auto', __order: components.length },
          required: true,
          order: components.length,
        };
        setComponents((prev) =>
          resolveOverlaps([...prev, newComponent], newComponent.component_id),
        );
        setSelectedId(newComponent.component_id);
        return;
      }

      // ── Reposition already-placed canvas component ──
      if (activeData?.source === 'canvas') {
        const comp = activeData.component as TemplateComponent;
        const { col, row } = computeCell();
        const colSpan = comp.grid_placement.col_end - comp.grid_placement.col_start;
        const rowSpan = comp.grid_placement.row_end - comp.grid_placement.row_start;
        setComponents((prev) => {
          const updated = prev.map((c) =>
            c.component_id === comp.component_id
              ? {
                  ...c,
                  grid_placement: {
                    col_start: col,
                    col_end: Math.min(grid.columns + 1, col + colSpan),
                    row_start: row,
                    row_end: row + rowSpan,
                  },
                }
              : c,
          );
          return resolveOverlaps(updated, comp.component_id);
        });
        return;
      }
    },
    [components.length, grid],
  );

  const handleDelete = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.component_id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleComponentUpdate = useCallback((updated: TemplateComponent) => {
    setComponents((prev) => {
      const list = prev.map((c) =>
        c.component_id === updated.component_id ? updated : c,
      );
      return resolveOverlaps(list, updated.component_id);
    });
  }, []);

  const selectedComponent = components.find((c) => c.component_id === selectedId) ?? null;

  // Determine what's being dragged for the overlay
  const dragTrayDef = dragActiveId
    ? TRAY_COMPONENTS.find((d) => `tray-${d.type}` === dragActiveId)
    : null;
  const dragCanvasComp = dragActiveId
    ? components.find((c) => `canvas-${c.component_id}` === dragActiveId)
    : null;
  const dragCanvasDef = dragCanvasComp
    ? TRAY_COMPONENTS.find((d) => d.type === dragCanvasComp.type)
    : null;

  if (isLoading) {
    return <main className="flex h-screen items-center justify-center">Loading template...</main>;
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* ── Top toolbar ── */}
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <button
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          onClick={() => navigate('/templates')}
          type="button"
        >
          ← Templates
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <input
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold w-40"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template Name"
        />
        <input
          className="rounded border border-slate-300 px-3 py-1.5 text-sm w-36 font-mono text-slate-500"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder="template-slug"
        />
        <input
          className="rounded border border-slate-300 px-3 py-1.5 text-sm w-44"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />

        <select
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="general">General</option>
          <option value="landing-page">Landing Page</option>
          <option value="product-page">Product Page</option>
          <option value="campaign">Campaign</option>
          <option value="event">Event</option>
        </select>

        <div className="h-6 w-px bg-slate-200" />

        {/* Grid columns control */}
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <span className="font-medium">Cols:</span>
          <input
            type="number"
            min={12}
            max={80}
            step={4}
            value={grid.columns}
            onChange={(e) => setGrid((g) => ({ ...g, columns: Math.max(12, Number(e.target.value)) }))}
            className="w-16 rounded border border-slate-300 px-2 py-1.5 text-sm text-center font-mono"
          />
        </label>

        {/* Row height control */}
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <span className="font-medium">Row px:</span>
          <input
            type="number"
            min={20}
            max={120}
            step={10}
            value={grid.row_height}
            onChange={(e) => setGrid((g) => ({ ...g, row_height: Math.max(20, Number(e.target.value)) }))}
            className="w-16 rounded border border-slate-300 px-2 py-1.5 text-sm text-center font-mono"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {components.length} component{components.length !== 1 ? 's' : ''}
          </span>
          <button
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !name || !slug}
            type="button"
          >
            {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update Template' : 'Save Template'}
          </button>
        </div>
      </header>

      {saveMutation.isError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-600">
          Failed to save: {
            (() => {
              const err = saveMutation.error as any;
              const detail = err?.response?.data?.detail;
              if (typeof detail === 'string') return detail;
              if (Array.isArray(detail)) return detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
              return 'Check slug uniqueness or layout bounds.';
            })()
          }
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-sm text-emerald-700">
          Template saved successfully!
        </div>
      )}

      {/* ── Template Scripts (collapsible) ── */}
      <div className="border-b border-slate-200">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 text-left"
          onClick={() => setTemplateScriptsOpen((v) => !v)}
        >
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Template Scripts / Tracking{' '}
            <span className="font-normal text-slate-400 normal-case">(applied to all pages using this template)</span>
          </span>
          <span className="text-slate-400 text-sm">{templateScriptsOpen ? '▲' : '▼'}</span>
        </button>
        {templateScriptsOpen && (
          <div className="grid grid-cols-2 gap-4 px-4 py-4 bg-white">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Head Scripts <span className="font-normal text-slate-400">(injected before page renders)</span></span>
              <textarea
                className="min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={customJsHead}
                onChange={(e) => setCustomJsHead(e.target.value)}
                placeholder="<!-- e.g. Google Tag Manager snippet -->"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Body Scripts <span className="font-normal text-slate-400">(injected after page renders)</span></span>
              <textarea
                className="min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={customJsBody}
                onChange={(e) => setCustomJsBody(e.target.value)}
                placeholder="<!-- e.g. analytics / chat widget -->"
              />
            </label>
          </div>
        )}
      </div>

      {/* ── Main workspace ── */}
      <div className="flex flex-1 overflow-hidden">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Left: Component Tray */}
          <ComponentTray />

          {/* Center: Canvas */}
          <CanvasGrid
            components={components}
            columns={grid.columns}
            rowHeight={grid.row_height}
            gap={grid.gap}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            onUpdate={handleComponentUpdate}
            gridRef={canvasGridRef}
          />

          {/* Drag overlay (ghost shown while dragging) */}
          <DragOverlay>
            {dragTrayDef ? (
              // Ghost for tray item
              <div className="flex items-center gap-3 rounded-lg border-2 border-blue-400 bg-blue-50 p-3 shadow-xl w-56 opacity-90">
                <span className="text-xl">{dragTrayDef.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-blue-700">{dragTrayDef.label}</p>
                  <p className="text-xs text-blue-500">
                    {dragTrayDef.defaultSpan.cols} cols × {dragTrayDef.defaultSpan.rows} rows
                  </p>
                </div>
              </div>
            ) : dragCanvasComp && dragCanvasDef ? (
              // Ghost for canvas component being repositioned
              <div className="flex items-center gap-3 rounded-lg border-2 border-violet-400 bg-violet-50 p-3 shadow-xl w-56 opacity-90">
                <span className="text-xl">{dragCanvasDef.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-violet-700">{dragCanvasComp.label}</p>
                  <p className="text-xs text-violet-500">
                    {dragCanvasComp.grid_placement.col_end - dragCanvasComp.grid_placement.col_start}c ×{' '}
                    {dragCanvasComp.grid_placement.row_end - dragCanvasComp.grid_placement.row_start}r
                    {' '}· Moving…
                  </p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Right: Config Panel or Row Backgrounds Panel */}
        {selectedId ? (
          <ComponentConfigPanel
            component={selectedComponent}
            onChange={handleComponentUpdate}
            grid={grid}
          />
        ) : (
          <RowBackgroundsPanel
            components={components}
            grid={grid}
            onChange={setGrid}
          />
        )}
      </div>
    </div>
  );
}
