import React from 'react';
import type { BlockEnvelope, PageResponse } from '@/types';
import type { TemplateComponent, TemplateConfigForPage } from '@/types/template';
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
// Band grouping algorithm
//
// Two components belong to the same horizontal band if their row ranges
// overlap with *any* member of the band. Inside each band we further group
// into "column lanes" — items whose column ranges overlap go into the same
// lane and stack vertically. Lanes sit side-by-side via flexbox.
// ─────────────────────────────────────────────────────────────────────────────

interface BandItem {
  block: BlockEnvelope;
  compDef: TemplateComponent;
}

interface Band {
  minRow: number;
  items: BandItem[];
}

/** A column lane: items that share overlapping column ranges within a band */
interface ColLane {
  colStart: number;
  colEnd: number;
  items: BandItem[];
}

function buildBands(
  blocks: BlockEnvelope[],
  components: TemplateComponent[],
): Band[] {
  const compMap = new Map<string, TemplateComponent>();
  for (const c of components) {
    compMap.set(c.component_id, c);
  }

  const paired: BandItem[] = [];
  for (const block of blocks) {
    const compDef = compMap.get(block.component_id);
    if (!compDef) continue;
    if (!getBlockComponent(block.type)) continue;
    paired.push({ block, compDef });
  }

  // Sort by row_start then col_start
  paired.sort((a, b) => {
    const dr = a.compDef.grid_placement.row_start - b.compDef.grid_placement.row_start;
    if (dr !== 0) return dr;
    return a.compDef.grid_placement.col_start - b.compDef.grid_placement.col_start;
  });

  // Sweep → merge overlapping row ranges into bands
  const bands: Band[] = [];
  for (const item of paired) {
    const rs = item.compDef.grid_placement.row_start;

    if (bands.length === 0) {
      bands.push({ minRow: rs, items: [item] });
      continue;
    }

    const last = bands[bands.length - 1];
    const bandEnd = Math.max(
      ...last.items.map((i) => i.compDef.grid_placement.row_end),
    );

    if (rs <= bandEnd) {
      last.items.push(item);
    } else {
      bands.push({ minRow: rs, items: [item] });
    }
  }

  return bands;
}

/** Detect whether two column ranges overlap */
function colsOverlap(
  aStart: number, aEnd: number,
  bStart: number, bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Partition a band's items into column lanes.
 * Items whose column ranges overlap go into the same lane; within a lane
 * items are sorted by row_start (top → bottom).
 */
function buildColLanes(items: BandItem[]): ColLane[] {
  const lanes: ColLane[] = [];

  for (const item of items) {
    const cs = item.compDef.grid_placement.col_start;
    const ce = item.compDef.grid_placement.col_end;

    // Try to find an existing lane whose column range overlaps
    let merged = false;
    for (const lane of lanes) {
      if (colsOverlap(lane.colStart, lane.colEnd, cs, ce)) {
        lane.items.push(item);
        // Widen the lane to encompass this item
        lane.colStart = Math.min(lane.colStart, cs);
        lane.colEnd = Math.max(lane.colEnd, ce);
        merged = true;
        break;
      }
    }

    if (!merged) {
      lanes.push({ colStart: cs, colEnd: ce, items: [item] });
    }
  }

  // Sort lanes left → right
  lanes.sort((a, b) => a.colStart - b.colStart);

  // Sort items within each lane by row_start (top → bottom)
  for (const lane of lanes) {
    lane.items.sort(
      (a, b) => a.compDef.grid_placement.row_start - b.compDef.grid_placement.row_start,
    );
  }

  return lanes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Render a single band item (component wrapper with spacing/border/sizing)
// ─────────────────────────────────────────────────────────────────────────────

function renderBandItem(
  item: BandItem,
  columns: number,
  gap: number,
  widthPctOverride?: number,
): React.ReactNode {
  const { block, compDef } = item;
  const Component = getBlockComponent(block.type);
  if (!Component) return null;

  const meta = (compDef.meta || {}) as Record<string, unknown>;
  const { col_start, col_end } = compDef.grid_placement;
  const colSpan = col_end - col_start;

  // Width: use override if provided (for lane-managed items), else percentage of total columns
  const widthPct = widthPctOverride ?? (colSpan / columns) * 100;

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

  const hasMargin = marginOverride || margin.top || margin.right || margin.bottom || margin.left;

  const wrapperStyle: React.CSSProperties = {
    flexBasis: `${widthPct}%`,
    flexShrink: hasMargin ? 1 : 0,
    flexGrow: 0,
    minWidth: 0,
    maxWidth: `${widthPct}%`,
    boxSizing: 'border-box',
    overflow: 'hidden',
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
        meta: { ...templateMeta, ...(blockData.meta as Record<string, unknown>) },
      }
    : { ...templateMeta, ...blockData };

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
}

export function GridLayout({ page, templateConfig }: Props) {
  const visibleBlocks = page.blocks
    .filter((b) => b.visible)
    .sort((a, b) => a.order - b.order);

  const { columns, gap } = templateConfig.grid;

  // Group blocks into horizontal bands
  const bands = buildBands(visibleBlocks, templateConfig.components);

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      {bands.map((band, bandIdx) => {
        const lanes = buildColLanes(band.items);

        // Single lane covering full width — render directly
        if (lanes.length === 1 && lanes[0].colEnd - lanes[0].colStart >= columns) {
          return (
            <div key={`band-${bandIdx}`} style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
              {lanes[0].items.length === 1 ? (
                renderBandItem(lanes[0].items[0], columns, gap)
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
                  {lanes[0].items.map((item) => (
                    <React.Fragment key={item.block.block_id}>
                      {renderBandItem(item, columns, gap)}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          );
        }

        // Multiple lanes: flex row with spacers for column gaps
        return (
          <div
            key={`band-${bandIdx}`}
            className="band-row"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            {(() => {
              const elements: React.ReactNode[] = [];
              let cursor = 1;

              for (const lane of lanes) {
                // Spacer for column gap before this lane
                if (lane.colStart > cursor) {
                  const gapCols = lane.colStart - cursor;
                  const spacerPct = (gapCols / columns) * 100;
                  elements.push(
                    <div
                      key={`spacer-${bandIdx}-${lane.colStart}`}
                      style={{
                        flexBasis: `${spacerPct}%`,
                        flexShrink: 0,
                        flexGrow: 0,
                      }}
                      aria-hidden="true"
                    />,
                  );
                }

                const laneWidthPct = ((lane.colEnd - lane.colStart) / columns) * 100;

                if (lane.items.length === 1) {
                  // Single item in lane — render with lane width
                  elements.push(
                    <React.Fragment key={lane.items[0].block.block_id}>
                      {renderBandItem(lane.items[0], columns, gap, laneWidthPct)}
                    </React.Fragment>,
                  );
                } else {
                  // Multiple items in lane — group items that share the same
                  // row_start into sub-rows (flex-row within the lane column)
                  const subRows: BandItem[][] = [];
                  for (const item of lane.items) {
                    const rs = item.compDef.grid_placement.row_start;
                    if (subRows.length > 0) {
                      const lastSubRow = subRows[subRows.length - 1];
                      const lastRs = lastSubRow[0].compDef.grid_placement.row_start;
                      const lastRe = Math.max(
                        ...lastSubRow.map((i) => i.compDef.grid_placement.row_end),
                      );
                      // Same row_start or overlapping row range → same sub-row
                      if (rs === lastRs || rs < lastRe) {
                        lastSubRow.push(item);
                        continue;
                      }
                    }
                    subRows.push([item]);
                  }

                  elements.push(
                    <div
                      key={`lane-${bandIdx}-${lane.colStart}`}
                      style={{
                        flexBasis: `${laneWidthPct}%`,
                        flexShrink: 0,
                        flexGrow: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: `${gap}px`,
                        minWidth: 0,
                      }}
                    >
                      {subRows.map((subRow, srIdx) => {
                        if (subRow.length === 1) {
                          // Single item sub-row → full lane width
                          return (
                            <React.Fragment key={subRow[0].block.block_id}>
                              {renderBandItem(subRow[0], columns, gap, 100)}
                            </React.Fragment>
                          );
                        }
                        // Multiple items share this sub-row → flex-row inside the lane
                        const laneCols = lane.colEnd - lane.colStart;
                        return (
                          <div
                            key={`subrow-${bandIdx}-${lane.colStart}-${srIdx}`}
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              width: '100%',
                            }}
                          >
                            {subRow
                              .sort(
                                (a, b) =>
                                  a.compDef.grid_placement.col_start -
                                  b.compDef.grid_placement.col_start,
                              )
                              .map((item) => {
                                const itemCols =
                                  item.compDef.grid_placement.col_end -
                                  item.compDef.grid_placement.col_start;
                                const itemPct = (itemCols / laneCols) * 100;
                                return (
                                  <React.Fragment key={item.block.block_id}>
                                    {renderBandItem(item, columns, gap, itemPct)}
                                  </React.Fragment>
                                );
                              })}
                          </div>
                        );
                      })}
                    </div>,
                  );
                }

                cursor = lane.colEnd;
              }

              return elements;
            })()}
          </div>
        );
      })}

      {/* Responsive overrides: mobile stacks full-width */}
      <style
        dangerouslySetInnerHTML={{
          __html: templateConfig.components
            .map((comp) => {
              const safeComponentId = String(comp.component_id).replace(
                /[^a-zA-Z0-9_-]/g,
                '',
              );
              const cssLines: string[] = [];

              // Tablet: keep layout but allow narrower
              if (comp.responsive_overrides?.tablet) {
                const tb = comp.responsive_overrides.tablet;
                const tbSpan = tb.col_end - tb.col_start;
                const tbPct = (tbSpan / templateConfig.grid.columns) * 100;
                cssLines.push(`
                  @media (max-width: 1023px) {
                    .template-block-${safeComponentId} {
                      flex-basis: ${tbPct}% !important;
                    }
                  }
                `);
              }

              // Mobile: full-width stacking
              cssLines.push(`
                @media (max-width: 640px) {
                  .template-block-${safeComponentId} {
                    flex-basis: 100% !important;
                  }
                }
              `);

              return cssLines.join('\n');
            })
            .join('\n')
            // Also add a global rule: band rows wrap on mobile
            + `
              @media (max-width: 640px) {
                .band-row { flex-wrap: wrap !important; }
              }
            `,
        }}
      />
    </div>
  );
}
