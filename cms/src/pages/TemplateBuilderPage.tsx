import { useState, useCallback } from 'react';
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
import { arrayMove } from '@dnd-kit/sortable';

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
// Template Builder Page — Figma-like workspace
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_GRID: GridConfig = { columns: 12, row_height: 40, gap: 16 };

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

  // ── Load existing template ──
  const { isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => fetchTemplate(templateId!),
    enabled: isEdit,
  });

  // Initialize state from fetched template
  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => fetchTemplate(templateId!),
    enabled: isEdit,
  });

  if (template && !initialized) {
    setName(template.name);
    setSlug(template.slug);
    setDescription(template.description);
    setCategory(template.category);
    setGrid(template.grid);
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
      if (isEdit) {
        return updateTemplate(templateId!, payload);
      }
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

      if (!over) return;

      // Drag from tray to canvas
      const activeData = active.data.current;
      if (activeData?.source === 'tray') {
        const def = activeData.componentDef as TrayComponentDef;
        const newComponent: TemplateComponent = {
          component_id: uuidv4(),
          type: def.type,
          label: def.label,
          grid_placement: {
            col_start: 1,
            col_end: 1 + def.defaultSpan.cols,
            row_start: components.length + 1,
            row_end: components.length + 1 + def.defaultSpan.rows,
          },
          meta: { ...def.defaultMeta },
          required: true,
          order: components.length,
        };
        setComponents((prev) => [...prev, newComponent]);
        setSelectedId(newComponent.component_id);
        return;
      }

      // Reorder within canvas
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId !== overId) {
        setComponents((prev) => {
          const oldIndex = prev.findIndex((c) => c.component_id === activeId);
          const newIndex = prev.findIndex((c) => c.component_id === overId);
          if (oldIndex === -1 || newIndex === -1) return prev;
          return arrayMove(prev, oldIndex, newIndex).map((c, i) => ({
            ...c,
            order: i,
          }));
        });
      }
    },
    [components.length],
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

  // Find the component def for drag overlay
  const dragDef = dragActiveId
    ? TRAY_COMPONENTS.find((d) => `tray-${d.type}` === dragActiveId)
    : null;

  if (isLoading) {
    return <main className="flex h-screen items-center justify-center">Loading template...</main>;
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* ── Top toolbar ── */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <button
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          onClick={() => navigate('/templates')}
          type="button"
        >
          ← Templates
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <input
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold w-48"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template Name"
        />
        <input
          className="rounded border border-slate-300 px-3 py-1.5 text-sm w-40 font-mono text-slate-500"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder="template-slug"
        />
        <input
          className="rounded border border-slate-300 px-3 py-1.5 text-sm w-48"
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
          Failed to save template. Check slug uniqueness.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-sm text-emerald-700">
          Template saved successfully!
        </div>
      )}

      {/* ── Main workspace ── */}
      <div className="flex flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left: Component Tray */}
          <ComponentTray />

          {/* Center: Canvas */}
          <CanvasGrid
            components={components}
            columns={grid.columns}
            gap={grid.gap}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
          />

          {/* Drag overlay (ghost while dragging from tray) */}
          <DragOverlay>
            {dragDef ? (
              <div className="flex items-center gap-3 rounded-lg border-2 border-blue-400 bg-blue-50 p-3 shadow-xl w-64 opacity-90">
                <span className="text-xl">{dragDef.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-blue-700">{dragDef.label}</p>
                  <p className="text-xs text-blue-500">{dragDef.defaultSpan.cols} cols</p>
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
