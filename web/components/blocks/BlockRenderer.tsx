import type { BlockEnvelope, PageResponse } from '@/types';
import type { TemplateConfigForPage } from '@/types/template';
import { getBlockComponent } from './BlockRegistry';
import { GridLayout } from './GridLayout';

interface Props {
  page: PageResponse;
  template?: TemplateConfigForPage;
}

export function BlockRenderer({ page, template }: Props) {
  if (template) {
    return <GridLayout page={page} templateConfig={template} />;
  }

  if (!page?.blocks) {
    return null;
  }

  const visibleBlocks = page.blocks
    .filter((block) => block.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {visibleBlocks.map((block) => {
        const Component = getBlockComponent(block.type);
        if (!Component) {
          console.warn(`No component registered for block type: ${block.type}`);
          // Optional: render a fallback in development
          if (process.env.NODE_ENV === 'development') {
            return (
              <div key={block.block_id} className="border-2 border-dashed border-red-400 bg-red-50 p-4 m-4 rounded">
                <p className="text-red-700 font-semibold">Missing block component: {block.type}</p>
                <p className="text-sm text-red-600 mt-1">Block ID: {block.block_id}</p>
              </div>
            );
          }
          return null;
        }
        return <Component key={block.block_id} data={block.data} />;
      })}
    </>
  );
}
