import { useSlider } from '../../../hooks/useSlider';
import type { BannerData, BannerMeta, BannerSlide } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills actual slide data
// meta{} is shown read-only for context; only content{} is editable here
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: BannerMeta = {
  width: '100%',
  height: '480px',
  bgColor: '#000000',
  variant: 'type2',
  sliderMode: false,
  autoplayInterval: 5000,
  ctaPosition: 'bottom-left',
  ctaStyle: { bgColor: '#e63329', textColor: '#ffffff', borderRadius: '4px', fontSize: '16px' },
};

const EMPTY_SLIDE: BannerSlide = {
  image_url: '',
  image_alt: '',
  href: '',
  title: '',
  description: '',
  cta_text: '',
  cta_link: '',
};

function fi(label: string, value: string, onChange: (v: string) => void, placeholder?: string) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <input
        className="rounded border border-gray-300 px-3 py-2 text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function BannerBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as BannerData;
  const meta: BannerMeta = { ...DEFAULT_META, ...data.meta };
  const slides: BannerSlide[] = data.content?.slides ?? [{ ...EMPTY_SLIDE }];
  const { activeIndex, goTo } = useSlider(slides.length);

  function updateSlide(index: number, patch: Partial<BannerSlide>) {
    const updated = slides.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...data, content: { slides: updated } });
  }

  function addSlide() {
    onChange({ ...data, content: { slides: [...slides, { ...EMPTY_SLIDE }] } });
  }

  function removeSlide(index: number) {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== index);
    onChange({ ...data, content: { slides: updated } });
    if (activeIndex >= updated.length) goTo(updated.length - 1);
  }

  const slide = slides[activeIndex] ?? EMPTY_SLIDE;
  const isType2 = meta.variant === 'type2';

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Variant:</strong> {meta.variant}</span>
        <span><strong>Size:</strong> {meta.width} × {meta.height}</span>
        <span><strong>Slider:</strong> {meta.sliderMode ? `yes (${meta.autoplayInterval}ms)` : 'no'}</span>
      </div>

      {/* Slide tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
              i === activeIndex
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            Slide {i + 1}
          </button>
        ))}
        <button
          type="button"
          onClick={addSlide}
          className="px-3 py-1 rounded text-xs font-medium border border-dashed border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          + Add Slide
        </button>
      </div>

      {/* Active slide editor */}
      <div className="border border-gray-200 rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Slide {activeIndex + 1}</span>
          <button
            type="button"
            onClick={() => removeSlide(activeIndex)}
            disabled={slides.length <= 1}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30"
          >
            Remove
          </button>
        </div>

        {fi('Image URL *', slide.image_url, (v) => updateSlide(activeIndex, { image_url: v }), 'https://…')}
        {fi('Image Alt Text *', slide.image_alt, (v) => updateSlide(activeIndex, { image_alt: v }), 'Describe the image')}

        {/* type1: only href */}
        {!isType2 && fi('Link (href)', slide.href ?? '', (v) => updateSlide(activeIndex, { href: v }), 'https://…')}

        {/* type2: content fields */}
        {isType2 && (
          <>
            {fi('Title', slide.title ?? '', (v) => updateSlide(activeIndex, { title: v }))}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-600">Description</span>
              <textarea
                className="rounded border border-gray-300 px-3 py-2 text-sm resize-none"
                rows={3}
                value={slide.description ?? ''}
                onChange={(e) => updateSlide(activeIndex, { description: e.target.value })}
              />
            </label>
            {fi('CTA Button Text', slide.cta_text ?? '', (v) => updateSlide(activeIndex, { cta_text: v }), 'Learn More')}
            {fi('CTA Button Link', slide.cta_link ?? '', (v) => updateSlide(activeIndex, { cta_link: v }), 'https://…')}
          </>
        )}

        {/* Thumbnail preview */}
        {slide.image_url && (
          <div className="mt-2">
            <span className="text-xs text-gray-500">Preview:</span>
            <img
              src={slide.image_url}
              alt={slide.image_alt || 'preview'}
              className="mt-1 max-h-32 rounded border object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
