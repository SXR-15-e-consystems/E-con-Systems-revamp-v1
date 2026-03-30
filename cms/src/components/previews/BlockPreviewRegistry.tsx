/**
 * CMS-side live preview renderers for each block type.
 * These use plain HTML/CSS (no Next.js Image/Link) for use inside the CMS canvas.
 */
import { memo, type ComponentType } from 'react';
import type { BlockType } from '../../types';
import { sanitizeHtml } from '../../utils/sanitize';

/**
 * Preview components render loosely-typed CMS block data from varying block types.
 * A JSON-compatible recursive type provides flexible property access while being
 * more explicit than `any`. Each preview casts its `data` prop to this type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PreviewData = Record<string, any>;

// ─── Banner Preview ──────────────────────────────────────────
const BannerPreview = memo(function BannerPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const slides = data.content?.slides ?? [];
  const slide = slides[0]; // Show first slide in preview

  if (!slide) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white/60 text-sm font-medium">
        <span>Banner — No slides added yet</span>
      </div>
    );
  }

  const variant = meta.variant ?? 'type2';
  const bgColor = meta.bgColor ?? '#000';

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: bgColor, minHeight: 120 }}>
      {slide.image_url && (
        <img
          src={slide.image_url}
          alt={slide.image_alt || 'Banner'}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      {!slide.image_url && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          <span className="text-white/40 text-sm">No image set</span>
        </div>
      )}
      {variant === 'type2' && (slide.title || slide.cta_text) && (
        <div className="absolute bottom-4 left-4 z-10 max-w-[60%]">
          {slide.title && <h3 className="text-white text-lg font-bold drop-shadow-lg mb-1 line-clamp-2">{slide.title}</h3>}
          {slide.description && <p className="text-white/80 text-xs drop-shadow mb-2 line-clamp-2">{slide.description}</p>}
          {slide.cta_text && (
            <span
              className="inline-block text-white text-xs font-bold px-4 py-2 rounded shadow-lg"
              style={{ backgroundColor: meta.ctaStyle?.bgColor ?? '#e63329' }}
            >
              {slide.cta_text}
            </span>
          )}
        </div>
      )}
      {slides.length > 1 && (
        <div className="absolute bottom-2 right-3 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full font-bold z-10">
          1 / {slides.length}
        </div>
      )}
    </div>
  );
});

// ─── CTA Button Preview ──────────────────────────────────────
const CTAButtonPreview = memo(function CTAButtonPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const content = data.content ?? {};
  const text = content.text || meta.text || 'Button';
  const bgColor = meta.bgColor || content.bgColor || '#e63329';
  const textColor = meta.textColor || content.textColor || '#ffffff';

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 p-4">
      <span
        className="inline-block font-bold px-6 py-3 rounded shadow-md text-sm"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {text}
      </span>
    </div>
  );
});

// ─── Timer Preview ──────────────────────────────────────────
const TimerPreview = memo(function TimerPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const content = data.content ?? {};
  const label = content.label || meta.label || 'Countdown Timer';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-white p-4 gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex gap-3">
        {['Days', 'Hrs', 'Min', 'Sec'].map((unit) => (
          <div key={unit} className="flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums">00</span>
            <span className="text-[10px] uppercase text-slate-400">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Form Preview ──────────────────────────────────────────
const FormPreview = memo(function FormPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const heading = meta.heading || 'Contact Form';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-white p-6 gap-3">
      <h3 className="font-bold text-slate-800 text-sm">{heading}</h3>
      <div className="w-full max-w-[220px] space-y-2">
        <div className="h-8 rounded border border-slate-200 bg-slate-50" />
        <div className="h-8 rounded border border-slate-200 bg-slate-50" />
        <div className="h-16 rounded border border-slate-200 bg-slate-50" />
        <div className="h-8 rounded bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">Submit</span>
        </div>
      </div>
    </div>
  );
});

// ─── Related Content Preview ──────────────────────────────────
const RelatedContentPreview = memo(function RelatedContentPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const content = data.content ?? {};
  const heading = content.heading || meta.heading || 'Related Content';
  const items = content.items ?? [];

  return (
    <div className="flex h-full w-full flex-col bg-white p-4 gap-3">
      <h3 className="font-bold text-slate-800 text-sm">{heading}</h3>
      <div className="flex gap-2 flex-wrap">
        {(items.length > 0 ? items.slice(0, 3) : [1, 2, 3]).map((_: PreviewData, i: number) => (
          <div key={i} className="flex-1 min-w-[80px] rounded border border-slate-200 bg-slate-50 p-3">
            <div className="h-12 w-full rounded bg-slate-200 mb-2" />
            <div className="h-2 w-3/4 rounded bg-slate-200 mb-1" />
            <div className="h-2 w-1/2 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Hero Preview ──────────────────────────────────────────
const HeroPreview = memo(function HeroPreview({ data }: { data: PreviewData }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 p-6 text-center text-white">
      {data.image_url && (
        <img src={data.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      )}
      <div className="relative z-10">
        <h2 className="text-xl font-bold drop-shadow-lg mb-1">{data.title || 'Hero Title'}</h2>
        {data.subtitle && <p className="text-sm text-white/80 drop-shadow mb-3">{data.subtitle}</p>}
        {data.cta_text && (
          <span className="inline-block bg-white text-blue-700 font-bold text-xs px-4 py-2 rounded shadow">
            {data.cta_text}
          </span>
        )}
      </div>
    </div>
  );
});

// ─── RichText Preview ──────────────────────────────────────
const RichTextPreview = memo(function RichTextPreview({ data }: { data: PreviewData }) {
  const rawHtml = typeof data.html === 'string' ? data.html : '';
  if (!rawHtml) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white text-slate-400 text-sm p-4">
        Rich Text — No content yet
      </div>
    );
  }
  const safeHtml = sanitizeHtml(rawHtml);
  return (
    <div
      className="h-full w-full overflow-hidden bg-white p-4 prose prose-sm max-w-none text-slate-800"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
});

// ─── Product Image Slider Preview ──────────────────────────
const ProductImageSliderPreview = memo(function ProductImageSliderPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const slides = data.content?.slides ?? [];
  const slide = slides[0];
  const borderColor = meta.borderColor ?? '#2563eb';
  const thumbSize = meta.thumbnailSize ?? 72;
  const position = meta.thumbnailPosition ?? 'left';

  if (!slide) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white text-slate-400 text-sm font-medium">
        Product Image Slider — No images added yet
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full overflow-hidden bg-white ${position === 'bottom' ? 'flex-col' : 'flex-row'}`}
      style={{ backgroundColor: meta.bgColor ?? '#fff' }}
    >
      {/* Thumbnails */}
      <div className={`flex gap-1 p-1.5 ${position === 'bottom' ? 'flex-row justify-center' : 'flex-col'}`}>
        {slides.slice(0, 4).map((_: PreviewData, i: number) => (
          <div
            key={i}
            className="rounded overflow-hidden flex-shrink-0"
            style={{
              width: Math.min(thumbSize, 48),
              height: Math.min(thumbSize, 48),
              border: i === 0 ? `2px solid ${borderColor}` : '2px solid #d1d5db',
            }}
          >
            {slides[i]?.image_url ? (
              <img
                src={slides[i].image_url}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-full w-full bg-slate-200" />
            )}
          </div>
        ))}
        {slides.length > 4 && (
          <div
            className="flex items-center justify-center rounded bg-slate-100 text-[9px] text-slate-500 font-bold flex-shrink-0"
            style={{ width: Math.min(thumbSize, 48), height: Math.min(thumbSize, 48) }}
          >
            +{slides.length - 4}
          </div>
        )}
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
        {slide.image_url ? (
          <img
            src={slide.image_url}
            alt={slide.image_alt || 'Product'}
            className="max-h-full max-w-full object-contain border-2 border-gray-300 rounded shadow-md"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="flex items-center justify-center text-slate-300 text-sm">No image</div>
        )}
      </div>
    </div>
  );
});
// ─── Tag Preview ──────────────────────────────────────────────────
const TagPreview = memo(function TagPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const content = data.content ?? {};
  const title = content.title || 'Tags';
  const tags = content.tags ?? [];
  const layout = meta.layout ?? 'grid';
  const tagBg = meta.tagBgColor ?? '#f1f5f9';
  const tagText = meta.tagTextColor ?? '#334155';
  const tagRadius = meta.tagBorderRadius ?? '9999px';

  const displayTags = tags.length > 0
    ? tags.slice(0, 5)
    : [{ label: 'Tag 1' }, { label: 'Tag 2' }, { label: 'Tag 3' }];

  return (
    <div
      className="flex h-full w-full flex-col p-4 gap-2 overflow-hidden"
      style={{ backgroundColor: meta.bgColor ?? '#fff' }}
    >
      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
        {meta.showIcon !== false && <span className="text-blue-600 text-xs">▦</span>}
        {title}
      </h3>
      <div className={layout === 'grid' ? 'flex flex-wrap gap-1.5' : 'flex flex-col gap-1.5'}>
        {displayTags.map((t: PreviewData, i: number) => (
          <span
            key={i}
            className="inline-block px-3 py-1 text-[11px] font-medium truncate max-w-[140px]"
            style={{ backgroundColor: tagBg, color: tagText, borderRadius: tagRadius }}
          >
            {t.label}
          </span>
        ))}
        {tags.length > 5 && (
          <span className="inline-block px-2 py-1 text-[10px] text-slate-400 font-bold">
            +{tags.length - 5}
          </span>
        )}
      </div>
    </div>
  );
});
// ─── Headline Preview ──────────────────────────────────────
const HeadlinePreview = memo(function HeadlinePreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const content = data.content ?? {};
  const text = content.text || 'Headline';
  const fontFamily = meta.fontFamily ?? 'inherit';
  const fontSize = meta.fontSize ?? '28px';
  const fontWeight = meta.fontWeight ?? '700';
  const align = meta.align ?? 'left';
  const color = meta.color ?? '#1a1a2e';
  const bgColor = meta.bgColor ?? '#ffffff';

  return (
    <div
      className="flex h-full w-full items-center overflow-hidden p-4"
      style={{ backgroundColor: bgColor, justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}
    >
      <span
        className="truncate"
        style={{ fontFamily, fontSize, fontWeight: Number(fontWeight), color, textAlign: align as 'left' | 'center' | 'right' }}
      >
        {text}
      </span>
    </div>
  );
});

// ─── Product Description Preview ──────────────────────────────
const ProductDescriptionPreview = memo(function ProductDescriptionPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const content = data.content ?? {};
  const title = content.title || 'Description';
  const bullets = content.bullets ?? [];
  const bulletStyle = meta.bulletStyle ?? 'disc';
  const titleColor = meta.titleColor ?? '#1a1a2e';
  const textColor = meta.textColor ?? '#374151';
  const bgColor = meta.bgColor ?? '#ffffff';

  const charMap: Record<string, string> = { disc: '•', circle: '◦', square: '▪', dash: '–', check: '✓' };
  const bulletChar = charMap[bulletStyle] ?? '•';
  const displayBullets = bullets.length > 0
    ? bullets.slice(0, 4)
    : [{ text: 'Feature point one' }, { text: 'Feature point two' }, { text: 'Feature point three' }];

  return (
    <div className="flex h-full w-full flex-col p-4 gap-2 overflow-hidden" style={{ backgroundColor: bgColor }}>
      <h3 className="font-bold text-sm" style={{ color: titleColor }}>{title}</h3>
      <ul className="space-y-1">
        {displayBullets.map((b: PreviewData, i: number) => (
          <li key={i} className="flex gap-2 text-[12px] leading-snug" style={{ color: textColor }}>
            <span className="flex-shrink-0" style={{ color: meta.bulletColor ?? textColor }}>{bulletChar}</span>
            <span className="line-clamp-2">{b.text}</span>
          </li>
        ))}
        {bullets.length > 4 && (
          <li className="text-[10px] text-slate-400 font-bold pl-4">+{bullets.length - 4} more</li>
        )}
      </ul>
    </div>
  );
});
// ─── SamplePrice Preview ────────────────────────────────────
const SamplePricePreview = memo(function SamplePricePreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const content = data.content ?? {};
  const label = content.label || meta.label || 'Sample Price';
  const currency = content.currency || meta.currency || 'USD';
  const price = content.price || meta.price || '299';
  const bgColor = meta.bgColor ?? '#ffffff';
  const labelColor = meta.labelColor ?? '#374151';
  const priceColor = meta.priceColor ?? '#2563eb';
  const borderColor = meta.borderColor ?? '#e5e7eb';
  const borderRadius = meta.borderRadius ?? '10px';

  return (
    <div className="flex h-full w-full items-center p-4" style={{ backgroundColor: bgColor }}>
      <div
        className="inline-flex flex-col gap-0.5 px-5 py-3"
        style={{ border: `1px solid ${borderColor}`, borderRadius }}
      >
        <span className="text-sm" style={{ color: labelColor, fontWeight: 500 }}>{label}</span>
        <span className="text-lg font-bold" style={{ color: priceColor }}>{currency} {price}</span>
      </div>
    </div>
  );
});

// ─── ImageOnly Preview ─────────────────────────────────────
const ImageOnlyPreview = memo(function ImageOnlyPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const content = data.content ?? {};
  const url = content.image_url;
  const objectFit = meta.objectFit ?? 'cover';
  const borderRadius = meta.borderRadius ?? '0px';
  const bgColor = meta.bgColor ?? '#ffffff';

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 text-sm font-medium">
        🖼️ Image — No URL set
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden" style={{ backgroundColor: bgColor, borderRadius }}>
      <img
        src={url}
        alt={content.image_alt || 'Image'}
        className="h-full w-full"
        style={{ objectFit: objectFit as React.CSSProperties['objectFit'] }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );
});

// ─── ActionButton Preview ──────────────────────────────────
const ActionButtonPreview = memo(function ActionButtonPreview({ data }: { data: PreviewData }) {
  const meta = data.meta ?? {};
  const content = data.content ?? {};
  const buttonText = content.buttonText || meta.buttonText || 'Button';
  const subText = content.subText || '';
  const bgColor = meta.bgColor ?? '#2952cc';
  const textColor = meta.textColor ?? '#ffffff';
  const borderRadius = meta.borderRadius ?? '6px';
  const subTextColor = meta.subTextColor ?? '#1f2937';
  const icon = meta.icon ?? 'cart';

  const iconChar: Record<string, string> = { cart: '🛒', download: '⬇', 'arrow-right': '→', phone: '📞', mail: '✉', external: '↗' };

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="inline-flex flex-col items-center gap-1">
        <span
          className="inline-flex items-center gap-1.5 px-5 py-2 font-bold text-sm"
          style={{ backgroundColor: bgColor, color: textColor, borderRadius }}
        >
          {icon !== 'none' && <span className="text-xs">{iconChar[icon] ?? ''}</span>}
          {buttonText}
        </span>
        {subText && (
          <span className="text-[11px]" style={{ color: subTextColor }}>{subText}</span>
        )}
      </div>
    </div>
  );
});

// ─── Fallback ──────────────────────────────────────────
function FallbackPreview({ data }: { data: PreviewData }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 text-sm font-medium">
      Preview unavailable
    </div>
  );
}

// ─── ProductTabs Preview ──────────────────────────────────
const ProductTabsPreview = memo(function ProductTabsPreview({ data }: { data: PreviewData }) {
  const tabs: PreviewData[] = data.content?.tabs ?? [];
  const enabledTabs = tabs.filter((t: PreviewData) => t.enabled !== false);
  const activeColor: string = (data.meta?.active_color as string) ?? '#2563eb';

  if (enabledTabs.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white text-slate-400 text-sm">
        Product Tabs — No tabs enabled
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-[140px] border-r border-slate-200 bg-slate-50 flex flex-col py-2">
        {enabledTabs.slice(0, 9).map((tab: PreviewData, i: number) => (
          <div
            key={i}
            className="px-3 py-1.5 text-[11px] truncate"
            style={
              i === 0
                ? { color: activeColor, fontWeight: 700, borderLeft: `3px solid ${activeColor}` }
                : { color: '#64748b', borderLeft: '3px solid transparent' }
            }
          >
            {tab.label || 'Untitled'}
          </div>
        ))}
      </div>
      {/* Content placeholder */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-xs font-bold text-slate-600 mb-1">
            {enabledTabs[0]?.label || 'Tab'}
          </div>
          <div className="h-2 w-32 rounded bg-slate-200 mx-auto mb-1" />
          <div className="h-2 w-24 rounded bg-slate-200 mx-auto" />
        </div>
      </div>
    </div>
  );
});

// ─── Registry ───────────────────────────────────────────
const previewRegistry: Record<string, ComponentType<{ data: PreviewData }>> = {
  Banner: BannerPreview,
  CTAButton: CTAButtonPreview,
  Timer: TimerPreview,
  Form: FormPreview,
  RelatedContent: RelatedContentPreview,
  Hero: HeroPreview,
  RichText: RichTextPreview,
  ProductTabs: ProductTabsPreview,
  ProductImageSlider: ProductImageSliderPreview,
  Tag: TagPreview,
  Headline: HeadlinePreview,
  ProductDescription: ProductDescriptionPreview,
  SamplePrice: SamplePricePreview,
  ImageOnly: ImageOnlyPreview,
  ActionButton: ActionButtonPreview,
};

export function getBlockPreview(type: string): ComponentType<{ data: PreviewData }> {
  return previewRegistry[type] ?? FallbackPreview;
}
