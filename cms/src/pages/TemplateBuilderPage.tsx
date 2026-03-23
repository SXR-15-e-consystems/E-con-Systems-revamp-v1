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
    setComponents(template.components);
    setInitialized(true);
  }

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
          meta: { ...def.defaultMeta },
          required: true,
          order: components.length,
        };
        setComponents((prev) => [...prev, newComponent]);
        setSelectedId(newComponent.component_id);
        return;
      }

      // ── Reposition already-placed canvas component ──
      if (activeData?.source === 'canvas') {
        const comp = activeData.component as TemplateComponent;
        const { col, row } = computeCell();
        const colSpan = comp.grid_placement.col_end - comp.grid_placement.col_start;
        const rowSpan = comp.grid_placement.row_end - comp.grid_placement.row_start;
        setComponents((prev) =>
          prev.map((c) =>
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
          ),
        );
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
    setComponents((prev) =>
      prev.map((c) => (c.component_id === updated.component_id ? updated : c)),
    );
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

        {/* Right: Config Panel */}
        <ComponentConfigPanel
          component={selectedComponent}
          onChange={handleComponentUpdate}
        />
      </div>
    </div>
  );
}
