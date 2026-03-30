import type { ComponentType } from 'react';

import type { BlockType } from '@/types';
import { BannerBlock } from '@/components/TemplatesComps/Banner/BannerBlock';
import { CTAButtonBlock } from '@/components/TemplatesComps/CTAButton/CTAButtonBlock';
import { FormBlock } from '@/components/TemplatesComps/Form/FormBlock';
import { RelatedContentBlock } from '@/components/TemplatesComps/RelatedContent/RelatedContentBlock';
import { TimerBlock } from '@/components/TemplatesComps/Timer/TimerBlock';
import { HeroBlock } from './HeroBlock';
import { ProductTabsBlock } from './ProductTabs/ProductTabsBlock';
import { RichTextBlock } from './RichTextBlock';
import { ProductImageSliderBlock } from '@/components/TemplatesComps/ProductImageSlider/ProductImageSliderBlock';
import { TagBlock } from '@/components/TemplatesComps/Tag/TagBlock';
import { HeadlineBlock } from '@/components/TemplatesComps/Headline/HeadlineBlock';
import { ProductDescriptionBlock } from '@/components/TemplatesComps/ProductDescription/ProductDescriptionBlock';
import { SamplePriceBlock } from '@/components/TemplatesComps/SamplePrice/SamplePriceBlock';
import { ImageOnlyBlock } from '@/components/TemplatesComps/ImageOnly/ImageOnlyBlock';
import { ActionButtonBlock } from '@/components/TemplatesComps/ActionButton/ActionButtonBlock';

export interface BlockProps {
  data: Record<string, unknown>;
}

const registry: Partial<Record<BlockType, ComponentType<BlockProps>>> = {
  Hero: HeroBlock,
  RichText: RichTextBlock,
  Banner: BannerBlock,
  RelatedContent: RelatedContentBlock,
  Timer: TimerBlock,
  Form: FormBlock,
  CTAButton: CTAButtonBlock,
  ProductTabs: ProductTabsBlock,
  ProductImageSlider: ProductImageSliderBlock,
  Tag: TagBlock,
  Headline: HeadlineBlock,
  ProductDescription: ProductDescriptionBlock,
  SamplePrice: SamplePriceBlock,
  ImageOnly: ImageOnlyBlock,
  ActionButton: ActionButtonBlock,
};

export function getBlockComponent(type: string): ComponentType<BlockProps> | null {
  return registry[type as BlockType] ?? null;
}
