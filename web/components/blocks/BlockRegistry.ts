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
import { EvaluationSectionBlock } from '@/components/TemplatesComps/EvaluationSection/EvaluationSectionBlock';
import { HubHeroBlock } from '@/components/TemplatesComps/HubHero/HubHeroBlock';
import { CategoryFilterBlock } from '@/components/TemplatesComps/CategoryFilter/CategoryFilterBlock';
import { VariantsTableBlock } from '@/components/TemplatesComps/VariantsTable/VariantsTableBlock';
import { VideoGalleryBlock } from '@/components/TemplatesComps/VideoGallery/VideoGalleryBlock';
import { FAQAccordionBlock } from '@/components/TemplatesComps/FAQAccordion/FAQAccordionBlock';
import { RelatedBlogsGridBlock } from '@/components/TemplatesComps/RelatedBlogsGrid/RelatedBlogsGridBlock';
import { TargetApplicationsBlock } from '@/components/TemplatesComps/TargetApplications/TargetApplicationsBlock';
import { SpotlightsBlock } from '@/components/TemplatesComps/Spotlights/SpotlightsBlock';
import { DocumentDownloadBlock } from '@/components/TemplatesComps/DocumentDownload/DocumentDownloadBlock';
import { ProductHeroBlock } from '@/components/TemplatesComps/ProductHero/ProductHeroBlock';
import { ProductTabsV2Block } from '@/components/TemplatesComps/ProductTabsV2/ProductTabsV2Block';
import { ProductHeroNewBlock } from '@/components/TemplatesComps/ProductHeroNew/ProductHeroNewBlock';
import { NewsletterSubscribeBlock } from '@/components/TemplatesComps/NewsletterSubscribe/NewsletterSubscribeBlock';
import { TargetedApplicationsBlock } from '@/components/TemplatesComps/TargetedApplications/TargetedApplicationsBlock';
import { ResourceTabBlock } from '@/components/TemplatesComps/ResourceTab/ResourceTabBlock';
import { FAQNewBlock } from '@/components/TemplatesComps/FAQNew/FAQNewBlock';

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
  EvaluationSection: EvaluationSectionBlock,
  HubHero: HubHeroBlock,
  CategoryFilter: CategoryFilterBlock,
  VariantsTable: VariantsTableBlock,
  VideoGallery: VideoGalleryBlock,
  FAQAccordion: FAQAccordionBlock,
  RelatedBlogsGrid: RelatedBlogsGridBlock,
  TargetApplications: TargetApplicationsBlock,
  Spotlights: SpotlightsBlock,
  DocumentDownload: DocumentDownloadBlock,
  ProductHero: ProductHeroBlock,
  ProductTabsV2: ProductTabsV2Block,
  ProductHeroNew: ProductHeroNewBlock,
  NewsletterSubscribe: NewsletterSubscribeBlock,
  TargetedApplications: TargetedApplicationsBlock,
  ResourceTab: ResourceTabBlock,
  FAQNew: FAQNewBlock,
};

export function getBlockComponent(type: string): ComponentType<BlockProps> | null {
  return registry[type as BlockType] ?? null;
}
