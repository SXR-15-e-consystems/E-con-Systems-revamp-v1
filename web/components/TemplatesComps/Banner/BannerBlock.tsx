'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';

import { useSlider } from '@/hooks/useSlider';
import type { BannerData, BannerMeta, BannerSlide, CTAPosition } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — BannerBlock
// Supports type1 (image + link) and type2 (image + title + description + CTA)
// with optional slider mode and autoplay.
// ─────────────────────────────────────────────────────────────────────────────

interface BannerBlockProps {
  data: Record<string, unknown>;
}

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

function ctaPositionClasses(position: CTAPosition): string {
  const map: Record<CTAPosition, string> = {
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };
  return map[position] ?? 'bottom-6 left-6';
}

function SlideContent({ slide, meta }: { slide: BannerSlide; meta: BannerMeta }) {
  const isType2 = meta.variant === 'type2';

  const inner = (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: meta.height, backgroundColor: meta.bgColor }}
    >
      {/* Background image */}
      {slide.image_url ? (
        <Image
          src={slide.image_url}
          alt={slide.image_alt || 'Banner Image'}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-200" />
      )}

      {/* type2 overlay content */}
      {isType2 && (slide.title || slide.description || slide.cta_text) && (
        <div
          className={`absolute ${ctaPositionClasses(meta.ctaPosition)} max-w-sm z-10`}
        >
          {slide.title && (
            <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-2">
              {slide.title}
            </h2>
          )}
          {slide.description && (
            <p className="text-sm text-white/90 drop-shadow mb-4">
              {slide.description}
            </p>
          )}
          {slide.cta_text && slide.cta_link && (
            <Link
              href={slide.cta_link}
              style={{
                backgroundColor: meta.ctaStyle.bgColor,
                color: meta.ctaStyle.textColor,
                borderRadius: meta.ctaStyle.borderRadius,
                fontSize: meta.ctaStyle.fontSize,
              }}
              className="inline-block font-semibold px-5 py-2.5 shadow transition-opacity hover:opacity-90"
            >
              {slide.cta_text}
            </Link>
          )}
        </div>
      )}
    </div>
  );

  // type1: wrap entire slide in a link
  if (meta.variant === 'type1' && slide.href) {
    return (
      <Link href={slide.href} className="block" aria-label={slide.image_alt}>
        {inner}
      </Link>
    );
  }

  return inner;
}

function SliderDots({
  count,
  activeIndex,
  onGoTo,
}: {
  count: number;
  activeIndex: number;
  onGoTo: (i: number) => void;
}) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onGoTo(i)}
          className={`h-2 rounded-full transition-all ${
            i === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
          }`}
        />
      ))}
    </div>
  );
}

export function BannerBlock({ data }: BannerBlockProps) {
  const parsed = data as unknown as BannerData;
  const meta: BannerMeta = { ...DEFAULT_META, ...parsed.meta };
  const slides: BannerSlide[] = parsed.content?.slides ?? [];

  const { activeIndex, goTo, next, prev, pause } = useSlider(
    slides.length,
    meta.sliderMode ? meta.autoplayInterval : 0,
  );

  // Pause autoplay on user slide interaction
  useEffect(() => {
    // Intentionally empty — pause() is called in button handlers
  }, []);

  if (slides.length === 0) return null;

  const showSlider = meta.sliderMode && slides.length > 1;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ width: meta.width }}
      aria-roledescription="banner"
    >
      {/* Render only active slide */}
      <SlideContent slide={slides[activeIndex]!} meta={meta} />

      {/* Slider controls */}
      {showSlider && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => { pause(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => { pause(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <SliderDots count={slides.length} activeIndex={activeIndex} onGoTo={(i) => { pause(); goTo(i); }} />
        </>
      )}
    </div>
  );
}
