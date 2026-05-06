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
  category?: string;
}

export interface RelatedContentContent {
  heading?: string;
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
  html?: string;
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

export interface DatasheetCTA {
  enabled: boolean;
  label: string;
}

export interface ProductTabsMeta {
  sidebar_width: string;
  active_color: string;
  mobile_layout: 'horizontal_scroll' | 'dropdown';
  max_custom_tabs: number;
  recaptchaSiteKey: string;
  datasheet_cta?: DatasheetCTA;
}

export interface ProductTabsContent {
  tabs: ProductTab[];
  tab_data: Record<string, TabContent>;
}

export interface ProductTabsData {
  meta: ProductTabsMeta;
  content: ProductTabsContent;
}
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductImageSliderMeta {
  width: string;
  height: string;
  bgColor: string;
  thumbnailPosition: 'left' | 'bottom';
  thumbnailSize: number;
  borderColor: string;
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

// ─────────────────────────────────────────────────────────────────────────────

export type TagLayout = 'grid' | 'list' | 'row';

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
  href?: string;
}

export interface TagContent {
  title: string;
  tags: TagItem[];
}

export interface TagData {
  meta: TagMeta;
  content: TagContent;
}

// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────

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
  alignX: 'left' | 'center' | 'right';
  margin: string;
  maxWidth: string;
  maxHeight: string;
  minWidth: string;
  minHeight: string;
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

// ─── ProductHero ────────────────────────────────────────────
export interface ProductHeroMeta {
  bgColor: string;
  badgeBgColor: string;
  badgeTextColor: string;
  titleColor: string;
  highlightBulletColor: string;
  imageBgColor: string;
  buyNowBgColor: string;
  buyNowTextColor: string;
  downloadBgColor: string;
  downloadTextColor: string;
  partnerLogosHeight: string;
}

export interface ProductHeroPartnerLogo {
  image_url: string;
  image_alt: string;
  href?: string;
}

export interface ProductHeroContent {
  sku_badge: string;
  title: string;
  images: { image_url: string; image_alt: string }[];
  partner_logos: ProductHeroPartnerLogo[];
  highlights: string[];
  variant_options: string[];
  sample_price: string;
  sample_currency: string;
  volume_price?: string;
  volume_currency?: string;
  buy_now_url?: string;
  download_url?: string;
}

export interface ProductHeroData {
  meta: ProductHeroMeta;
  content: ProductHeroContent;
}

// ─── ProductTabsV2 ────────────────────────────────────────────
export interface ProductTabsV2Meta {
  active_color: string;
  tabBarBorderColor: string;
  tabsBgColor: string;
  contentBgColor: string;
  recaptchaSiteKey: string;
  datasheet_cta?: DatasheetCTA;
}

export interface ProductTabsV2Data {
  meta: ProductTabsV2Meta;
  content: ProductTabsContent;
}

// ─── EvaluationSection ──────────────────────────────────────

export interface EvaluationSectionMeta {
  bgColor: string;
  headingColor: string;
  nameColor: string;
  badgeBgColor: string;
  badgeTextColor: string;
  cardBgColor: string;
  cardWidth: string;
  cardGap: string;
  headingSize: string;
  nameSize: string;
  imageHeight: string;
  sectionPadding: string;
}

export interface EvaluationItem {
  image_url: string;
  image_alt: string;
  name: string;
  link: string;
  badge?: string;
}

export interface EvaluationSectionContent {
  heading: string;
  items: EvaluationItem[];
}

export interface EvaluationSectionData {
  meta: EvaluationSectionMeta;
  content: EvaluationSectionContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// HUB PAGE BLOCK TYPES
// ═══════════════════════════════════════════════════════════════════════════

// ─── HubHero ─────────────────────────────────────────────────
export interface HubHeroMeta {
  bgColor: string;
  titleColor: string;
  titleFontSize: string;
  titleAlign: 'left' | 'center' | 'right';
  descriptionColor: string;
  descriptionFontSize: string;
  imagePosition: 'right' | 'left';
  contentWidth: string;
  mediaWidth: string;
  mediaMode: 'single' | 'slider';
  width: string;
  ctaBgColor: string;
  ctaTextColor: string;
  brandBadgePosition: 'below-image' | 'title-row-right';
  brandBadgeWidth: string;
  brandBadgeHeight: string;
}

export interface HubHeroSlide {
  image_url: string;
  image_alt: string;
}

export interface HubHeroDocument {
  name: string;
  url: string;
  file_type: string;
}

export interface HubHeroContent {
  title: string;
  description: string;
  image_url: string;
  image_alt: string;
  images: HubHeroSlide[];
  brand_badge_url: string;
  brand_badge_alt: string;
  cta_text: string;
  cta_link: string;
  cta_type: 'link' | 'contact' | 'download';
  cta_contact_title: string;
  cta_documents: HubHeroDocument[];
}

export interface HubHeroData {
  meta: HubHeroMeta;
  content: HubHeroContent;
}

// ─── CategoryFilter ──────────────────────────────────────────
export interface CategoryFilterMeta {
  bgColor: string;
  cardBgColor: string;
  cardBorderRadius: string;
  sidebarWidth: string;
  columns: 2 | 3 | 4;
  width: string;
  activeFilterColor: string;
  badgeBgColor: string;
  badgeTextColor: string;
  headingColor: string;
  headingAlign: 'left' | 'center' | 'right';
  titleColor: string;
  titleFontSize: string;
  titleBold: boolean;
  titleItalic: boolean;
  descColor: string;
  descFontSize: string;
  descBold: boolean;
  descItalic: boolean;
}

export interface CategoryItem {
  label: string;
  filter_key: string;
}

export interface ProductReference {
  page_slug: string;
  categories: string[];
  badge: string;
  sort_order: number;
  description: string;
}

export interface CategoryFilterContent {
  section_title: string;
  section_icon: string;
  categories: CategoryItem[];
  products: ProductReference[];
}

export interface CategoryFilterData {
  meta: CategoryFilterMeta;
  content: CategoryFilterContent;
}

// ─── VariantsTable ───────────────────────────────────────────
export type VariantColumnKey =
  | 'product_name'
  | 'interface'
  | 'supported_platforms'
  | 'resolution'
  | 'wavelength'
  | 'suitable_for'
  | 'frame_rate'
  | 'output'
  | 'lens_option'
  | 'chroma'
  | 'isp'
  | 'max_cameras'
  | 'documents'
  | 'promotional_sample_price'
  | 'custom';

export interface VariantColumn {
  key: VariantColumnKey;
  label: string;
  visible: boolean;
  width: string;
}

export interface VariantActionButton {
  type: 'buy_now' | 'pre_order' | 'contact_us' | 'download';
  label: string;
  bgColor: string;
  textColor: string;
}

export interface VariantsTableMeta {
  bgColor: string;
  headingColor: string;
  headingAlign: 'left' | 'center' | 'right';
  headerBgColor: string;
  headerTextColor: string;
  rowBgColor: string;
  rowAltBgColor: string;
  rowTextColor: string;
  highlightRowColor: string;
  width: string;
  columns: VariantColumn[];
  actionButtons: VariantActionButton[];
}

export interface VariantRow {
  page_slug: string;
  badge: string;
  highlighted: boolean;
  custom_fields: Record<string, string>;
}

export interface VariantsTableContent {
  heading: string;
  rows: VariantRow[];
}

export interface VariantsTableData {
  meta: VariantsTableMeta;
  content: VariantsTableContent;
}

// ─── VideoGallery ────────────────────────────────────────────
export interface VideoGalleryMeta {
  bgColor: string;
  columns: 2 | 3 | 4 | 5;
  layout: 'grid' | 'slider';
  headingColor: string;
  headingAlign: 'left' | 'center' | 'right';
  cardAlign: 'left' | 'center' | 'right';
  cardBgColor: string;
  cardBorderRadius: string;
  titleColor: string;
  width: string;
}

export interface VideoGalleryItem {
  title: string;
  subtitle: string;
  video_url: string;
  thumbnail_url: string;
}

export interface VideoGalleryContent {
  heading: string;
  items: VideoGalleryItem[];
}

export interface VideoGalleryData {
  meta: VideoGalleryMeta;
  content: VideoGalleryContent;
}

// ─── FAQAccordion ────────────────────────────────────────────
export interface FAQAccordionMeta {
  bgColor: string;
  headingColor: string;
  headingAlign: 'left' | 'center' | 'right';
  questionColor: string;
  questionFontSize: string;
  answerColor: string;
  answerFontSize: string;
  borderColor: string;
  numbered: boolean;
  width: string;
}

export interface FAQAccordionItem {
  question: string;
  answer: string;
}

export interface FAQAccordionContent {
  heading: string;
  items: FAQAccordionItem[];
  know_more_link: string;
  know_more_text: string;
}

export interface FAQAccordionData {
  meta: FAQAccordionMeta;
  content: FAQAccordionContent;
}

// ─── RelatedBlogsGrid ────────────────────────────────────────
export interface RelatedBlogsGridMeta {
  bgColor: string;
  cardBgColor: string;
  cardBorderRadius: string;
  columns: 2 | 3 | 4;
  headingColor: string;
  headingAlign: 'left' | 'center' | 'right';
  cardAlign: 'left' | 'center' | 'right';
  titleColor: string;
  ctaBgColor: string;
  ctaTextColor: string;
  width: string;
}

export interface RelatedBlogItem {
  image_url: string;
  image_alt: string;
  title: string;
  excerpt: string;
  link: string;
  cta_text: string;
}

export interface RelatedBlogsGridContent {
  heading: string;
  items: RelatedBlogItem[];
}

export interface RelatedBlogsGridData {
  meta: RelatedBlogsGridMeta;
  content: RelatedBlogsGridContent;
}

// ─── TargetApplications ──────────────────────────────────────
export interface TargetApplicationsMeta {
  bgColor: string;
  cardBorderRadius: string;
  captionColor: string;
  columns: 3 | 4 | 5;
  layout: 'grid' | 'slider';
  headingColor: string;
  headingAlign: 'left' | 'center' | 'right';
  cardAlign: 'left' | 'center' | 'right';
  autoplay: boolean;
  autoplayInterval: number;
  width: string;
}

export interface TargetApplicationItem {
  image_url: string;
  image_alt: string;
  caption: string;
  link: string;
}

export interface TargetApplicationsContent {
  heading: string;
  items: TargetApplicationItem[];
}

export interface TargetApplicationsData {
  meta: TargetApplicationsMeta;
  content: TargetApplicationsContent;
}

// ─── Spotlights ──────────────────────────────────────────────
export interface SpotlightsMeta {
  bgColor: string;
  headingColor: string;
  headingAlign: 'left' | 'center' | 'right';
  iconSize: string;
  titleColor: string;
  titleFontSize: string;
  descriptionColor: string;
  descriptionFontSize: string;
  columns: 2 | 3 | 4 | 5;
  layout: 'grid' | 'slider';
  cardAlign: 'left' | 'center';
  width: string;
}

export interface SpotlightItem {
  icon_url: string;
  icon_alt: string;
  title: string;
  description: string;
}

export interface SpotlightsContent {
  heading: string;
  items: SpotlightItem[];
}

export interface SpotlightsData {
  meta: SpotlightsMeta;
  content: SpotlightsContent;
}

// ─── DocumentDownload ────────────────────────────────────────
export interface DocumentDownloadMeta {
  bgColor: string;
  headingColor: string;
  headingAlign: 'left' | 'center' | 'right';
  headerColor: string;
  linkColor: string;
  checkboxColor: string;
  columns: 1 | 2;
  width: string;
}

export interface DocumentFile {
  name: string;
  url: string;
  file_type: string;
}

export interface DocumentCategory {
  category_name: string;
  icon: string;
  files: DocumentFile[];
}

export interface DocumentDownloadProduct {
  page_slug: string;
  label: string;
  categories: DocumentCategory[];
}

export interface DocumentDownloadContent {
  heading: string;
  products: DocumentDownloadProduct[];
}

export interface DocumentDownloadData {
  meta: DocumentDownloadMeta;
  content: DocumentDownloadContent;
}

// ─── ProductHeroNew ──────────────────────────────────────────
export interface ProductHighlightIcon {
  icon_url: string;
  icon_alt?: string;
  icon_label: string;
}

export interface ProductHeroAdItem {
  image_url: string;
  image_alt: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
}

export interface ProductHeroNewMeta {
  bgColor: string;
  badgeBgColor: string;
  badgeTextColor: string;
  titleColor: string;
  highlightsHeadingColor: string;
  highlightBulletColor: string;
  imageBgColor: string;
  buyNowBgColor: string;
  buyNowTextColor: string;
  downloadBgColor: string;
  downloadTextColor: string;
  partnerLogosHeight: string;
  priceLabelColor: string;
  priceValueColor: string;
}

export interface ProductHeroNewPartnerLogo {
  image_url: string;
  image_alt: string;
  href?: string;
}

export interface ProductHeroNewContent {
  sku_badge: string;
  title: string;
  images: { image_url: string; image_alt: string }[];
  partner_logos: ProductHeroNewPartnerLogo[];
  highlights: string[];
  highlight_icons?: ProductHighlightIcon[];
  show_highlight_icons?: boolean;
  variant_options: string[];
  sample_price: string;
  sample_currency: string;
  volume_price?: string;
  volume_currency?: string;
  buy_now_url?: string;
  download_url?: string;
  download_label: string;
  download_sub_label?: string;
  tags?: { label: string; href?: string }[];
  ad?: ProductHeroAdItem;
  template_ad?: ProductHeroAdItem;
  hide_ad?: boolean;
}

export interface ProductHeroNewData {
  meta: ProductHeroNewMeta;
  content: ProductHeroNewContent;
}

// ─── NewsletterSubscribe ─────────────────────────────────────
export interface NewsletterSubscribeMeta {
  bgColor: string;
  headingColor: string;
  headingFontSize: string;
  headingFontWeight: string;
  inputBorderColor: string;
  inputBgColor: string;
  inputTextColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  buttonLabel: string;
  placeholderText: string;
  successMessage: string;
  errorMessage: string;
  width: string;
}

export interface NewsletterSubscribeContent {
  heading: string;
  form_action_url?: string;
}

export interface NewsletterSubscribeData {
  meta: NewsletterSubscribeMeta;
  content: NewsletterSubscribeContent;
}

// ─── TargetedApplications ────────────────────────────────────────────────────

export interface TargetedApplicationsMeta {
  bgColor: string;
  headingColor: string;
  headingSize: string;
  headingAlign: 'left' | 'center' | 'right';
  cardBgColor: string;
  cardBorderRadius: string;
  cardGap: string;
  titleColor: string;
  titleSize: string;
  imageAspectRatio: string;
  visibleCards: 2 | 3 | 4 | 5;
  sectionPadding: string;
}

export interface TargetedApplicationItem {
  image_url: string;
  image_alt: string;
  title: string;
  link?: string;
}

export interface TargetedApplicationsContent {
  heading: string;
  items: TargetedApplicationItem[];
}

export interface TargetedApplicationsData {
  meta: TargetedApplicationsMeta;
  content: TargetedApplicationsContent;
}

// ─── ResourceTab ─────────────────────────────────────────────────────────────

export interface ResourceTabMeta {
  bgColor: string;
  sidebarBgColor: string;
  tabActiveColor: string;
  tabInactiveColor: string;
  tabFontSize: string;
  cardBgColor: string;
  cardBorderRadius: string;
  cardGap: string;
  titleColor: string;
  titleSize: string;
  descColor: string;
  descSize: string;
  ctaBgColor: string;
  ctaTextColor: string;
  ctaBorderRadius: string;
  ctaSize: string;
  imageAspectRatio: string;
  visibleCards: 1 | 2 | 3 | 4;
  tabCount: 1 | 2 | 3 | 4 | 5;
  sectionPadding: string;
}

export interface ResourceTabCard {
  image_url: string;
  image_alt: string;
  title: string;
  description?: string;
  cta_text?: string;
  cta_link?: string;
}

export interface ResourceTabItem {
  name: string;
  cards: ResourceTabCard[];
}

export interface ResourceTabContent {
  tabs: ResourceTabItem[];
}

export interface ResourceTabData {
  meta: ResourceTabMeta;
  content: ResourceTabContent;
}

// ─── FAQNew ─────────────────────────────────────────────────
export interface FAQNewMeta {
  bgColor: string;
  headingColor: string;
  headingSize: string;
  headingAlign: 'left' | 'center' | 'right';
  cardCollapsedBg: string;
  cardExpandedBg: string;
  cardBorderRadius: string;
  questionColor: string;
  questionFontSize: string;
  answerColor: string;
  answerFontSize: string;
  linkColor: string;
  btnBgColor: string;
  btnIconColor: string;
  sectionPadding: string;
}

export interface FAQNewItem {
  question: string;
  answer: string;
  link_text?: string;
  link_href?: string;
}

export interface FAQNewContent {
  heading: string;
  items: FAQNewItem[];
}

export interface FAQNewData {
  meta: FAQNewMeta;
  content: FAQNewContent;
}
