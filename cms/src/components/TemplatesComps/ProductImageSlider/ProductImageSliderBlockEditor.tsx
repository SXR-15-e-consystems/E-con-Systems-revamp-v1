import { useState, useCallback } from 'react';
import type {
  ProductImageSliderData,
  ProductImageSliderMeta,
  ProductImageSlide,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills actual image slide data
// meta{} is shown read-only for context; only content{} is editable here
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ProductImageSliderMeta = {
  width: '100%',
  height: '480px',
  bgColor: '#ffffff',
  thumbnailPosition: 'left',
  thumbnailSize: 72,
  borderColor: '#2563eb',
};

const EMPTY_SLIDE: ProductImageSlide = {
  image_url: '',
  image_alt: '',
};

export function ProductImageSliderBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ProductImageSliderData;
  const meta: ProductImageSliderMeta = { ...DEFAULT_META, ...data.meta };
  const slides: ProductImageSlide[] = data.content?.slides ?? [{ ...EMPTY_SLIDE }];
  const [activeIndex, setActiveIndex] = useState(0);

  // Zoom state
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const ZOOM_LEVEL = 2.5;

  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    setContainerRect(rect);
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setContainerRect(e.currentTarget.getBoundingClientRect());
    setIsZooming(true);
  }, []);
  const handleMouseLeave = useCallback(() => setIsZooming(false), []);

  function safeIndex(idx: number, length: number): number {
    return Math.max(0, Math.min(idx, length - 1));
  }

  function updateSlide(index: number, patch: Partial<ProductImageSlide>) {
    const updated = slides.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...data, content: { slides: updated } });
  }

  function addSlide() {
    const updated = [...slides, { ...EMPTY_SLIDE }];
    onChange({ ...data, content: { slides: updated } });
    setActiveIndex(updated.length - 1);
  }

  function removeSlide(index: number) {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== index);
    onChange({ ...data, content: { slides: updated } });
    setActiveIndex(safeIndex(activeIndex, updated.length));
  }

  function moveSlide(from: number, to: number) {
    if (to < 0 || to >= slides.length) return;
    const updated = [...slides];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange({ ...data, content: { slides: updated } });
    setActiveIndex(to);
  }

  const slide = slides[activeIndex] ?? EMPTY_SLIDE;

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Size:</strong> {meta.width} × {meta.height}</span>
        <span><strong>Thumbnails:</strong> {meta.thumbnailPosition} ({meta.thumbnailSize}px)</span>
        <span>
          <strong>Active border:</strong>{' '}
          <span
            className="inline-block h-3 w-3 rounded-sm border align-middle"
            style={{ backgroundColor: meta.borderColor }}
          />
        </span>
      </div>

      {/* Thumbnail strip + main preview */}
      <div className="rounded border border-gray-200 bg-gray-50 p-3">
        <span className="text-xs font-semibold text-gray-500 mb-2 block">Live Preview</span>
        <div
          className={`flex gap-3 ${meta.thumbnailPosition === 'bottom' ? 'flex-col' : 'flex-row'}`}
          style={{ minHeight: 200 }}
        >
          {/* Thumbnail column / row */}
          <div
            className={`flex gap-2 ${
              meta.thumbnailPosition === 'bottom' ? 'flex-row overflow-x-auto' : 'flex-col overflow-y-auto'
            }`}
            style={
              meta.thumbnailPosition === 'left'
                ? { width: meta.thumbnailSize + 8, minWidth: meta.thumbnailSize + 8 }
                : {}
            }
          >
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className="flex-shrink-0 rounded overflow-hidden transition-all"
                style={{
                  width: meta.thumbnailSize,
                  height: meta.thumbnailSize,
                  border: i === activeIndex
                    ? `3px solid ${meta.borderColor}`
                    : '2px solid #d1d5db',
                }}
              >
                {s.image_url ? (
                  <img
                    src={s.image_url}
                    alt={s.image_alt || `Thumb ${i + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-[10px] text-slate-400">
                    {i + 1}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Main image preview with zoom */}
          <div className="flex-1 relative min-h-[180px]">
            <div
              className="relative flex items-center justify-center rounded bg-white h-full w-full cursor-crosshair"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
            >
              {slide.image_url ? (
                <>
                  <img
                    src={slide.image_url}
                    alt={slide.image_alt || `Slide ${activeIndex + 1}`}
                    className="max-h-[300px] max-w-full object-contain border-2 border-gray-300 rounded shadow-lg"
                    style={{ opacity: isZooming ? 0.4 : 1, transition: 'opacity 0.15s ease' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  {isZooming && (
                    <div
                      className="absolute pointer-events-none border-2 border-blue-400/60 bg-blue-100/20 rounded"
                      style={{
                        width: `${100 / ZOOM_LEVEL}%`,
                        height: `${100 / ZOOM_LEVEL}%`,
                        left: `${Math.max(0, Math.min(100 - 100 / ZOOM_LEVEL, zoomPos.x - 100 / ZOOM_LEVEL / 2))}%`,
                        top: `${Math.max(0, Math.min(100 - 100 / ZOOM_LEVEL, zoomPos.y - 100 / ZOOM_LEVEL / 2))}%`,
                      }}
                    />
                  )}
                </>
              ) : (
                <span className="text-sm text-slate-400">No image — add URL below</span>
              )}
            </div>

          </div>

          {/* Zoom popup — fixed so it can't be clipped by parent overflow */}
          {isZooming && slide.image_url && containerRect && (
            <div
              className="fixed z-[9999] border-2 border-gray-300 rounded-lg shadow-2xl overflow-hidden bg-white pointer-events-none"
              style={{
                top: containerRect.top,
                left: containerRect.right + 12,
                width: containerRect.width,
                height: containerRect.height,
                maxWidth: 400,
                maxHeight: 400,
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${slide.image_url})`,
                  backgroundSize: `${ZOOM_LEVEL * 100}%`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Slide tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveSlide(activeIndex, activeIndex - 1)}
              disabled={activeIndex === 0}
              className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-30"
              title="Move left"
            >
              ← Move
            </button>
            <button
              type="button"
              onClick={() => moveSlide(activeIndex, activeIndex + 1)}
              disabled={activeIndex === slides.length - 1}
              className="text-xs text-gray-500 hover:text-blue-600 disabled:opacity-30"
              title="Move right"
            >
              Move →
            </button>
            <button
              type="button"
              onClick={() => removeSlide(activeIndex)}
              disabled={slides.length <= 1}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Image URL *</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={slide.image_url}
            placeholder="https://…"
            onChange={(e) => updateSlide(activeIndex, { image_url: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Image Alt Text *</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={slide.image_alt}
            placeholder="Describe the image"
            onChange={(e) => updateSlide(activeIndex, { image_alt: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
