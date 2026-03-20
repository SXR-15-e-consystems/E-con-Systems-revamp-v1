import type { BlockEnvelope, PageResponse } from '@/types';
import type { Template } from '@/types/template';
import { getBlockComponent } from './BlockRegistry';
import { GridLayout } from './GridLayout';

interface Props {
  page: PageResponse;
  template?: Template;
}

export function BlockRenderer({ page, template }: Props) {
  if (template) {
    return <GridLayout page={page} template={template} />;
  }

  const visibleBlocks = page.blocks
    .filter((block) => block.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {visibleBlocks.map((block) => {
        const Component = getBlockComponent(block.type);
        if (!Component) {
          return null;
        }
        return <Component key={block.block_id} data={block.data} />;
      })}
    </>
  );
}
