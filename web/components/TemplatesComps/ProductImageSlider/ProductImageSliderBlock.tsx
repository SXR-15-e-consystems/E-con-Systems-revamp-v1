'use client';

import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';

import { sanitizeUrl } from '@/lib/security';
import type {
  ProductImageSliderData,
  ProductImageSliderMeta,
  ProductImageSlide,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — ProductImageSliderBlock
// Displays a main product image with thumbnail navigation strip.
// Clicking a thumbnail previews that image full-size.
// Hover zoom disabled on touch / narrow screens.
// ─────────────────────────────────────────────────────────────────────────────

interface ProductImageSliderBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: ProductImageSliderMeta = {
  width: '100%',
  height: '480px',
  bgColor: '#ffffff',
  thumbnailPosition: 'left',
  thumbnailSize: 72,
  borderColor: '#2563eb',
};

export function ProductImageSliderBlock({ data }: ProductImageSliderBlockProps) {
  const raw = data as unknown as ProductImageSliderData;
  const meta: ProductImageSliderMeta = { ...DEFAULT_META, ...raw.meta };
  const slides: ProductImageSlide[] = raw.content?.slides ?? [];
  const [activeIndex, setActiveIndex] = useState(0);

  // Zoom state
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const ZOOM_LEVEL = 2.5;

  // Track whether device can hover (i.e. not touch-only)
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover) and (min-width: 768px)').matches);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < slides.length) {
        setActiveIndex(index);
      }
    },
    [slides.length],
  );

  // Bounding rect for fixed-positioning the zoom panel next to the image
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    setContainerRect(rect);
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHover) return;
    setContainerRect(e.currentTarget.getBoundingClientRect());
    setIsZooming(true);
  }, [canHover]);
  const handleMouseLeave = useCallback(() => setIsZooming(false), []);

  // Responsive height: clamp configured height for smaller viewports
  const heightPx = parseInt(meta.height);
  const responsiveHeight = heightPx
    ? `clamp(${Math.round(heightPx * 0.5)}px, 60vw, ${heightPx}px)`
    : meta.height;

  // Responsive thumbnail size: scale down on narrow screens
  const thumbSize = meta.thumbnailSize;
  const responsiveThumbSize = typeof window !== 'undefined' ? thumbSize : thumbSize;

  if (slides.length === 0) {
    return (
      <section
        className="flex items-center justify-center text-slate-400"
        style={{ width: meta.width, height: responsiveHeight, backgroundColor: meta.bgColor }}
      >
        No product images available
      </section>
    );
  }

  const activeSlide = slides[activeIndex] ?? slides[0];
  const safeImageUrl = sanitizeUrl(activeSlide.image_url, false);
  const isVertical = meta.thumbnailPosition === 'left';

  return (
    <section
      className="w-full"
      style={{
        width: meta.width,
        maxWidth: '100%',
        backgroundColor: meta.bgColor,
      }}
    >
      <div
        className={`flex ${isVertical ? 'flex-col sm:flex-row' : 'flex-col'} gap-2 sm:gap-3`}
        style={{ height: responsiveHeight }}
      >
        {/* Thumbnail strip — stacks horizontally on mobile when isVertical */}
        <div
          className={`flex gap-1.5 sm:gap-2 ${
            isVertical
              ? 'flex-row overflow-x-auto sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto py-1 px-1'
              : 'flex-row overflow-x-auto px-1 py-1'
          }`}
          style={
            isVertical
              ? { flexShrink: 0 }
              : { height: thumbSize + 16, flexShrink: 0 }
          }
        >
          {slides.map((slide, i) => {
            const thumbUrl = sanitizeUrl(slide.image_url, false);
            const isActive = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className="flex-shrink-0 rounded overflow-hidden cursor-pointer transition-all duration-200 hover:opacity-90"
                style={{
                  width: `clamp(48px, 8vw, ${thumbSize}px)`,
                  height: `clamp(48px, 8vw, ${thumbSize}px)`,
                  border: isActive
                    ? `3px solid ${meta.borderColor}`
                    : '2px solid #d1d5db',
                  opacity: isActive ? 1 : 0.7,
                }}
                aria-label={`View image ${i + 1}: ${slide.image_alt || 'Product image'}`}
              >
                {thumbUrl ? (
                  <Image
                    src={thumbUrl}
                    alt={slide.image_alt || `Product thumbnail ${i + 1}`}
                    width={thumbSize}
                    height={thumbSize}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-400">
                    {i + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Main image display with Amazon-style hover zoom (desktop only) */}
        <div className="flex-1 relative min-h-0 min-w-0">
          <div
            ref={imageContainerRef}
            className={`relative flex items-start justify-start h-full w-full overflow-hidden p-2 sm:p-4 ${canHover ? 'cursor-crosshair' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={canHover ? handleMouseMove : undefined}
          >
            {safeImageUrl ? (
              <>
                {/* Normal image */}
                <Image
                  src={safeImageUrl}
                  alt={activeSlide.image_alt || 'Product image'}
                  width={800}
                  height={600}
                  className="max-h-full max-w-full object-contain border-2 border-gray-300 rounded shadow-lg"
                  style={{ opacity: isZooming ? 0.4 : 1, transition: 'opacity 0.15s ease' }}
                  priority={activeIndex === 0}
                  unoptimized
                />

                {/* Zoom lens indicator on main image */}
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
              <div className="flex items-center justify-center text-slate-400">
                Image not available
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Zoom popup — fixed position, adapts to available space */}
      {isZooming && canHover && safeImageUrl && containerRect && (() => {
        const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const spaceRight = viewportW - containerRect.right - 24;
        const hasRoom = spaceRight >= containerRect.width * 0.5;

        return hasRoom ? (
          <div
            className="fixed z-[9999] border-2 border-gray-300 rounded-lg shadow-2xl overflow-hidden bg-white pointer-events-none"
            style={{
              top: containerRect.top,
              left: containerRect.right + 12,
              width: Math.min(containerRect.width, spaceRight),
              height: containerRect.height,
            }}
          >
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${safeImageUrl})`,
                backgroundSize: `${ZOOM_LEVEL * 100}%`,
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        ) : (
          /* Overlay zoom when no room to the right */
          <div
            className="fixed z-[9999] inset-0 pointer-events-none flex items-center justify-center"
          >
            <div
              className="w-[80vw] h-[80vh] max-w-xl border-2 border-gray-300 rounded-lg shadow-2xl overflow-hidden bg-white"
              style={{
                backgroundImage: `url(${safeImageUrl})`,
                backgroundSize: `${ZOOM_LEVEL * 100}%`,
                backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        );
      })()}
    </section>
  );
}
