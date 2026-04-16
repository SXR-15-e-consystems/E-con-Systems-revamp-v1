'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { useVideoModal } from '@/hooks/useVideoModal';
import { sanitizeUrl } from '@/lib/security';
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus close button when modal opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

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
          ref={closeButtonRef}
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
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-10 h-7 sm:w-[52px] sm:h-[36px] md:w-[68px] md:h-[48px] rounded-lg md:rounded-xl bg-[#FF0000] flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}

// ── Video Card (vertical: full thumbnail + play + title) ─────────────────

function VideoCard({
  item,
  onVideoOpen,
}: {
  item: RelatedContentItem;
  onVideoOpen: (url: string) => void;
}) {
  const thumbSrc = item.image_url || getYouTubeThumbnail(item.link) || '';

  return (
    <button
      type="button"
      onClick={() => onVideoOpen(item.link)}
      className="group block w-full rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left bg-white"
    >
      <div className="relative aspect-video w-full bg-gray-100">
        {thumbSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbSrc}
            alt={item.image_alt || item.title || 'Video thumbnail'}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-400">No thumbnail</span>
          </div>
        )}
        <PlayButtonOverlay />
      </div>
      {item.title && (
        <div className="px-3 py-2.5">
          <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {item.title}
          </p>
        </div>
      )}
    </button>
  );
}

// ── Article / Blog Card (horizontal: small thumb + category + title) ─────

function ArticleCard({ item }: { item: RelatedContentItem }) {
  const safeLink = sanitizeUrl(item.link) || '#';

  return (
    <Link
      href={safeLink}
      className="flex items-start gap-3 rounded-lg border border-gray-200 p-2.5 hover:border-blue-300 hover:shadow-sm transition-all bg-white group"
    >
      {item.image_url && (
        <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
          <Image
            src={item.image_url}
            alt={item.image_alt || item.title || ''}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
      <div className="flex flex-col justify-center min-w-0 flex-1 gap-0.5">
        {item.category && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            {item.category}
          </span>
        )}
        {item.title && (
          <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {item.title}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Generic Card (Product / CaseStudy) ───────────────────────────────────

function GenericCard({
  item,
  meta,
}: {
  item: RelatedContentItem;
  meta: RelatedContentMeta;
}) {
  const safeLink = sanitizeUrl(item.link) || '#';
  const ctaText = item.cta_text ?? meta.ctaLabel;

  return (
    <div className="overflow-hidden rounded-lg shadow-sm border border-gray-100 flex flex-col transition-shadow hover:shadow-md bg-white">
      {item.image_url && (
        <div className="relative aspect-video w-full bg-gray-200">
          <Image
            src={item.image_url}
            alt={item.image_alt || item.title || ''}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {meta.showTitle && item.title && (
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-slate-900">{item.title}</h3>
        )}
        {meta.showCTA && (
          <div className="mt-auto">
            <Link
              href={safeLink}
              className="text-xs font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors"
            >
              {ctaText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Content type icons for headings ──────────────────────────────────────────

function ContentTypeIcon({ type }: { type: RelatedContentMeta['contentType'] }) {
  const base = 'flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white flex-shrink-0';
  switch (type) {
    case 'Video':
      return (
        <span className={base}>
          <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      );
    case 'Blog':
      return (
        <span className={base}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h10" />
          </svg>
        </span>
      );
    case 'Product':
      return (
        <span className={base}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </span>
      );
    case 'CaseStudy':
      return (
        <span className={base}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </span>
      );
    default:
      return (
        <span className={base}>
          <span className="text-xs font-bold">+</span>
        </span>
      );
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function RelatedContentBlock({ data }: RelatedContentBlockProps) {
  const parsed = data as unknown as RelatedContentData;
  const meta: RelatedContentMeta = { ...DEFAULT_META, ...parsed.meta };
  const heading = parsed.content?.heading;
  const allItems: RelatedContentItem[] = parsed.content?.items ?? [];
  const isVideo = meta.contentType === 'Video';
  const isBlog = meta.contentType === 'Blog';

  const {
    activeVideoUrl,
    isOpen: isModalOpen,
    open: openVideo,
    close: closeVideo,
  } = useVideoModal();

  const visibleItems = allItems.slice(0, meta.displayCount);

  if (allItems.length === 0) return null;

  const activeVideoItem = activeVideoUrl
    ? allItems.find((item) => item.link === activeVideoUrl)
    : null;

  return (
    <div className="w-full" style={{ width: meta.width }}>
      {/* Section heading with icon */}
      {heading && (
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
          <ContentTypeIcon type={meta.contentType} />
          {heading}
        </h2>
      )}

      {/* ═══ Video layout: vertical stacked cards ═══ */}
      {isVideo && (
        <div className="space-y-4">
          {visibleItems.map((item, i) => (
            <VideoCard key={`video-${i}`} item={item} onVideoOpen={openVideo} />
          ))}
          {allItems.length > meta.displayCount && meta.showCTA && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                More videos
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ Blog/Article layout: horizontal mini-cards stacked ═══ */}
      {isBlog && (
        <div className="space-y-3">
          {visibleItems.map((item, i) => (
            <ArticleCard key={`article-${i}`} item={item} />
          ))}
        </div>
      )}

      {/* ═══ Product / CaseStudy layout: grid cards ═══ */}
      {!isVideo && !isBlog && (
        <div
          className={`grid gap-4 ${
            meta.displayCount <= 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {visibleItems.map((item, i) => (
            <GenericCard key={`card-${i}`} item={item} meta={meta} />
          ))}
        </div>
      )}

      {/* Video modal */}
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
