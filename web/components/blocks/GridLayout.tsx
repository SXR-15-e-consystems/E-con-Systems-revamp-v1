import React from 'react';
import type { BlockEnvelope, PageResponse } from '@/types';
import type { TemplateComponent, TemplateConfigForPage } from '@/types/template';
import type { UiStrings } from '@/lib/ui-strings';
import { getBlockComponent } from './BlockRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// Spacing / Border types (mirrors CMS meta stored under __ prefix keys)
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

function readSpacing(meta: Record<string, unknown>, key: string): BoxSides {
  const val = meta[key];
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const v = val as Record<string, unknown>;
    return {
      top: typeof v.top === 'number' ? v.top : 0,
      right: typeof v.right === 'number' ? v.right : 0,
      bottom: typeof v.bottom === 'number' ? v.bottom : 0,
      left: typeof v.left === 'number' ? v.left : 0,
    };
  }
  return { ...ZERO_SIDES };
}

function readBorder(meta: Record<string, unknown>): BoxBorder | null {
  const val = meta.__border;
  if (!val || typeof val !== 'object' || Array.isArray(val)) return null;
  const b = val as Record<string, unknown>;
  const sides: (keyof BoxBorder)[] = ['top', 'right', 'bottom', 'left'];
  const result: Record<string, BorderSide> = {};
  let hasAny = false;
  for (const side of sides) {
    const s = b[side];
    if (s && typeof s === 'object' && !Array.isArray(s)) {
      const sv = s as Record<string, unknown>;
      const w = typeof sv.width === 'number' ? sv.width : 0;
      if (w > 0) hasAny = true;
      result[side] = {
        width: w,
        style: (typeof sv.style === 'string' ? sv.style : 'none') as BorderSide['style'],
        color: typeof sv.color === 'string' ? sv.color : '#e5e7eb',
      };
    } else {
      result[side] = { width: 0, style: 'none', color: '#e5e7eb' };
    }
  }
  return hasAny ? (result as unknown as BoxBorder) : null;
}

function buildBorderCSS(side: BorderSide): string | undefined {
  if (side.width <= 0 || side.style === 'none') return undefined;
  return `${side.width}px ${side.style} ${side.color}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS Grid layout engine
//
// Uses CSS Grid (matching the CMS canvas) instead of flex-based bands.
// Each component is placed at its exact grid-column / grid-row position.
// Row numbers are normalized to eliminate empty-row gaps.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collapse template row boundaries into consecutive integers so that
 * empty rows between components don't produce unnecessary gap spacing.
 */
function normalizeRows(components: TemplateComponent[]): Map<number, number> {
  const boundaries = new Set<number>();
  for (const c of components) {
    boundaries.add(c.grid_placement.row_start);
    boundaries.add(c.grid_placement.row_end);
  }
  const sorted = Array.from(boundaries).sort((a, b) => a - b);
  const map = new Map<number, number>();
  sorted.forEach((val, idx) => map.set(val, idx + 1));
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Render a single grid item (component wrapper with spacing/border/sizing)
// ─────────────────────────────────────────────────────────────────────────────

function renderGridItem(
  block: BlockEnvelope,
  compDef: TemplateComponent,
  rowMap: Map<number, number>,
  pageProductName: string,
  pageTitleFallback: string,
  uiStrings?: UiStrings,
): React.ReactNode {
  const Component = getBlockComponent(block.type);
  if (!Component) return null;

  const meta = (compDef.meta || {}) as Record<string, unknown>;
  const { col_start, col_end, row_start, row_end } = compDef.grid_placement;

  // Map original row numbers to normalized (gap-free) row numbers
  const rs = rowMap.get(row_start) ?? row_start;
  const re = rowMap.get(row_end) ?? row_end;

  // Height override from meta
  const heightVal =
    typeof meta.__height === 'string' && meta.__height && meta.__height !== 'auto'
      ? meta.__height
      : undefined;

  // Spacing / Border
  const margin = readSpacing(meta, '__margin');
  const padding = readSpacing(meta, '__padding');
  const border = readBorder(meta);
  const maxWidth =
    typeof meta.__maxWidth === 'string' && meta.__maxWidth ? meta.__maxWidth : undefined;
  const minHeight =
    typeof meta.__minHeight === 'string' && meta.__minHeight ? meta.__minHeight : undefined;

  const marginOverride =
    typeof meta.__marginOverride === 'string' && meta.__marginOverride.trim()
      ? meta.__marginOverride.trim()
      : undefined;
  const paddingOverride =
    typeof meta.__paddingOverride === 'string' && meta.__paddingOverride.trim()
      ? meta.__paddingOverride.trim()
      : undefined;

  const wrapperStyle: React.CSSProperties = {
    gridColumn: `${col_start} / ${col_end}`,
    gridRow: `${rs} / ${re}`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    minWidth: 0,
    ...(heightVal ? { height: heightVal } : {}),
    // Margin — CSS override takes priority
    ...(marginOverride
      ? { margin: marginOverride }
      : margin.top || margin.right || margin.bottom || margin.left
        ? { margin: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px` }
        : {}),
    // Padding — CSS override takes priority
    ...(paddingOverride
      ? { padding: paddingOverride }
      : padding.top || padding.right || padding.bottom || padding.left
        ? { padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` }
        : {}),
    // Border
    ...(border
      ? {
          borderTop: buildBorderCSS(border.top),
          borderRight: buildBorderCSS(border.right),
          borderBottom: buildBorderCSS(border.bottom),
          borderLeft: buildBorderCSS(border.left),
        }
      : {}),
    ...(maxWidth ? { maxWidth } : {}),
    ...(minHeight ? { minHeight } : {}),
  };

  // Merge template meta into block data
  const blockData = (block.data || {}) as Record<string, unknown>;
  const templateMeta = compDef.meta || {};
  const hasNestedMeta =
    blockData.meta && typeof blockData.meta === 'object' && !Array.isArray(blockData.meta);

  const mergedData = hasNestedMeta
    ? {
        ...blockData,
        __page_product_name: pageProductName,
        __page_title: pageTitleFallback,
        __ui: uiStrings,
        meta: { ...templateMeta, ...(blockData.meta as Record<string, unknown>) },
      }
    : { ...templateMeta, ...blockData, __page_product_name: pageProductName, __page_title: pageTitleFallback, __ui: uiStrings };

  const safeComponentId = String(block.component_id).replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <div
      key={block.block_id}
      style={wrapperStyle}
      className={`component-wrapper template-block-${safeComponentId}`}
    >
      <Component data={mergedData as Record<string, unknown>} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  page: PageResponse;
  templateConfig: TemplateConfigForPage;
  uiStrings?: UiStrings;
}

export function GridLayout({ page, templateConfig, uiStrings }: Props) {
  const visibleBlocks = page.blocks.filter((b) => b.visible);
  const { columns, gap } = templateConfig.grid;

  // Build component lookup map
  const compMap = new Map<string, TemplateComponent>();
  for (const c of templateConfig.components) {
    compMap.set(c.component_id, c);
  }

  // Pair blocks with their template component definitions
  const paired: Array<{ block: BlockEnvelope; compDef: TemplateComponent }> = [];
  for (const block of visibleBlocks) {
    const compDef = block.component_id ? compMap.get(block.component_id) : undefined;
    if (!compDef) continue;
    if (!getBlockComponent(block.type)) continue;
    paired.push({ block, compDef });
  }

  // Sort by row then column for correct DOM order (matters for mobile stacking)
  paired.sort((a, b) => {
    const dr = a.compDef.grid_placement.row_start - b.compDef.grid_placement.row_start;
    if (dr !== 0) return dr;
    return a.compDef.grid_placement.col_start - b.compDef.grid_placement.col_start;
  });

  // Normalize row numbers to eliminate empty-row gaps
  const rowMap = normalizeRows(templateConfig.components);

  // ── Content-max-width constraint ────────────────────────────────────────
  // When the template sets content_max_width (e.g. "1280px"), the whole grid
  // is wrapped in a centered max-width container so that side-by-side columns
  // don't stretch to fill ultra-wide viewports (4K / 2560+px).
  // Row background sentinels that need to bleed edge-to-edge break out of
  // the constrained container using `width:100vw; marginLeft:calc(50%-50vw)`.
  const contentMaxWidth = (templateConfig.grid.content_max_width ?? '').trim();
  const isConstrained = contentMaxWidth !== '';

  // ── Row background sentinels ─────────────────────────────────────────────
  // Render a full-width div (grid-column: 1/-1) behind each row that has a
  // configured row_backgrounds color. The div stretches to the full height of
  // its grid tracks via the default align-self:stretch, covering the
  // component's background flush to the viewport edges (after layout wrapper
  // was removed from layout.tsx). Content blocks are placed after sentinels in
  // DOM order and therefore paint on top without needing explicit z-index.
  const rowBgs = templateConfig.grid.row_backgrounds ?? {};
  const rowBgSentinels: Array<{ key: string; rs: number; re: number; bgColor: string }> = [];
  for (const [origRowStr, bgColor] of Object.entries(rowBgs)) {
    if (!bgColor) continue;
    const origRowStart = parseInt(origRowStr, 10);
    if (isNaN(origRowStart)) continue;
    // Find the maximum row_end among all components sharing this row_start
    const rowComps = templateConfig.components.filter(
      (c) => c.grid_placement.row_start === origRowStart,
    );
    if (rowComps.length === 0) continue;
    const maxOrigRowEnd = Math.max(...rowComps.map((c) => c.grid_placement.row_end));
    const rs = rowMap.get(origRowStart) ?? origRowStart;
    const re = rowMap.get(maxOrigRowEnd) ?? maxOrigRowEnd;
    rowBgSentinels.push({ key: origRowStr, rs, re, bgColor });
  }

  const gridEl = (
    <div
      className="grid-layout w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: 'auto',
        gap: `${gap}px`,
      }}
    >
      {/* Full-bleed row background sentinels — rendered before content so they paint behind */}
      {rowBgSentinels.map(({ key, rs, re, bgColor }) => (
        <div
          key={`row-bg-${key}`}
          aria-hidden="true"
          style={{
            gridColumn: '1 / -1',
            gridRow: `${rs} / ${re}`,
            backgroundColor: bgColor,
            pointerEvents: 'none',
            // When the grid is inside a constrained max-width wrapper, break out to
            // fill the full viewport so backgrounds still bleed edge-to-edge.
            // width:100vw + marginLeft:calc(50%-50vw) centres a 100vw-wide element
            // on the viewport regardless of the parent container's width.
            ...(isConstrained
              ? { width: '100vw', marginLeft: 'calc(50% - 50vw)' }
              : {}),
          }}
        />
      ))}

      {paired.map(({ block, compDef }) => renderGridItem(block, compDef, rowMap, page.product_name ?? '', page.title ?? '', uiStrings))}

      {/* Responsive overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: [
            // Per-component tablet overrides
            ...templateConfig.components
              .filter((comp) => comp.responsive_overrides?.tablet)
              .map((comp) => {
                const safeId = String(comp.component_id).replace(/[^a-zA-Z0-9_-]/g, '');
                const tb = comp.responsive_overrides!.tablet!;
                return `
                  @media (max-width: 1023px) {
                    .template-block-${safeId} {
                      grid-column: ${tb.col_start} / ${tb.col_end} !important;
                    }
                  }
                `;
              }),
            // Mobile: collapse to single column, natural stacking order
            `
              @media (max-width: 640px) {
                .grid-layout {
                  grid-template-columns: 1fr !important;
                }
                .grid-layout > .component-wrapper {
                  grid-column: 1 / -1 !important;
                  grid-row: auto !important;
                }
              }
            `,
          ].join('\n'),
        }}
      />
    </div>
  );

  // When content_max_width is set, wrap grid in a centred max-width container.
  // Row bg sentinels still bleed via the break-out technique above.
  if (isConstrained) {
    return (
      <div
        className="grid-layout-outer mx-auto w-full"
        style={{ maxWidth: contentMaxWidth }}
      >
        {gridEl}
      </div>
    );
  }

  return gridEl;
}
