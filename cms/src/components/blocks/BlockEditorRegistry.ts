import type { ComponentType } from 'react';

import type { BlockEnvelope, BlockType } from '../../types';
import { BannerBlockEditor } from '../TemplatesComps/Banner/BannerBlockEditor';
import { BannerTemplateConfig } from '../TemplatesComps/Banner/BannerTemplateConfig';
import { CTAButtonBlockEditor } from '../TemplatesComps/CTAButton/CTAButtonBlockEditor';
import { CTAButtonTemplateConfig } from '../TemplatesComps/CTAButton/CTAButtonTemplateConfig';
import { FormBlockEditor } from '../TemplatesComps/Form/FormBlockEditor';
import { FormTemplateConfig } from '../TemplatesComps/Form/FormTemplateConfig';
import { RelatedContentBlockEditor } from '../TemplatesComps/RelatedContent/RelatedContentBlockEditor';
import { RelatedContentTemplateConfig } from '../TemplatesComps/RelatedContent/RelatedContentTemplateConfig';
import { TimerBlockEditor } from '../TemplatesComps/Timer/TimerBlockEditor';
import { TimerTemplateConfig } from '../TemplatesComps/Timer/TimerTemplateConfig';
import { HeroBlockEditor } from './HeroBlockEditor';
import { RichTextBlockEditor } from './RichTextBlockEditor';

export interface BlockEditorProps {
  block: BlockEnvelope;
  onChange: (updatedData: Record<string, unknown>) => void;
}

/**
 * Two registries:
 * - templateConfigRegistry: L1 — metadata/layout editor (no content fields)
 * - blockEditorRegistry:    L2 — content editor (fills actual values)
 *
 * Legacy block types (Hero, RichText, etc.) use only blockEditorRegistry.
 */
const templateConfigRegistry: Partial<Record<BlockType, ComponentType<BlockEditorProps>>> = {
  Banner: BannerTemplateConfig,
  RelatedContent: RelatedContentTemplateConfig,
  Timer: TimerTemplateConfig,
  Form: FormTemplateConfig,
  CTAButton: CTAButtonTemplateConfig,
};

const blockEditorRegistry: Partial<Record<BlockType, ComponentType<BlockEditorProps>>> = {
  Hero: HeroBlockEditor,
  RichText: RichTextBlockEditor,
  Banner: BannerBlockEditor,
  RelatedContent: RelatedContentBlockEditor,
  Timer: TimerBlockEditor,
  Form: FormBlockEditor,
  CTAButton: CTAButtonBlockEditor,
};

/** Returns the L1 template config editor for a block type, or null if not applicable. */
export function getTemplateConfigEditor(
  type: BlockType,
): ComponentType<BlockEditorProps> | null {
  return templateConfigRegistry[type] ?? null;
}

/** Returns the L2 content editor for a block type, or null if unsupported. */
export function getBlockEditor(type: BlockType): ComponentType<BlockEditorProps> | null {
  return blockEditorRegistry[type] ?? null;
}
