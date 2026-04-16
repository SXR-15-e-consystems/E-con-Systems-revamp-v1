'use client';

import { useState } from 'react';
import Image from 'next/image';

import { sanitizeUrl } from '@/lib/security';
import { getYouTubeThumbnail, getYouTubeEmbedUrl } from '@/lib/youtube';
import type { VideoGalleryData, VideoGalleryMeta, VideoGalleryContent } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — VideoGalleryBlock
// Grid or slider of video cards. Auto-fetches YouTube thumbnails from URL.
// Uses the same red/white play button as RelatedContent video section.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: VideoGalleryMeta = {
  bgColor: '#ffffff',
  columns: 3,
  layout: 'grid',
  headingAlign: 'left',
  cardAlign: 'left',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  titleColor: '#1f2937',
  width: '100%',
  headingColor: '#111827',
};

const GRID_CLASS: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
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
  2: 'calc(50% - 12px)',
  3: 'calc(33.333% - 16px)',
  4: 'calc(25% - 18px)',
  5: 'calc(20% - 19.2px)',
};

const CARD_WIDTH_SM = 'calc(50% - 12px)';

/** Red/white YouTube play button — responsive sizing */
function PlayButtonOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-10 h-7 sm:w-[52px] sm:h-[36px] md:w-[68px] md:h-[48px] rounded-lg sm:rounded-xl bg-[#FF0000] flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

function VideoModal({ embedUrl, onClose }: { embedUrl: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-2xl font-bold hover:text-gray-300"
          aria-label="Close video"
        >
          ✕
        </button>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video player"
          />
        </div>
      </div>
    </div>
  );
}

interface VideoGalleryBlockProps {
  data: Record<string, unknown>;
}

export function VideoGalleryBlock({ data }: VideoGalleryBlockProps) {
  const [activeEmbed, setActiveEmbed] = useState<string | null>(null);
  const [sliderIndex, setSliderIndex] = useState(0);

  const raw = data as unknown as VideoGalleryData;
  const meta: VideoGalleryMeta = { ...DEFAULT_META, ...raw.meta };
  const content: VideoGalleryContent = { ...{ heading: '', items: [] as VideoGalleryContent['items'] }, ...raw.content };

  const items = content.items;
  if (!items.length) return null;

  const isSlider = meta.layout === 'slider';
  const cols = meta.columns;
  const gridClass = GRID_CLASS[cols] ?? GRID_CLASS[3];
  const headingClass = HEADING_ALIGN[meta.headingAlign] ?? 'text-left';

  // Slider calculations
  const maxSliderIndex = Math.max(0, items.length - cols);
  const itemWidthPercent = 100 / cols;
  const showNav = isSlider && items.length > cols;

  function openVideo(videoUrl: string) {
    const embed = getYouTubeEmbedUrl(videoUrl);
    if (embed) {
      setActiveEmbed(embed);
    } else {
      const sanitized = sanitizeUrl(videoUrl);
      if (sanitized) setActiveEmbed(sanitized);
    }
  }

  function renderCard(item: (typeof items)[number], index: number) {
    // Auto-derive thumbnail from YouTube URL if thumbnail_url is empty
    const manualThumb = sanitizeUrl(item.thumbnail_url);
    const autoThumb = getYouTubeThumbnail(item.video_url);
    const thumbSrc = manualThumb || autoThumb || '';

    return (
      <button
        key={index}
        type="button"
        onClick={() => openVideo(item.video_url)}
        className="group block w-full text-left overflow-hidden transition-shadow hover:shadow-lg"
        style={{
          backgroundColor: meta.cardBgColor,
          borderRadius: meta.cardBorderRadius,
          border: '1px solid #e5e7eb',
        }}
      >
        {/* Thumbnail with play overlay */}
        <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt={item.title || 'Video thumbnail'}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <span className="text-xs text-gray-400">No thumbnail</span>
            </div>
          )}
          <PlayButtonOverlay />
        </div>

        {/* Card body */}
        <div className="p-4">
          {item.title && (
            <h3
              className="font-semibold text-sm leading-snug"
              style={{ color: meta.titleColor }}
            >
              {item.title}
            </h3>
          )}
          {item.subtitle && (
            <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
          )}
        </div>
      </button>
    );
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
        {content.heading && (
          <h2
            className={`text-2xl font-bold mb-8 ${headingClass}`}
            style={{ color: meta.headingColor }}
          >
            {content.heading}
          </h2>
        )}

        {isSlider ? (
          /* ── Slider layout ── */
          <div className="relative">
            {showNav && (
              <button
                onClick={() => setSliderIndex((i) => Math.max(0, i - 1))}
                disabled={sliderIndex === 0}
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
                className="flex transition-transform duration-500 ease-in-out gap-4"
                style={{ transform: `translateX(-${sliderIndex * itemWidthPercent}%)` }}
              >
                {items.map((item, i) => (
                  <div key={i} className="flex-shrink-0" style={{ width: `calc(${itemWidthPercent}% - 12px)` }}>
                    {renderCard(item, i)}
                  </div>
                ))}
              </div>
            </div>

            {showNav && (
              <button
                onClick={() => setSliderIndex((i) => Math.min(maxSliderIndex, i + 1))}
                disabled={sliderIndex >= maxSliderIndex}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 transition-opacity disabled:opacity-30"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          /* ── Grid layout ── */
          meta.cardAlign === 'left' ? (
            <div className={`grid gap-6 ${gridClass}`}>
              {items.map((item, i) => renderCard(item, i))}
            </div>
          ) : (
          <>
            <style>{`
              .vg-card-wrap { width: 100%; }
              @media (min-width: 640px) { .vg-card-wrap { width: ${CARD_WIDTH_SM}; } }
              @media (min-width: 1024px) { .vg-card-wrap { width: ${CARD_WIDTH[cols] ?? CARD_WIDTH[3]}; } }
            `}</style>
            <div
              className="flex flex-wrap gap-6"
              style={{ justifyContent: FLEX_JUSTIFY[meta.cardAlign] ?? 'flex-start' }}
            >
              {items.map((item, i) => (
                <div key={i} className="vg-card-wrap">
                  {renderCard(item, i)}
                </div>
              ))}
            </div>
          </>
          )
        )}
      </div>

      {activeEmbed && (
        <VideoModal embedUrl={activeEmbed} onClose={() => setActiveEmbed(null)} />
      )}
    </section>
  );
}
