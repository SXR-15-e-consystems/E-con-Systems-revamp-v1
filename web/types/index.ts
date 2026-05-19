export type BlockType =
  | 'Hero'
  | 'RichText'
  | 'ProductGrid'
  | 'ImageBanner'
  | 'VideoEmbed'
  | 'FAQ'
  | 'CTAStrip'
  | 'Testimonials'
  | 'Banner'
  | 'RelatedContent'
  | 'Timer'
  | 'Form'
  | 'CTAButton'
  | 'ProductTabs'
  | 'ProductImageSlider'
  | 'Tag'
  | 'Headline'
  | 'ProductDescription'
  | 'SamplePrice'
  | 'ImageOnly'
  | 'ActionButton'
  | 'EvaluationSection'
  | 'HubHero'
  | 'CategoryFilter'
  | 'VariantsTable'
  | 'VideoGallery'
  | 'FAQAccordion'
  | 'RelatedBlogsGrid'
  | 'TargetApplications'
  | 'Spotlights'
  | 'DocumentDownload'
  | 'ProductHero'
  | 'ProductTabsV2'
  | 'ProductHeroNew'
  | 'NewsletterSubscribe'
  | 'TargetedApplications'
  | 'ResourceTab'
  | 'FAQNew';

export interface BlockEnvelope {
  block_id: string;
  type: BlockType;
  order: number;
  visible: boolean;
  data: Record<string, unknown>;
  component_id?: string;
  /** Per-block locale overrides. Keys are locale codes (jp/ko/de); values mirror subset of data fields. */
  locales?: Record<string, Record<string, unknown>>;
}

export interface HeroData {
  title: string;
  subtitle?: string;
  image_url: string;
  cta_text?: string;
  cta_link?: string;
}

export interface RichTextData {
  html: string;
}

export type PageStatus = 'draft' | 'published' | 'archived';

export interface LocaleVariant {
  title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
}

export interface PageResponse {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  og_image_url: string | null;
  product_name?: string;
  status: PageStatus;
  template_id?: string | null;
  template_config?: { grid: Record<string, any>; components: Record<string, any>[] } | null;
  blocks: BlockEnvelope[];
  // SEO / Open Graph
  og_title?: string;
  og_description?: string;
  og_type?: string;
  twitter_card?: string;
  twitter_site?: string;
  schema_json?: string;
  canonical_url?: string | null;
  // Custom JS injection
  custom_js_head?: string;
  custom_js_body?: string;
  // Locale variants
  locales?: Record<string, LocaleVariant>;
  created_by: string;
  created_at: string;
  updated_at: string;
}
