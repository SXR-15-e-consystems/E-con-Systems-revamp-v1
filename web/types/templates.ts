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
