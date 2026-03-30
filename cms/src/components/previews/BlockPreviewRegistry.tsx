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
};

export function getBlockPreview(type: string): ComponentType<{ data: PreviewData }> {
  return previewRegistry[type] ?? FallbackPreview;
}
