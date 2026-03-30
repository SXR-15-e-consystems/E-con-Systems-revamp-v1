// ─────────────────────────────────────────────────────────────────────────────
// Template component data interfaces — CMS (M3)
// Used at L1 (template config) and L2 (page content editor).
// The `data` field of every BlockEnvelope for new components conforms to one
// of these interfaces: { meta: <MetaType>, content: <ContentType> }
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// BANNER
// ═══════════════════════════════════════════════════════════════════════════

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
  autoplayInterval: number; // ms — 0 = manual/no autoplay
  ctaPosition: CTAPosition;
  ctaStyle: BannerCTAStyle;
}

export interface BannerSlide {
  image_url: string;
  image_alt: string;
  href?: string; // type1 — wrap entire banner in a link
  title?: string; // type2
  description?: string; // type2
  cta_text?: string; // type2
  cta_link?: string; // type2
}

export interface BannerContent {
  slides: BannerSlide[];
}

export interface BannerData {
  meta: BannerMeta;
  content: BannerContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// RELATED CONTENT
// ═══════════════════════════════════════════════════════════════════════════

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
  image_url?: string; // omit for YouTube — thumbnail auto-derived from link
  image_alt: string;
  title?: string;
  link: string; // YouTube URL for Video type; page URL for others
  cta_text?: string;
}

export interface RelatedContentContent {
  items: RelatedContentItem[];
}

export interface RelatedContentData {
  meta: RelatedContentMeta;
  content: RelatedContentContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMER
// ═══════════════════════════════════════════════════════════════════════════

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
  width: string; // relevant for popup
}

export interface TimerContent {
  image_url?: string;
  title: string;
  description?: string;
  cta_text?: string;
  cta_link?: string;
  expiry_iso: string; // ISO 8601 — authoritative expiry datetime
}

export interface TimerData {
  meta: TimerMeta;
  content: TimerContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// CTA BUTTON
// ═══════════════════════════════════════════════════════════════════════════

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
// PRODUCT IMAGE SLIDER
// ═══════════════════════════════════════════════════════════════════════════

export interface ProductImageSliderMeta {
  width: string;
  height: string;
  bgColor: string;
  thumbnailPosition: 'left' | 'bottom';
  thumbnailSize: number; // px — width/height of each thumbnail
  borderColor: string; // active thumbnail highlight color
}

export interface ProductImageSlide {
  image_url: string;
  image_alt: string;
}

export interface ProductImageSliderContent {
  slides: ProductImageSlide[];
}

export interface ProductImageSliderData {
  meta: ProductImageSliderMeta;
  content: ProductImageSliderContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// TAG BLOCK
// ═══════════════════════════════════════════════════════════════════════════

export type TagLayout = 'grid' | 'list';

export interface TagMeta {
  layout: TagLayout;
  bgColor: string;
  tagBgColor: string;
  tagTextColor: string;
  tagBorderRadius: string;
  showIcon: boolean;
  width: string;
}

export interface TagItem {
  label: string;
}

export interface TagContent {
  title: string;
  tags: TagItem[];
}

export interface TagData {
  meta: TagMeta;
  content: TagContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADLINE BLOCK
// ═══════════════════════════════════════════════════════════════════════════

export type HeadlineAlign = 'left' | 'center' | 'right';
export type HeadlineWeight = '400' | '500' | '600' | '700' | '800' | '900';
export type HeadlineTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';

export interface HeadlineMeta {
  tag: HeadlineTag;
  fontFamily: string;
  fontSize: string;
  fontWeight: HeadlineWeight;
  textColor: string;
  bgColor: string;
  align: HeadlineAlign;
  width: string;
  letterSpacing: string;
  lineHeight: string;
}

export interface HeadlineContent {
  text: string;
}

export interface HeadlineData {
  meta: HeadlineMeta;
  content: HeadlineContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT DESCRIPTION BLOCK
// ═══════════════════════════════════════════════════════════════════════════

export type BulletStyle = 'disc' | 'circle' | 'square' | 'dash' | 'check';

export interface ProductDescriptionMeta {
  bgColor: string;
  titleColor: string;
  titleFontSize: string;
  titleFontWeight: string;
  textColor: string;
  textFontSize: string;
  bulletStyle: BulletStyle;
  bulletColor: string;
  lineSpacing: string;
  width: string;
}

export interface ProductDescriptionBullet {
  text: string;
}

export interface ProductDescriptionContent {
  title: string;
  bullets: ProductDescriptionBullet[];
}

export interface ProductDescriptionData {
  meta: ProductDescriptionMeta;
  content: ProductDescriptionContent;
}

// ─── SamplePrice ─────────────────────────────────────────────
export interface SamplePriceMeta {
  label: string;
  price: string;
  currency: string;
  bgColor: string;
  labelColor: string;
  priceColor: string;
  labelFontSize: string;
  priceFontSize: string;
  borderRadius: string;
  borderColor: string;
  width: string;
}

export interface SamplePriceContent {
  label: string;
  price: string;
  currency: string;
}

export interface SamplePriceData {
  meta: SamplePriceMeta;
  content: SamplePriceContent;
}

// ─── ImageOnly ───────────────────────────────────────────────
export interface ImageOnlyMeta {
  bgColor: string;
  borderRadius: string;
  objectFit: 'cover' | 'contain' | 'fill' | 'none';
  width: string;
  height: string;
}

export interface ImageOnlyContent {
  image_url: string;
  image_alt: string;
}

export interface ImageOnlyData {
  meta: ImageOnlyMeta;
  content: ImageOnlyContent;
}

// ─── ActionButton ───────────────────────────────────────────
export type ActionButtonIcon = 'cart' | 'download' | 'arrow-right' | 'phone' | 'mail' | 'external' | 'none';

export interface ActionButtonMeta {
  bgColor: string;
  textColor: string;
  fontSize: string;
  fontWeight: string;
  subTextColor: string;
  subTextFontSize: string;
  borderRadius: string;
  paddingX: string;
  paddingY: string;
  icon: ActionButtonIcon;
  iconPosition: 'left' | 'right';
  width: string;
  align: 'left' | 'center' | 'right';
}

export interface ActionButtonContent {
  buttonText: string;
  subText: string;
  url: string;
  openInNewTab: boolean;
}

export interface ActionButtonData {
  meta: ActionButtonMeta;
  content: ActionButtonContent;
}
