'use client';

import Image from 'next/image';

import { sanitizeUrl } from '@/lib/security';
import type { VideoGridTabContent } from '@/types/templates';

interface Props {
  data: VideoGridTabContent;
}

export function VideoGridRenderer({ data }: Props) {
  const items = data.items ?? [];

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No videos available.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {items.map((item, i) => {
        const safeUrl = sanitizeUrl(item.video_url);
        return (
          <a
            key={`video-${i}`}
            href={safeUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-slate-100">
              {item.thumbnail_url ? (
                <Image
                  src={item.thumbnail_url}
                  alt={item.title || 'Video thumbnail'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                  <span className="text-xs text-slate-400">No thumbnail</span>
                </div>
              )}
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
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
          </a>
        );
      })}
    </div>
  );
}
