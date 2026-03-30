import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useRef, useState, useCallback, useEffect } from 'react';
import type { TemplateComponent } from '../../types/template';
import type { TrayComponentDef } from './ComponentTray';
import { TRAY_COMPONENTS } from './ComponentTray';
import { getBlockPreview } from '../previews/BlockPreviewRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ResizeState {
  componentId: string;
  edge: 'right' | 'bottom' | 'corner';
  startX: number;
  startY: number;
  startColEnd: number;
  startRowEnd: number;
  colStart: number;
  rowStart: number;
}

interface DimBadge {
  cols: number;
  rows: number;
  px: { w: number; h: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// CanvasItem
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasItemProps {
  component: TemplateComponent;
  isSelected: boolean;
  columns: number;
  rowHeight: number;
  gap: number;
  canvasWidth: number;
  onSelect: () => void;
  onDelete: () => void;
  onResizeStart: (e: React.PointerEvent, edge: 'right' | 'bottom' | 'corner') => void;
  dimBadge: DimBadge | null;
}

function CanvasItem({
  component,
  isSelected,
  columns,
  rowHeight,
  gap,
  canvasWidth,
  onSelect,
  onDelete,
  onResizeStart,
  dimBadge,
}: CanvasItemProps) {
  // ── Draggable: for repositioning on canvas ──
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `canvas-${component.component_id}`,
    data: { source: 'canvas', component },
  });

  const def = TRAY_COMPONENTS.find((c) => c.type === component.type);
  const colSpan = component.grid_placement.col_end - component.grid_placement.col_start;
  const rowSpan = component.grid_placement.row_end - component.grid_placement.row_start;

  const colTrackPx = canvasWidth > 0 ? (canvasWidth - gap * (columns - 1)) / columns : 0;
  const approxW = Math.round(colTrackPx * colSpan + gap * (colSpan - 1));
  const approxH = rowHeight * rowSpan + gap * (rowSpan - 1);

  return (
    <div
      ref={setDragRef}
      style={{
        gridColumn: `${component.grid_placement.col_start} / ${component.grid_placement.col_end}`,
        gridRow: `${component.grid_placement.row_start} / ${component.grid_placement.row_end}`,
        opacity: isDragging ? 0.35 : 1,
        transition: 'opacity 0.1s',
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`
        group relative rounded-lg border-2 bg-white flex flex-col overflow-hidden select-none
        ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg z-10'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      {/* ── Drag-to-move handle (header bar) ── */}
      <div
        {...attributes}
        {...listeners}
        title="Drag to reposition"
        className="flex items-center gap-2 px-2 pt-2 pb-1 flex-shrink-0 cursor-move bg-slate-50 hover:bg-blue-50/50 transition-colors border-b border-slate-100"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" className="text-slate-300 flex-shrink-0" fill="currentColor">
          <circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/>
          <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
          <circle cx="3" cy="12" r="1.2"/><circle cx="7" cy="12" r="1.2"/>
        </svg>
        <span className="text-sm leading-none">{def?.icon ?? '📦'}</span>
        <span className="text-xs font-semibold text-slate-700 truncate">
          {component.label || def?.label || component.type}
        </span>
        <span className="ml-auto mr-5 text-[9px] font-mono text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 whitespace-nowrap flex-shrink-0">
          {colSpan}c × {rowSpan}r
        </span>
      </div>

      {/* ── Component preview skeleton ── */}
      {(() => {
        const Preview = getBlockPreview(component.type);
        const previewData = component.meta ?? {};
        return (
          <div className="flex-1 mx-2 mb-2 mt-1.5 rounded border border-slate-200 overflow-hidden min-h-0">
            <Preview data={previewData} />
          </div>
        );
      })()}

      {/* ── Live resize badge ── */}
      {dimBadge && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-slate-900/90 text-white text-[10px] font-mono rounded-lg px-3 py-2 shadow-2xl whitespace-nowrap">
            <div className="font-bold text-blue-300 text-[11px]">
              {dimBadge.cols} cols × {dimBadge.rows} rows
            </div>
            <div className="text-slate-300 mt-0.5">
              ≈ {dimBadge.px.w} × {dimBadge.px.h} px
            </div>
          </div>
        </div>
      )}

      {/* ── Delete button ── */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className={`
          absolute top-[5px] right-1.5 h-5 w-5 rounded-full bg-red-500 text-white
          text-[10px] font-bold flex items-center justify-center z-20
          shadow-md hover:bg-red-600 transition-opacity
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
      >×</button>

      {/* ── Right-edge resize (width) ── */}
      <div
        onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'right'); }}
        title="Drag to resize width"
        className={`
          absolute top-0 right-0 h-full w-3 cursor-ew-resize z-20 select-none
          flex items-center justify-end pr-0.5
          opacity-0 group-hover:opacity-100 transition-opacity
          ${isSelected ? 'opacity-100' : ''}
        `}
      >
        <div className="h-8 w-1 rounded-full bg-blue-400/80" />
      </div>

      {/* ── Bottom-edge resize (height) ── */}
      <div
        onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'bottom'); }}
        title="Drag to resize height"
        className={`
          absolute bottom-0 left-0 w-full h-3 cursor-ns-resize z-20 select-none
          flex items-end justify-center pb-0.5
          opacity-0 group-hover:opacity-100 transition-opacity
          ${isSelected ? 'opacity-100' : ''}
        `}
      >
        <div className="h-1 w-8 rounded-full bg-blue-400/80" />
      </div>

      {/* ── Corner resize (both) ── */}
      <div
        onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, 'corner'); }}
        title="Drag to resize"
        className={`
          absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize z-30 select-none
          flex items-end justify-end pr-0.5 pb-0.5
          opacity-0 group-hover:opacity-100 transition-opacity
          ${isSelected ? 'opacity-100' : ''}
        `}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" className="text-blue-500">
          <path d="M8 1L1 8M8 4.5L4.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CanvasGrid
// ─────────────────────────────────────────────────────────────────────────────

interface CanvasGridProps {
  components: TemplateComponent[];
  columns: number;
  rowHeight: number;
  gap: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: TemplateComponent) => void;
  /** Shared ref so parent can compute drop grid-cell from pointer position */
  gridRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function CanvasGrid({
  components,
  columns,
  rowHeight,
  gap,
  selectedId,
  onSelect,
  onDelete,
  onUpdate,
  gridRef,
}: CanvasGridProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });
  const [canvasWidth, setCanvasWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  // ── Resize state ──
  const resizeRef = useRef<ResizeState | null>(null);
  const [activeResizeBadge, setActiveResizeBadge] = useState<{ id: string; badge: DimBadge } | null>(null);

  const getColTrack = useCallback(
    (w: number) => (w - gap * (columns - 1)) / columns,
    [columns, gap],
  );

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, component: TemplateComponent, edge: 'right' | 'bottom' | 'corner') => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      resizeRef.current = {
        componentId: component.component_id,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        startColEnd: component.grid_placement.col_end,
        startRowEnd: component.grid_placement.row_end,
        colStart: component.grid_placement.col_start,
        rowStart: component.grid_placement.row_start,
      };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rs = resizeRef.current;
      if (!rs || canvasWidth === 0) return;

      const dx = e.clientX - rs.startX;
      const dy = e.clientY - rs.startY;
      const trackW = getColTrack(canvasWidth);
      const colDelta = Math.round(dx / (trackW + gap));
      const rowDelta = Math.round(dy / (rowHeight + gap));

      const comp = components.find((c) => c.component_id === rs.componentId);
      if (!comp) return;

      let newColEnd = rs.startColEnd;
      let newRowEnd = rs.startRowEnd;

      if (rs.edge === 'right' || rs.edge === 'corner') {
        newColEnd = Math.max(rs.colStart + 1, Math.min(columns + 1, rs.startColEnd + colDelta));
      }
      if (rs.edge === 'bottom' || rs.edge === 'corner') {
        newRowEnd = Math.max(rs.rowStart + 1, rs.startRowEnd + rowDelta);
      }

      const newColSpan = newColEnd - rs.colStart;
      const newRowSpan = newRowEnd - rs.rowStart;
      const trackW2 = getColTrack(canvasWidth);
      const approxW = Math.round(trackW2 * newColSpan + gap * (newColSpan - 1));
      const approxH = rowHeight * newRowSpan + gap * (newRowSpan - 1);

      setActiveResizeBadge({
        id: rs.componentId,
        badge: { cols: newColSpan, rows: newRowSpan, px: { w: approxW, h: approxH } },
      });

      onUpdate({
        ...comp,
        grid_placement: { ...comp.grid_placement, col_end: newColEnd, row_end: newRowEnd },
      });
    },
    [canvasWidth, columns, components, gap, getColTrack, onUpdate, rowHeight],
  );

  const handlePointerUp = useCallback(() => {
    resizeRef.current = null;
    setActiveResizeBadge(null);
  }, []);

  // Extra canvas rows for drop area
  const maxRow = Math.max(8, ...components.map((c) => c.grid_placement.row_end + 2));
  const TOTAL_ROWS = Math.max(maxRow, 20);

  // Ref callback: wire drop ref, shared gridRef, and ResizeObserver in one shot
  const rafRef = useRef<number>(0);
  const setCanvasRef = useCallback(
    (el: HTMLDivElement | null) => {
      setDropRef(el);
      gridRef.current = el;
      // Disconnect any previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      if (el) {
        const ro = new ResizeObserver((entries) => {
          // Debounce via rAF to avoid re-render storm on every pixel change
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            setCanvasWidth(entries[0].contentRect.width);
          });
        });
        ro.observe(el);
        observerRef.current = ro;
        // Set initial width immediately
        setCanvasWidth(el.getBoundingClientRect().width);
      }
    },
    [setDropRef, gridRef],
  );

  // Ensure observer is disconnected on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, []);

  return (
    <div
      className="flex-1 overflow-auto bg-slate-100 p-6"
      onClick={() => onSelect(null)}
    >
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
          <span className="text-[10px] text-slate-400 font-mono ml-2 whitespace-nowrap">
            {columns} cols · {rowHeight}px/row · gap {gap}px
          </span>
        </div>

        {/* Canvas area */}
        <div
          ref={setCanvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`
            relative rounded-b-lg border-2 bg-white transition-colors duration-200
            ${isOver ? 'border-blue-400 bg-blue-50/20' : 'border-slate-200'}
          `}
          style={{ padding: gap }}
        >
          {/* Grid overlay — column guides */}
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
                  /* Show a number label every 5 columns */
                  data-col={i + 1}
                />
              ))}
            </div>
            {/* Row number guides every 5 rows */}
            <div className="absolute left-0 top-0 flex flex-col" style={{ gap: `${gap}px`, paddingTop: gap }}>
              {Array.from({ length: Math.ceil(TOTAL_ROWS / 5) }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 text-[8px] text-slate-300 font-mono leading-none pl-0.5"
                  style={{ top: (i * 5) * (rowHeight + gap) }}
                >
                  r{i * 5 + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {components.length === 0 && (
            <div
              className="flex items-center justify-center"
              style={{ minHeight: TOTAL_ROWS * (rowHeight + gap) }}
            >
              <div className="text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-lg font-semibold text-slate-400">Drop components here</p>
                <p className="mt-1 text-sm text-slate-300">Drag from the left tray — drop anywhere on the grid</p>
                <p className="mt-2 text-[11px] text-slate-300 font-mono bg-slate-100 rounded-full px-4 py-1.5 inline-block">
                  {columns}-column grid · Drop at exact position · Drag edges to resize
                </p>
              </div>
            </div>
          )}

          {/* Components grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gridTemplateRows: `repeat(${TOTAL_ROWS}, ${rowHeight}px)`,
              gap: `${gap}px`,
              position: 'relative',
              zIndex: 1,
              minHeight: TOTAL_ROWS * (rowHeight + gap),
            }}
          >
            {components.map((comp) => (
              <CanvasItem
                key={comp.component_id}
                component={comp}
                isSelected={selectedId === comp.component_id}
                columns={columns}
                rowHeight={rowHeight}
                gap={gap}
                canvasWidth={canvasWidth}
                onSelect={() => onSelect(comp.component_id)}
                onDelete={() => onDelete(comp.component_id)}
                onResizeStart={(e, edge) => handleResizeStart(e, comp, edge)}
                dimBadge={activeResizeBadge?.id === comp.component_id ? activeResizeBadge.badge : null}
              />
            ))}
          </div>
        </div>

        {/* Legend / hints */}
        <div className="mt-2 flex items-center gap-4 px-1 flex-wrap">
          <span className="text-[10px] text-slate-400">
            ⠿⠿ <strong>Drag header</strong> to reposition
          </span>
          <span className="text-[10px] text-slate-400">
            ↔ <strong>Right edge</strong> → resize width
          </span>
          <span className="text-[10px] text-slate-400">
            ↕ <strong>Bottom edge</strong> → resize height
          </span>
          <span className="text-[10px] text-slate-400">
            ↘ <strong>Corner</strong> → resize both
          </span>
          <span className="ml-auto text-[10px] text-slate-400 font-mono">
            {canvasWidth > 0 ? `canvas: ${canvasWidth}px · col ≈ ${Math.round((canvasWidth - gap * (columns - 1)) / columns)}px` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
