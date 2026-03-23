import type { BlockEnvelope, PageResponse } from '@/types';
import type { Template } from '@/types/template';
import { getBlockComponent } from './BlockRegistry';

interface Props {
  page: PageResponse;
  template: Template;
}

export function GridLayout({ page, template }: Props) {
  // Sort blocks by order. We'll only render visible ones.
  const visibleBlocks = page.blocks
    .filter((b) => b.visible)
    .sort((a, b) => a.order - b.order);

  const { columns, gap } = template.grid;

  return (
    <div className="w-full">
      <div
        className="w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: `${template.grid.row_height}px`,
          gap: `${gap}px`,
        }}
      >
        {visibleBlocks.map((block) => {
          const compDef = template.components.find((c: any) => c.component_id === block.component_id);
          const Component = getBlockComponent(block.type);

          if (!Component || !compDef) return null;

          // Native Grid Placement
          const { col_start, col_end, row_start, row_end } = compDef.grid_placement;
          
          const style: React.CSSProperties = {
            gridColumn: `${col_start} / ${col_end}`,
          };
          if (row_start && row_end) {
            style.gridRow = `${row_start} / ${row_end}`;
          }

          // Merge meta (from template) and content (from block) for the component data
          const mergedData = {
             ...(compDef.meta || {}), // Read-only styling/config from template
             ...(block.data || {}),   // The actual content injected by Campaign Manager
          };

          // Sanitize component_id for CSS class to prevent injection
          const safeComponentId = String(block.component_id).replace(/[^a-zA-Z0-9_-]/g, '');

          return (
            <div
              key={block.block_id}
              style={style}
              className={`component-wrapper template-block-${safeComponentId}`}
            >
              <Component data={mergedData as any} />
            </div>
          );
        })}
      </div>

      {/* 
        Injecting Responsive Overrides using a styled-jsx block.
        Only apply explicit overrides when defined in the template.
        On mobile (<640px), stack everything full-width as a sensible fallback.
        Security: component_id is sanitized to prevent CSS injection.
      */}
      <style dangerouslySetInnerHTML={{
        __html: `
          ${template.components.map(comp => {
            // Sanitize component_id to prevent CSS injection
            const safeComponentId = String(comp.component_id).replace(/[^a-zA-Z0-9_-]/g, '');
            if (!safeComponentId || safeComponentId !== comp.component_id) {
              console.warn(`Invalid component_id "${comp.component_id}" sanitized to "${safeComponentId}"`);
            }

            let cssLines = [];

            // Tablet: only apply if explicitly configured in the template
            if (comp.responsive_overrides?.tablet) {
               const tb = comp.responsive_overrides.tablet;
               cssLines.push(`
                  @media (max-width: 1023px) {
                    .template-block-${safeComponentId} {
                       grid-column: ${tb.col_start} / ${tb.col_end} !important;
                       ${tb.row_start && tb.row_end ? `grid-row: ${tb.row_start} / ${tb.row_end} !important;` : ''}
                    }
                  }
               `);
            }
            // No else — keep the designed desktop layout on tablet by default

            // Mobile: apply explicit override, or fall back to full-width stacking
            if (comp.responsive_overrides?.mobile) {
               const mb = comp.responsive_overrides.mobile;
               cssLines.push(`
                  @media (max-width: 640px) {
                    .template-block-${safeComponentId} {
                       grid-column: ${mb.col_start} / ${mb.col_end} !important;
                       ${mb.row_start && mb.row_end ? `grid-row: ${mb.row_start} / ${mb.row_end} !important;` : ''}
                    }
                  }
               `);
            } else {
               cssLines.push(`
                  @media (max-width: 640px) {
                    .template-block-${safeComponentId} {
                       grid-column: 1 / -1 !important;
                       grid-row: auto !important;
                    }
                  }
               `);
            }
            return cssLines.join('\\n');
          }).join('\\n')}
        `
      }} />
    </div>
  );
}
