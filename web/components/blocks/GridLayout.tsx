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
        className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-8"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
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

          return (
            <div
              key={block.block_id}
              style={style}
              className={`component-wrapper template-block-${block.component_id}`}
            >
              <Component data={mergedData as any} />
            </div>
          );
        })}
      </div>

      {/* 
        Injecting Responsive Overrides using a styled-jsx block. 
      */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Auto-Responsive Base Fallbacks for Tablet/Mobile */
          @media (max-width: 1023px) { /* Tablet override loop */ }
          @media (max-width: 767px)  { /* Mobile override loop */ }
          
          ${template.components.map(comp => {
            let cssLines = [];
            if (comp.responsive_overrides?.tablet) {
               const tb = comp.responsive_overrides.tablet;
               cssLines.push(`
                  @media (max-width: 1023px) {
                    .template-block-${comp.component_id} {
                       grid-column: ${tb.col_start} / ${tb.col_end} !important;
                       ${tb.row_start && tb.row_end ? `grid-row: ${tb.row_start} / ${tb.row_end} !important;` : ''}
                    }
                  }
               `);
            } else {
               // Default Tablet Fallback: if not explicitly defined, we stack them 2 per row (6 cols each) or full width
               // For simplicity in Phase 5 POC, we fall back to full width stacking if no override.
               cssLines.push(`
                  @media (max-width: 1023px) {
                    .template-block-${comp.component_id} {
                       grid-column: 1 / -1 !important;
                    }
                  }
               `);
            }

            if (comp.responsive_overrides?.mobile) {
               const mb = comp.responsive_overrides.mobile;
               cssLines.push(`
                  @media (max-width: 767px) {
                    .template-block-${comp.component_id} {
                       grid-column: ${mb.col_start} / ${mb.col_end} !important;
                       ${mb.row_start && mb.row_end ? `grid-row: ${mb.row_start} / ${mb.row_end} !important;` : ''}
                    }
                  }
               `);
            } else {
               cssLines.push(`
                  @media (max-width: 767px) {
                    .template-block-${comp.component_id} {
                       grid-column: 1 / -1 !important;
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
