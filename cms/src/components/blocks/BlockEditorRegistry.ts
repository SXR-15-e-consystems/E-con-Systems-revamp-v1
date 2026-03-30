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
import { ProductImageSliderBlockEditor } from '../TemplatesComps/ProductImageSlider/ProductImageSliderBlockEditor';
import { ProductImageSliderTemplateConfig } from '../TemplatesComps/ProductImageSlider/ProductImageSliderTemplateConfig';
import { TagBlockEditor } from '../TemplatesComps/Tag/TagBlockEditor';
import { TagTemplateConfig } from '../TemplatesComps/Tag/TagTemplateConfig';
import { HeadlineBlockEditor } from '../TemplatesComps/Headline/HeadlineBlockEditor';
import { HeadlineTemplateConfig } from '../TemplatesComps/Headline/HeadlineTemplateConfig';
import { ProductDescriptionBlockEditor } from '../TemplatesComps/ProductDescription/ProductDescriptionBlockEditor';
import { ProductDescriptionTemplateConfig } from '../TemplatesComps/ProductDescription/ProductDescriptionTemplateConfig';
import { SamplePriceBlockEditor } from '../TemplatesComps/SamplePrice/SamplePriceBlockEditor';
import { SamplePriceTemplateConfig } from '../TemplatesComps/SamplePrice/SamplePriceTemplateConfig';
import { ImageOnlyBlockEditor } from '../TemplatesComps/ImageOnly/ImageOnlyBlockEditor';
import { ImageOnlyTemplateConfig } from '../TemplatesComps/ImageOnly/ImageOnlyTemplateConfig';
import { ActionButtonBlockEditor } from '../TemplatesComps/ActionButton/ActionButtonBlockEditor';
import { ActionButtonTemplateConfig } from '../TemplatesComps/ActionButton/ActionButtonTemplateConfig';

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
  ProductImageSlider: ProductImageSliderTemplateConfig,
  Tag: TagTemplateConfig,
  Headline: HeadlineTemplateConfig,
  ProductDescription: ProductDescriptionTemplateConfig,
  SamplePrice: SamplePriceTemplateConfig,
  ImageOnly: ImageOnlyTemplateConfig,
  ActionButton: ActionButtonTemplateConfig,
};

const blockEditorRegistry: Partial<Record<BlockType, ComponentType<BlockEditorProps>>> = {
  Hero: HeroBlockEditor,
  RichText: RichTextBlockEditor,
  Banner: BannerBlockEditor,
  RelatedContent: RelatedContentBlockEditor,
  Timer: TimerBlockEditor,
  Form: FormBlockEditor,
  CTAButton: CTAButtonBlockEditor,
  ProductImageSlider: ProductImageSliderBlockEditor,
  Tag: TagBlockEditor,
  Headline: HeadlineBlockEditor,
  ProductDescription: ProductDescriptionBlockEditor,
  SamplePrice: SamplePriceBlockEditor,
  ImageOnly: ImageOnlyBlockEditor,
  ActionButton: ActionButtonBlockEditor,
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
