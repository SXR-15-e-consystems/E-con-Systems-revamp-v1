import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TemplateComponent } from '../../types/template';
import type { TrayComponentDef } from './ComponentTray';
import { TRAY_COMPONENTS } from './ComponentTray';

// ─────────────────────────────────────────────────────────────────────────────
// Single sortable canvas component
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasItemProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function CanvasItem({ component, isSelected, onSelect, onDelete }: CanvasItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.component_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `${component.grid_placement.col_start} / ${component.grid_placement.col_end}`,
  };

  const def: TrayComponentDef | undefined = TRAY_COMPONENTS.find(
    (c) => c.type === component.type,
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`
        group relative rounded-lg border-2 bg-white p-4 cursor-grab active:cursor-grabbing
        transition-all duration-150 select-none min-h-[80px]
        ${isDragging ? 'opacity-50 shadow-2xl z-50 border-blue-500' : ''}
        ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      {/* Component header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg leading-none">{def?.icon ?? '📦'}</span>
        <span className="text-sm font-semibold text-slate-700">{component.label || def?.label || component.type}</span>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 ml-auto">
          {component.grid_placement.col_end - component.grid_placement.col_start} cols
        </span>
      </div>

      {/* Placeholder area */}
      <div className="rounded bg-slate-50 border border-dashed border-slate-200 p-3 text-center">
        <p className="text-xs text-slate-400">
          {def?.description ?? `${component.type} component`}
        </p>
        <p className="mt-1 text-[10px] text-slate-300">
          Content will be added during page creation
        </p>
      </div>

      {/* Delete button (visible on hover or select) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={`
          absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white
          text-xs font-bold flex items-center justify-center
          shadow-md transition-opacity duration-150
          hover:bg-red-600
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        ×
      </button>

      {/* Resize grip hint */}
      <div className="absolute bottom-1 right-1 text-slate-300 text-xs select-none pointer-events-none">
        ⋮⋮
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main canvas grid
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasGridProps {
  components: TemplateComponent[];
  columns: number;
  gap: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}

export function CanvasGrid({
  components,
  columns,
  gap,
  selectedId,
  onSelect,
  onDelete,
}: CanvasGridProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });

  return (
    <div
      className="flex-1 overflow-auto bg-slate-100 p-8"
      onClick={() => onSelect(null)}
    >
      {/* Desktop preview frame */}
      <div className="mx-auto max-w-[1440px]">
        {/* Browser chrome bar */}
        <div className="flex items-center gap-2 rounded-t-lg bg-slate-700 px-4 py-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="ml-4 flex-1 rounded bg-slate-600 px-3 py-1 text-xs text-slate-300 font-mono">
            your-site.com
          </div>
        </div>

        {/* Canvas area */}
        <div
          ref={setNodeRef}
          className={`
            relative min-h-[600px] rounded-b-lg border-2
            bg-white transition-colors duration-200
            ${isOver ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200'}
          `}
          style={{ padding: gap }}
        >
          {/* Grid lines overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ padding: gap }}
          >
            <div
              className="h-full w-full"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {Array.from({ length: columns }).map((_, i) => (
                <div
                  key={i}
                  className="h-full border-x border-dashed border-slate-100"
                />
              ))}
            </div>
          </div>

          {/* Components */}
          {components.length === 0 ? (
            <div className="flex h-[500px] items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-lg font-semibold text-slate-400">
                  Drop components here
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Drag items from the component tray on the left
                </p>
              </div>
            </div>
          ) : (
            <SortableContext
              items={components.map((c) => c.component_id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${gap}px`,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {components.map((comp) => (
                  <CanvasItem
                    key={comp.component_id}
                    component={comp}
                    isSelected={selectedId === comp.component_id}
                    onSelect={() => onSelect(comp.component_id)}
                    onDelete={() => onDelete(comp.component_id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
}
