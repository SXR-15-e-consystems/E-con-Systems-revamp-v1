import type { ComponentType } from 'react';

import type { BlockType } from '@/types';
import { BannerBlock } from '@/components/TemplatesComps/Banner/BannerBlock';
import { CTAButtonBlock } from '@/components/TemplatesComps/CTAButton/CTAButtonBlock';
import { FormBlock } from '@/components/TemplatesComps/Form/FormBlock';
import { RelatedContentBlock } from '@/components/TemplatesComps/RelatedContent/RelatedContentBlock';
import { TimerBlock } from '@/components/TemplatesComps/Timer/TimerBlock';
import { HeroBlock } from './HeroBlock';
import { RichTextBlock } from './RichTextBlock';

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
};

export function getBlockComponent(type: string): ComponentType<BlockProps> | null {
  return registry[type as BlockType] ?? null;
}
