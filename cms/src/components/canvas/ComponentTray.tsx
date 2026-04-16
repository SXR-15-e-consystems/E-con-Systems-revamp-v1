import { useDraggable } from '@dnd-kit/core';
import type { BlockType } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Component definitions for the tray (all your existing TemplatesComps)
// ─────────────────────────────────────────────────────────────────────────────

export interface TrayComponentDef {
  type: BlockType;
  label: string;
  description: string;
  icon: string;      // emoji icon for visual identification
  category: 'content' | 'media' | 'interactive' | 'layout';
  defaultMeta: Record<string, unknown>;
  /** Default grid span for when dropped onto canvas */
  defaultSpan: { cols: number; rows: number };
}

export const TRAY_COMPONENTS: TrayComponentDef[] = [
  // ── Legacy components ──
  {
    type: 'Hero',
    label: 'Hero Section',
    description: 'Full-width hero banner with title, subtitle, image & CTA',
    icon: '🎯',
    category: 'content',
    defaultMeta: {},
    defaultSpan: { cols: 40, rows: 8 },
  },
  {
    type: 'RichText',
    label: 'Rich Text',
    description: 'Free-form HTML text content block',
    icon: '📝',
    category: 'content',
    defaultMeta: {},
    defaultSpan: { cols: 20, rows: 5 },
  },

  // ── TemplatesComps components ──
  {
    type: 'Banner',
    label: 'Banner',
    description: 'Image banner with optional slider, CTA overlay & variants',
    icon: '🖼️',
    category: 'media',
    defaultMeta: {
      width: '100%',
      height: '480px',
      bgColor: '#000000',
      variant: 'type2',
      sliderMode: false,
      autoplayInterval: 5000,
      ctaPosition: 'bottom-left',
      ctaStyle: { bgColor: '#e63329', textColor: '#ffffff', borderRadius: '4px', fontSize: '16px' },
    },
    defaultSpan: { cols: 40, rows: 10 },
  },
  {
    type: 'RelatedContent',
    label: 'Related Content',
    description: 'Card grid for blogs, videos, products, or case studies',
    icon: '📰',
    category: 'content',
    defaultMeta: {
      contentType: 'Blog',
      displayCount: 3,
      sliderMode: false,
      showTitle: true,
      showCTA: true,
      ctaLabel: 'Read More',
      cardStyle: { bgColor: '#ffffff', textColor: '#1a1a1a', borderRadius: '8px' },
      width: '100%',
    },
    defaultSpan: { cols: 40, rows: 7 },
  },
  {
    type: 'Timer',
    label: 'Countdown Timer',
    description: 'Countdown timer bar or popup with configurable position',
    icon: '⏱️',
    category: 'interactive',
    defaultMeta: {
      layout: 'bar',
      position: 'bottom',
      visible: true,
      bgColor: '#1a1a1a',
      textColor: '#ffffff',
      width: '380px',
    },
    defaultSpan: { cols: 40, rows: 2 },
  },
  {
    type: 'Form',
    label: 'Form',
    description: 'Contact, registration, or quote request form',
    icon: '📋',
    category: 'interactive',
    defaultMeta: {
      formType: 'contact',
      recaptchaSiteKey: '',
      tcLink: '/terms',
      bgColor: '#ffffff',
      width: '600px',
      submitLabel: 'Submit',
    },
    defaultSpan: { cols: 20, rows: 10 },
  },
  {
    type: 'CTAButton',
    label: 'CTA Button',
    description: 'Call-to-action button that opens a form modal',
    icon: '🔘',
    category: 'interactive',
    defaultMeta: {
      formType: 'contact',
      width: 'auto',
      position: 'inline',
      style: {
        bgColor: '#e63329',
        textColor: '#ffffff',
        borderRadius: '4px',
        fontSize: '16px',
        padding: '12px 24px',
      },
    },
    defaultSpan: { cols: 10, rows: 2 },
  },
  {
    type: 'ProductTabs',
    label: 'Product Tabs',
    description: 'Tabbed section with sidebar navigation for product details',
    icon: '🗂️',
    category: 'interactive',
    defaultMeta: {
      sidebar_width: '160px',
      active_color: '#2563eb',
      mobile_layout: 'horizontal_scroll',
      max_custom_tabs: 2,
    },
    defaultSpan: { cols: 40, rows: 8 },
  },
  // ── Product Image Slider ──
  {
    type: 'ProductImageSlider',
    label: 'Product Image Slider',
    description: 'Image gallery with thumbnail navigation — ideal for product pages',
    icon: '🖼️',
    category: 'media',
    defaultMeta: {
      width: '100%',
      height: '480px',
      bgColor: '#ffffff',
      thumbnailPosition: 'left',
      thumbnailSize: 72,
      borderColor: '#2563eb',
    },
    defaultSpan: { cols: 20, rows: 10 },
  },

  // ── Tag ──
  {
    type: 'Tag',
    label: 'Tags',
    description: 'Pill-shaped tag labels in grid or list layout with title',
    icon: '🏷️',
    category: 'content',
    defaultMeta: {
      layout: 'grid',
      bgColor: '#ffffff',
      tagBgColor: '#f1f5f9',
      tagTextColor: '#334155',
      tagBorderRadius: '9999px',
      showIcon: true,
      width: '100%',
    },
    defaultSpan: { cols: 20, rows: 5 },
  },

  // ── Headline ──
  {
    type: 'Headline',
    label: 'Headline',
    description: 'Styled text heading with custom font, size, weight & colour',
    icon: '🅰️',
    category: 'content',
    defaultMeta: {
      tag: 'h2',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '28px',
      fontWeight: '700',
      textColor: '#1a1a2e',
      bgColor: 'transparent',
      align: 'left',
      width: '100%',
      letterSpacing: '0px',
      lineHeight: '1.3',
    },
    defaultSpan: { cols: 40, rows: 2 },
  },

  // ── Product Description ──
  {
    type: 'ProductDescription',
    label: 'Product Description',
    description: 'Titled bullet-point list with customisable bullet styles',
    icon: '📋',
    category: 'content',
    defaultMeta: {
      bgColor: '#ffffff',
      titleColor: '#1a1a2e',
      titleFontSize: '18px',
      titleFontWeight: '700',
      textColor: '#374151',
      textFontSize: '15px',
      bulletStyle: 'disc',
      bulletColor: '#16a34a',
      lineSpacing: '1.7',
      width: '100%',
    },
    defaultSpan: { cols: 20, rows: 6 },
  },

  // ── Sample Price ──
  {
    type: 'SamplePrice',
    label: 'Sample Price',
    description: 'Price box showing label, currency & price',
    icon: '💲',
    category: 'content',
    defaultMeta: {
      label: 'Sample Price',
      price: '299',
      currency: 'USD',
      bgColor: '#ffffff',
      labelColor: '#374151',
      priceColor: '#2563eb',
      labelFontSize: '14px',
      priceFontSize: '22px',
      borderRadius: '10px',
      borderColor: '#e5e7eb',
      width: '100%',
    },
    defaultSpan: { cols: 10, rows: 3 },
  },

  // ── Image Only ──
  {
    type: 'ImageOnly',
    label: 'Image',
    description: 'Single image that fills its container, no overlays',
    icon: '🖼️',
    category: 'media',
    defaultMeta: {
      bgColor: '#ffffff',
      borderRadius: '0px',
      objectFit: 'cover',
      width: '100%',
      height: '100%',
      alignX: 'left',
      margin: '0px',
      maxWidth: '',
      maxHeight: '',
      minWidth: '',
      minHeight: '',
    },
    defaultSpan: { cols: 20, rows: 8 },
  },

  // ── Action Button ──
  {
    type: 'ActionButton',
    label: 'Action Button',
    description: 'Button with icon, text & sub-text (Contact Us, Download…)',
    icon: '🔘',
    category: 'content',
    defaultMeta: {
      bgColor: '#2952cc',
      textColor: '#ffffff',
      fontSize: '16px',
      fontWeight: '700',
      subTextColor: '#1f2937',
      subTextFontSize: '13px',
      borderRadius: '6px',
      paddingX: '28px',
      paddingY: '12px',
      icon: 'cart',
      iconPosition: 'left',
      width: 'auto',
      align: 'left',
    },
    defaultSpan: { cols: 10, rows: 3 },
  },

  // ── Evaluation Section ──
  {
    type: 'EvaluationSection',
    label: 'Evaluation Section',
    description: 'Horizontal product cards with image, name & optional badge',
    icon: '🧪',
    category: 'content',
    defaultMeta: {
      bgColor: '#ffffff',
      headingColor: '#1f2937',
      nameColor: '#2563eb',
      badgeBgColor: '#16a34a',
      badgeTextColor: '#ffffff',
      cardWidth: '180px',
      cardGap: '24px',
    },
    defaultSpan: { cols: 40, rows: 6 },
  },

  // ── Hub Page components ──
  {
    type: 'HubHero',
    label: 'Hub Hero',
    description: 'Split-layout hero for hub pages — title, description, image & CTA',
    icon: '🏠',
    category: 'content',
    defaultMeta: {
      bgColor: '#ffffff',
      titleColor: '#1a1a2e',
      titleFontSize: '32px',
      titleAlign: 'left',
      descriptionColor: '#374151',
      descriptionFontSize: '15px',
      imagePosition: 'right',
      contentWidth: '50%',
      mediaWidth: '50%',
      mediaMode: 'single',
      width: '100%',
      ctaBgColor: '#2563eb',
      ctaTextColor: '#ffffff',
      brandBadgePosition: 'below-image',
      brandBadgeWidth: '120px',
      brandBadgeHeight: '40px',
    },
    defaultSpan: { cols: 40, rows: 8 },
  },
  {
    type: 'CategoryFilter',
    label: 'Category Filter',
    description: 'Sidebar category list with filterable product card grid',
    icon: '🗂️',
    category: 'interactive',
    defaultMeta: {
      bgColor: '#ffffff',
      cardBgColor: '#ffffff',
      cardBorderRadius: '8px',
      sidebarWidth: '200px',
      columns: 3,
      width: '100%',
      activeFilterColor: '#2563eb',
      badgeBgColor: '#16a34a',
      badgeTextColor: '#ffffff',
      headingColor: '#1f2937',
      headingAlign: 'left',
      titleColor: '#1f2937',
      titleFontSize: '14px',
      titleBold: true,
      titleItalic: false,
      descColor: '#6b7280',
      descFontSize: '12px',
      descBold: false,
      descItalic: false,
    },
    defaultSpan: { cols: 40, rows: 12 },
  },
  {
    type: 'VariantsTable',
    label: 'Variants Table',
    description: 'Product comparison table with configurable columns & action buttons',
    icon: '📊',
    category: 'content',
    defaultMeta: {
      bgColor: '#ffffff',
      headingColor: '#1f2937',
      headingAlign: 'left',
      headerBgColor: '#002B5B',
      headerTextColor: '#ffffff',
      rowBgColor: '#ffffff',
      rowAltBgColor: '#f8fafc',
      rowTextColor: '#1f2937',
      highlightRowColor: '#fef3c7',
      width: '100%',
      columns: [
        { key: 'product_name', label: 'Product Name', visible: true, width: '200px' },
        { key: 'interface', label: 'Interface', visible: true, width: '120px' },
        { key: 'supported_platforms', label: 'Supported Platforms', visible: true, width: '180px' },
        { key: 'resolution', label: 'Resolution', visible: true, width: '120px' },
        { key: 'frame_rate', label: 'Frame Rate', visible: true, width: '100px' },
        { key: 'chroma', label: 'Chroma', visible: true, width: '80px' },
        { key: 'lens_option', label: 'Lens Option', visible: true, width: '120px' },
        { key: 'promotional_sample_price', label: 'Sample Price', visible: true, width: '120px' },
      ],
      actionButtons: [
        { type: 'buy_now', label: 'Buy Now', bgColor: '#e63329', textColor: '#ffffff' },
        { type: 'contact_us', label: 'Contact Us', bgColor: '#2952cc', textColor: '#ffffff' },
      ],
    },
    defaultSpan: { cols: 40, rows: 10 },
  },
  {
    type: 'VideoGallery',
    label: 'Video Gallery',
    description: 'Grid of video cards with YouTube modal playback',
    icon: '🎬',
    category: 'media',
    defaultMeta: {
      bgColor: '#ffffff',
      columns: 3,
      cardBgColor: '#ffffff',
      cardBorderRadius: '8px',
      titleColor: '#1f2937',
      width: '100%',
      layout: 'grid',
      headingColor: '#1f2937',
      headingAlign: 'left',
      cardAlign: 'left',
    },
    defaultSpan: { cols: 40, rows: 8 },
  },
  {
    type: 'FAQAccordion',
    label: 'FAQ Accordion',
    description: 'Numbered Q&A accordion with expand/collapse & know-more link',
    icon: '❓',
    category: 'interactive',
    defaultMeta: {
      bgColor: '#ffffff',
      headingColor: '#1f2937',
      headingAlign: 'left',
      questionColor: '#1f2937',
      questionFontSize: '16px',
      answerColor: '#4b5563',
      answerFontSize: '14px',
      borderColor: '#e5e7eb',
      numbered: true,
      width: '100%',
    },
    defaultSpan: { cols: 40, rows: 8 },
  },
  {
    type: 'RelatedBlogsGrid',
    label: 'Related Blogs',
    description: 'Multi-column blog card grid with image, excerpt & CTA',
    icon: '📰',
    category: 'content',
    defaultMeta: {
      bgColor: '#f8fafc',
      cardBgColor: '#ffffff',
      cardBorderRadius: '8px',
      columns: 3,
      headingColor: '#1f2937',
      headingAlign: 'left',
      cardAlign: 'left',
      titleColor: '#1f2937',
      ctaBgColor: '#2563eb',
      ctaTextColor: '#ffffff',
      width: '100%',
    },
    defaultSpan: { cols: 40, rows: 8 },
  },
  {
    type: 'TargetApplications',
    label: 'Target Applications',
    description: 'Grid or carousel of application image cards with captions',
    icon: '🎯',
    category: 'media',
    defaultMeta: {
      bgColor: '#ffffff',
      cardBorderRadius: '8px',
      captionColor: '#1f2937',
      columns: 4,
      autoplay: false,
      autoplayInterval: 4000,
      width: '100%',
      layout: 'grid',
      headingColor: '#1f2937',
      headingAlign: 'center',
      cardAlign: 'center',
    },
    defaultSpan: { cols: 40, rows: 6 },
  },
  {
    type: 'Spotlights',
    label: 'Spotlights',
    description: 'Multi-column feature highlights with icon, title & description',
    icon: '💡',
    category: 'content',
    defaultMeta: {
      bgColor: '#ffffff',
      headingColor: '#1f2937',
      headingAlign: 'center',
      iconSize: '48px',
      titleColor: '#1f2937',
      titleFontSize: '18px',
      descriptionColor: '#6b7280',
      descriptionFontSize: '14px',
      columns: 3,
      layout: 'grid',
      cardAlign: 'left',
      width: '100%',
    },
    defaultSpan: { cols: 40, rows: 6 },
  },
  {
    type: 'DocumentDownload',
    label: 'Document Download',
    description: 'Categorised document list with checkboxes & bulk download',
    icon: '📥',
    category: 'interactive',
    defaultMeta: {
      bgColor: '#ffffff',
      headingColor: '#1f2937',
      headingAlign: 'left',
      headerColor: '#1f2937',
      linkColor: '#2563eb',
      checkboxColor: '#2563eb',
      columns: 2,
      width: '100%',
    },
    defaultSpan: { cols: 40, rows: 8 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Individual draggable tray item
// ─────────────────────────────────────────────────────────────────────────────

function TrayItem({ def }: { def: TrayComponentDef }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tray-${def.type}`,
    data: { source: 'tray', componentDef: def },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3
        cursor-grab active:cursor-grabbing select-none
        transition-all duration-150
        hover:border-blue-400 hover:shadow-md hover:bg-blue-50/40
        ${isDragging ? 'opacity-40 scale-95 border-blue-500 shadow-lg' : ''}
      `}
    >
      <span className="mt-0.5 text-xl leading-none">{def.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{def.label}</p>
        <p className="mt-0.5 text-xs text-slate-500 leading-snug">{def.description}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full component tray sidebar
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: { key: TrayComponentDef['category']; label: string }[] = [
  { key: 'content', label: 'Content' },
  { key: 'media', label: 'Media' },
  { key: 'interactive', label: 'Interactive' },
  { key: 'layout', label: 'Layout' },
];

export function ComponentTray() {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Components
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">Drag onto canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {CATEGORIES.map(({ key, label }) => {
          const items = TRAY_COMPONENTS.filter((c) => c.category === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {label}
              </h3>
              <div className="space-y-2">
                {items.map((def) => (
                  <TrayItem key={def.type} def={def} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
