'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { useSlider } from '@/hooks/useSlider';
import { useVideoModal } from '@/hooks/useVideoModal';
import { getYouTubeEmbedUrl, getYouTubeThumbnail, isYouTubeUrl } from '@/lib/youtube';
import type {
  RelatedContentData,
  RelatedContentItem,
  RelatedContentMeta,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — RelatedContentBlock
// Covers Blog / Video / Product / CaseStudy with unified card structure.
// For Video: thumbnail auto-derived from YouTube URL, plays in modal popup.
// Only one video plays at a time — modal state lives at this component level.
// ─────────────────────────────────────────────────────────────────────────────

interface RelatedContentBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: RelatedContentMeta = {
  contentType: 'Blog',
  displayCount: 3,
  sliderMode: false,
  showTitle: true,
  showCTA: true,
  ctaLabel: 'Read More',
  cardStyle: { bgColor: '#ffffff', textColor: '#1a1a1a', borderRadius: '8px' },
  width: '100%',
};

// ── Video Modal ──────────────────────────────────────────────────────────────

function VideoModal({
  videoUrl,
  title,
  onClose,
}: {
  videoUrl: string;
  title?: string;
  onClose: () => void;
}) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!embedUrl) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Video'}
    >
      <div className="relative w-full max-w-4xl mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* iframe — mounted only when open, unmounted on close to stop playback */}
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={embedUrl}
            title={title ?? 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full rounded-lg"
          />
        </div>

        {title && (
          <p className="mt-3 text-center text-sm text-white/80">{title}</p>
        )}
      </div>
    </div>
  );
}

// ── Play Button SVG overlay ──────────────────────────────────────────────────

function PlayButtonOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 w-6 text-gray-900 translate-x-0.5"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

function ContentCard({
  item,
  meta,
  isVideo,
  onVideoOpen,
}: {
  item: RelatedContentItem;
  meta: RelatedContentMeta;
  isVideo: boolean;
  onVideoOpen: (url: string) => void;
}) {
  const displayImage =
    item.image_url ??
    (isVideo ? (getYouTubeThumbnail(item.link) ?? undefined) : undefined);

  const ctaText = item.cta_text ?? meta.ctaLabel;

  const cardStyle = {
    backgroundColor: meta.cardStyle.bgColor,
    color: meta.cardStyle.textColor,
    borderRadius: meta.cardStyle.borderRadius,
  };

  const handleClick = () => {
    if (isVideo) onVideoOpen(item.link);
  };

  return (
    <div
      className="overflow-hidden shadow-sm border border-gray-100 flex flex-col transition-shadow hover:shadow-md"
      style={cardStyle}
    >
      {/* Thumbnail */}
      <div
        className={`relative aspect-video w-full overflow-hidden bg-gray-200 ${isVideo ? 'cursor-pointer group' : ''}`}
        onClick={isVideo ? handleClick : undefined}
        role={isVideo ? 'button' : undefined}
        tabIndex={isVideo ? 0 : undefined}
        aria-label={isVideo ? `Play ${item.title ?? 'video'}` : undefined}
        onKeyDown={isVideo ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={item.image_alt || item.title || ''}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => undefined}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-gray-400">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" strokeLinecap="round" />
            </svg>
          </div>
        )}
        {isVideo && <PlayButtonOverlay />}
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {meta.showTitle && item.title && (
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">
            {item.title}
          </h3>
        )}

        {meta.showCTA && (
          <div className="mt-auto">
            {isVideo ? (
              <button
                type="button"
                onClick={handleClick}
                className="text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              >
                {ctaText}
              </button>
            ) : (
              <Link
                href={item.link}
                className="text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              >
                {ctaText}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RelatedContentBlock({ data }: RelatedContentBlockProps) {
  const parsed = data as unknown as RelatedContentData;
  const meta: RelatedContentMeta = { ...DEFAULT_META, ...parsed.meta };
  const allItems: RelatedContentItem[] = parsed.content?.items ?? [];
  const isVideo = meta.contentType === 'Video';

  // Video modal state — lifted here so only one video plays at a time
  const { activeVideoUrl, isOpen: isModalOpen, open: openVideo, close: closeVideo } = useVideoModal();

  // Slider state — only used when sliderMode is enabled
  const { activeIndex, goTo, next, prev, pause } = useSlider(
    allItems.length,
    0, // no autoplay on content cards
  );

  // When in slider mode, show a window of displayCount items starting at activeIndex
  const visibleItems = meta.sliderMode
    ? (() => {
        const result: RelatedContentItem[] = [];
        for (let i = 0; i < meta.displayCount; i++) {
          const idx = (activeIndex + i) % allItems.length;
          if (allItems[idx]) result.push(allItems[idx]!);
        }
        return result;
      })()
    : allItems.slice(0, meta.displayCount);

  if (allItems.length === 0) return null;

  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const canSlide = meta.sliderMode && allItems.length > meta.displayCount;

  // Find the title of the active video for the modal
  const activeVideoItem = activeVideoUrl
    ? allItems.find((item) => item.link === activeVideoUrl)
    : null;

  return (
    <div className="w-full" style={{ width: meta.width }}>
      <div className="relative">
        {/* Cards grid */}
        <div className={`grid gap-5 ${gridCols[meta.displayCount] ?? 'grid-cols-3'}`}>
          {visibleItems.map((item, i) => (
            <ContentCard
              key={`${item.link}-${i}`}
              item={item}
              meta={meta}
              isVideo={isVideo}
              onVideoOpen={(url) => {
                pause();
                openVideo(url);
              }}
            />
          ))}
        </div>

        {/* Slider navigation */}
        {canSlide && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => { pause(); prev(); }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-500 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: allItems.length }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to item ${i + 1}`}
                  onClick={() => { pause(); goTo(i); }}
                  className={`h-2 rounded-full transition-all ${
                    i >= activeIndex && i < activeIndex + meta.displayCount
                      ? 'w-4 bg-gray-700'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next"
              onClick={() => { pause(); next(); }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-gray-500 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Video modal — rendered once at this level; iframe unmounted when closed */}
      {isModalOpen && activeVideoUrl && isYouTubeUrl(activeVideoUrl) && (
        <VideoModal
          videoUrl={activeVideoUrl}
          title={activeVideoItem?.title}
          onClose={closeVideo}
        />
      )}
    </div>
  );
}
