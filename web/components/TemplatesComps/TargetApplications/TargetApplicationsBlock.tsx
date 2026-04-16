'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { sanitizeUrl } from '@/lib/security';
import type { TargetApplicationsData, TargetApplicationsMeta, TargetApplicationsContent } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — TargetApplicationsBlock
// Grid or slider carousel of application cards with optional autoplay.
// Navigation arrows hidden when items fit on screen.
// ─────────────────────────────────────────────────────────────────────────────

interface TargetApplicationsBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: TargetApplicationsMeta = {
  bgColor: '#ffffff',
  cardBorderRadius: '8px',
  captionColor: '#1f2937',
  columns: 4,
  layout: 'grid',
  headingAlign: 'center',
  autoplay: false,
  autoplayInterval: 4000,
  width: '100%',
  headingColor: '#111827',
  cardAlign: 'center',
};

const GRID_CLASS: Record<number, string> = {
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
};

const HEADING_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const FLEX_JUSTIFY: Record<string, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

const CARD_WIDTH: Record<number, string> = {
  3: 'calc(33.333% - 16px)',
  4: 'calc(25% - 18px)',
  5: 'calc(20% - 19.2px)',
};

const CARD_WIDTH_SM = 'calc(50% - 12px)';

export function TargetApplicationsBlock({ data }: TargetApplicationsBlockProps) {
  const raw = data as unknown as TargetApplicationsData;
  const meta: TargetApplicationsMeta = { ...DEFAULT_META, ...raw.meta };
  const content: TargetApplicationsContent = {
    ...{ heading: '', items: [] } as TargetApplicationsContent,
    ...raw.content,
  };

  const items = content.items ?? [];
  const heading = content.heading ?? '';
  const cols = meta.columns;
  const isSlider = meta.layout === 'slider';
  const headingClass = HEADING_ALIGN[meta.headingAlign] ?? 'text-center';

  const [currentIndex, setCurrentIndex] = useState(0);

  // Responsive visible count for slider: 1 on mobile, 2 on sm, meta.columns on md+
  const [visibleCount, setVisibleCount] = useState<number>(cols);

  useEffect(() => {
    if (!isSlider) return;
    function handleResize() {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(1);
      else if (w < 768) setVisibleCount(2);
      else setVisibleCount(cols);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cols, isSlider]);

  const maxIndex = Math.max(0, items.length - visibleCount);
  const itemWidthPercent = 100 / visibleCount;

  // Only show navigation when there are more items than visible slots
  const showNav = isSlider && items.length > visibleCount;

  // Clamp currentIndex when visibleCount changes
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => Math.min(maxIndex, i + 1));
  }, [maxIndex]);

  // Autoplay (only in slider mode)
  useEffect(() => {
    if (!isSlider || !meta.autoplay || meta.autoplayInterval <= 0 || !showNav) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, meta.autoplayInterval);
    return () => clearInterval(timer);
  }, [isSlider, meta.autoplay, meta.autoplayInterval, maxIndex, showNav]);

  if (!heading && items.length === 0) return null;

  function renderCard(item: (typeof items)[number], index: number) {
    const imageUrl = sanitizeUrl(item.image_url);
    const linkUrl = sanitizeUrl(item.link);
    const alt = item.image_alt || item.caption || 'Application image';

    const card = (
      <div className="flex flex-col items-center gap-3">
        <div
          className="relative w-full aspect-square overflow-hidden"
          style={{ borderRadius: meta.cardBorderRadius }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className="object-cover"
              sizes={`(max-width: 640px) 100vw, (max-width: 768px) 50vw, ${Math.round(100 / cols)}vw`}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm text-gray-400">No image</span>
            </div>
          )}
        </div>
        {item.caption && (
          <span
            className="text-sm font-medium text-center"
            style={{ color: meta.captionColor }}
          >
            {item.caption}
          </span>
        )}
      </div>
    );

    if (linkUrl) {
      return (
        <Link key={index} href={linkUrl} className="block hover:opacity-80 transition-opacity">
          {card}
        </Link>
      );
    }
    return <div key={index}>{card}</div>;
  }

  return (
    <section
      style={{
        width: meta.width,
        maxWidth: '100%',
        backgroundColor: meta.bgColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {heading && (
          <h2
            className={`text-2xl font-bold mb-8 sm:text-3xl ${headingClass}`}
            style={{ color: meta.headingColor }}
          >
            {heading}
          </h2>
        )}

        {items.length > 0 && isSlider ? (
          /* ── Slider layout ── */
          <div className="relative">
            {showNav && (
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 transition-opacity disabled:opacity-30"
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * itemWidthPercent}%)` }}
              >
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 px-2"
                    style={{ width: `${itemWidthPercent}%` }}
                  >
                    {renderCard(item, i)}
                  </div>
                ))}
              </div>
            </div>

            {showNav && (
              <button
                onClick={next}
                disabled={currentIndex >= maxIndex}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 transition-opacity disabled:opacity-30"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        ) : items.length > 0 ? (
          /* ── Grid layout ── */
          meta.cardAlign === 'left' ? (
            <div className={`grid gap-6 ${GRID_CLASS[cols] ?? GRID_CLASS[4]}`}>
              {items.map((item, i) => renderCard(item, i))}
            </div>
          ) : (
            <>
              <style>{`
                .ta-card-wrap { width: 100%; }
                @media (min-width: 640px) { .ta-card-wrap { width: ${CARD_WIDTH_SM}; } }
                @media (min-width: 1024px) { .ta-card-wrap { width: ${CARD_WIDTH[cols] ?? CARD_WIDTH[4]}; } }
              `}</style>
              <div
                className="flex flex-wrap gap-6"
                style={{ justifyContent: FLEX_JUSTIFY[meta.cardAlign] ?? 'flex-start' }}
              >
                {items.map((item, i) => (
                  <div key={i} className="ta-card-wrap">
                    {renderCard(item, i)}
                  </div>
                ))}
              </div>
            </>
          )
        ) : null}
      </div>
    </section>
  );
}
