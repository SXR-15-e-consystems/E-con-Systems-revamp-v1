// ─────────────────────────────────────────────────────────────────────────────
// Template component data interfaces — web (M4)
// Mirror of cms/src/types/templates.ts — kept separate per module isolation.
// ─────────────────────────────────────────────────────────────────────────────

export type BannerVariant = 'type1' | 'type2';
export type CTAPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

export interface BannerCTAStyle {
  bgColor: string;
  textColor: string;
  borderRadius: string;
  fontSize: string;
}

export interface BannerMeta {
  width: string;
  height: string;
  bgColor: string;
  variant: BannerVariant;
  sliderMode: boolean;
  autoplayInterval: number;
  ctaPosition: CTAPosition;
  ctaStyle: BannerCTAStyle;
}

export interface BannerSlide {
  image_url: string;
  image_alt: string;
  href?: string;
  title?: string;
  description?: string;
  cta_text?: string;
  cta_link?: string;
}

export interface BannerContent {
  slides: BannerSlide[];
}

export interface BannerData {
  meta: BannerMeta;
  content: BannerContent;
}

// ─────────────────────────────────────────────────────────────────────────────

export type RelatedContentType = 'Blog' | 'Video' | 'Product' | 'CaseStudy';

export interface RelatedCardStyle {
  bgColor: string;
  textColor: string;
  borderRadius: string;
}

export interface RelatedContentMeta {
  contentType: RelatedContentType;
  displayCount: 1 | 2 | 3 | 4;
  sliderMode: boolean;
  showTitle: boolean;
  showCTA: boolean;
  ctaLabel: string;
  cardStyle: RelatedCardStyle;
  width: string;
}

export interface RelatedContentItem {
  image_url?: string;
  image_alt: string;
  title?: string;
  link: string;
  cta_text?: string;
}

export interface RelatedContentContent {
  items: RelatedContentItem[];
}

export interface RelatedContentData {
  meta: RelatedContentMeta;
  content: RelatedContentContent;
}

// ─────────────────────────────────────────────────────────────────────────────

export type TimerLayout = 'bar' | 'popup';
export type TimerBarPosition = 'top' | 'bottom';
export type TimerPopupPosition = 'bottom-left' | 'bottom-right';
export type TimerPosition = TimerBarPosition | TimerPopupPosition;

export interface TimerMeta {
  layout: TimerLayout;
  position: TimerPosition;
  visible: boolean;
  bgColor: string;
  textColor: string;
  width: string;
}

export interface TimerContent {
  image_url?: string;
  title: string;
  description?: string;
  cta_text?: string;
  cta_link?: string;
  expiry_iso: string;
}

export interface TimerData {
  meta: TimerMeta;
  content: TimerContent;
}

// ─────────────────────────────────────────────────────────────────────────────

export type FormType = 'registration' | 'contact' | 'get-quote';
export type QuoteQuantity = '<100' | '<500' | '<1000' | '>1000';

export interface FormMeta {
  formType: FormType;
  recaptchaSiteKey: string;
  tcLink: string;
  bgColor: string;
  width: string;
  submitLabel: string;
}

export interface FormContent {
  heading?: string;
  subheading?: string;
  successMessage: string;
  errorMessage: string;
}

export interface FormData {
  meta: FormMeta;
  content: FormContent;
}

// ─────────────────────────────────────────────────────────────────────────────

export type CTAButtonPosition =
  | 'inline'
  | 'fixed-bottom-right'
  | 'fixed-bottom-center';

export interface CTAButtonStyle {
  bgColor: string;
  textColor: string;
  borderRadius: string;
  fontSize: string;
  padding: string;
}

export interface CTAButtonMeta {
  formType: FormType;
  width: string;
  position: CTAButtonPosition;
  style: CTAButtonStyle;
}

export interface CTAButtonContent {
  label: string;
}

export interface CTAButtonData {
  meta: CTAButtonMeta;
  content: CTAButtonContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT TABS
// ═══════════════════════════════════════════════════════════════════════════

export type TabContentType =
  | 'richtext'
  | 'spec_list'
  | 'documents'
  | 'order_table'
  | 'video_grid'
  | 'compliance_table'
  | 'faq';

export type PresetTabKey =
  | 'overview'
  | 'specifications'
  | 'software'
  | 'standards_compliance'
  | 'documents'
  | 'order_samples'
  | 'videos'
  | 'customization'
  | 'faqs';

export interface ProductTab {
  tab_id: string;
  label: string;
  content_type: TabContentType;
  preset_key?: PresetTabKey;
  external_url?: string;
  order: number;
  enabled: boolean;
}

export interface RichTextTabContent {
  html: string;
  links?: { label: string; url: string }[];
}

export interface SpecSection {
  title: string;
  items: { label: string; value: string }[];
}

export interface SpecListTabContent {
  sections: SpecSection[];
}

export interface DocumentGroup {
  title: string;
  items: { name: string; url: string }[];
}

export interface DocumentsTabContent {
  groups: DocumentGroup[];
}

export interface OrderSampleRow {
  part_no: string;
  kit_contents: string[];
  price: string;
  contact_url: string;
}

export interface OrderTableTabContent {
  rows: OrderSampleRow[];
}

export interface VideoItem {
  thumbnail_url: string;
  title: string;
  video_url: string;
}

export interface VideoGridTabContent {
  items: VideoItem[];
}

export interface ComplianceCategory {
  title: string;
  rows: { sno: number; certification: string; test_spec: string }[];
}

export interface ComplianceTableTabContent {
  categories: ComplianceCategory[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQTabContent {
  items: FAQItem[];
}

export type TabContent =
  | RichTextTabContent
  | SpecListTabContent
  | DocumentsTabContent
  | OrderTableTabContent
  | VideoGridTabContent
  | ComplianceTableTabContent
  | FAQTabContent;

export interface ProductTabsMeta {
  sidebar_width: string;
  active_color: string;
  mobile_layout: 'horizontal_scroll' | 'dropdown';
  max_custom_tabs: number;
}

export interface ProductTabsContent {
  tabs: ProductTab[];
  tab_data: Record<string, TabContent>;
}

export interface ProductTabsData {
  meta: ProductTabsMeta;
  content: ProductTabsContent;
}
