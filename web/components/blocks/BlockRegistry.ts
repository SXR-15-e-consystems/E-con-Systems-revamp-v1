import type { ComponentType } from 'react';

import type { BlockType } from '@/types';
import { HeroBlock } from './HeroBlock';
import { RichTextBlock } from './RichTextBlock';

export interface BlockProps {
  data: Record<string, unknown>;
}

const registry: Partial<Record<BlockType, ComponentType<BlockProps>>> = {
  Hero: HeroBlock,
  RichText: RichTextBlock,
};

export function getBlockComponent(type: string): ComponentType<BlockProps> | null {
  return registry[type as BlockType] ?? null;
}
