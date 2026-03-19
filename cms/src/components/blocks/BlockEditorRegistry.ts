import type { ComponentType } from 'react';

import type { BlockEnvelope, BlockType } from '../../types';
import { HeroBlockEditor } from './HeroBlockEditor';
import { RichTextBlockEditor } from './RichTextBlockEditor';

export interface BlockEditorProps {
  block: BlockEnvelope;
  onChange: (updatedData: Record<string, unknown>) => void;
}

const registry: Partial<Record<BlockType, ComponentType<BlockEditorProps>>> = {
  Hero: HeroBlockEditor,
  RichText: RichTextBlockEditor,
};

export function getBlockEditor(type: BlockType): ComponentType<BlockEditorProps> | null {
  return registry[type] ?? null;
}
