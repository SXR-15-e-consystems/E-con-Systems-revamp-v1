import type { BlockEnvelope } from '@/types';

import { getBlockComponent } from './BlockRegistry';

interface Props {
  blocks: BlockEnvelope[];
}

export function BlockRenderer({ blocks }: Props) {
  const visibleBlocks = blocks
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
