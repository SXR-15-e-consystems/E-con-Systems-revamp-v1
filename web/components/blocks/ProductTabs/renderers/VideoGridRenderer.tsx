'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useVideoModal } from '@/hooks/useVideoModal';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/youtube';
import type { VideoGridTabContent } from '@/types/templates';

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

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
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

// ── Main Renderer ────────────────────────────────────────────────────────────

interface Props {
  data: VideoGridTabContent;
}

export function VideoGridRenderer({ data }: Props) {
  const items = data.items ?? [];
  const { activeVideoUrl, isOpen, open, close } = useVideoModal();

  const handleVideoClick = useCallback(
    (videoUrl: string) => {
      open(videoUrl);
    },
    [open],
  );

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No videos available.</p>;
  }

  const activeItem = activeVideoUrl
    ? items.find((it) => it.video_url === activeVideoUrl)
    : null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {items.map((item, i) => {
          const thumbSrc =
            item.thumbnail_url || getYouTubeThumbnail(item.video_url) || '';
          return (
            <button
              key={`video-${i}`}
              type="button"
              onClick={() => handleVideoClick(item.video_url)}
              className="group block rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-100">
                {thumbSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={thumbSrc}
                    alt={item.title || 'Video thumbnail'}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                    <span className="text-xs text-slate-400">No thumbnail</span>
                  </div>
                )}
                {/* YouTube-style play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[68px] h-[48px] rounded-xl bg-[#FF0000] flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Video popup modal */}
      {isOpen && activeVideoUrl && (
        <VideoModal
          videoUrl={activeVideoUrl}
          title={activeItem?.title}
          onClose={close}
        />
      )}
    </>
  );
}
