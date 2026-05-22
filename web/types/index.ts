import type { TemplateConfigForPage } from './template';

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
  template_config?: TemplateConfigForPage | null;
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

// ── Webstore ─────────────────────────────────────────────────────────────────

export interface WebstoreFeature {
  label: string;
  value: string;
}

export interface OrderRowSummary {
  part_no: string;
  kit_contents: string[];
  price: string;
  nop_product_id: string;
  cart_url: string;
}

export interface WebstoreProductItem {
  slug: string;
  title: string;
  product_name: string;
  hero_title: string;
  sku_badge: string;
  webstore_title: string;
  webstore_category: string;
  webstore_priority: number;
  webstore_features: WebstoreFeature[];
  webstore_image_url: string;
  variant_options: string[];
  highlights: string[];
  sample_price: string;
  sample_currency: string;
  volume_price: string;
  order_rows: OrderRowSummary[];
  meta_description: string;
  og_image_url: string | null;
  url_path: string;
}

export interface WebstoreDistributor {
  name: string;
  email: string;
  phone: string;
  website: string;
  message: string;
}

export interface WebstoreCountryConfigResponse {
  country: string;
  purchase_mode: 'buy' | 'contact';
  cart_url: string | null;
  distributor: WebstoreDistributor | null;
  message: string;
}
