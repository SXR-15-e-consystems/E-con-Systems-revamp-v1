'use client';

import Image from 'next/image';

import { sanitizeUrl } from '@/lib/security';
import type { ImageOnlyData, ImageOnlyMeta, ImageOnlyContent } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — ImageOnlyBlock
// Renders a single image that fills its container, resolution adapts on resize
// ─────────────────────────────────────────────────────────────────────────────

interface ImageOnlyBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: ImageOnlyMeta = {
  bgColor: '#ffffff',
  borderRadius: '0px',
  objectFit: 'none',
  width: '100%',
  height: 'auto',
};

export function ImageOnlyBlock({ data }: ImageOnlyBlockProps) {
  const raw = data as unknown as ImageOnlyData;
  const meta: ImageOnlyMeta = { ...DEFAULT_META, ...raw.meta };
  const content: ImageOnlyContent = {
    image_url: raw.content?.image_url ?? '',
    image_alt: raw.content?.image_alt ?? '',
  };

  const safeUrl = sanitizeUrl(content.image_url, false);

  if (!safeUrl) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm"
        style={{
          width: meta.width,
          height: meta.height,
          backgroundColor: meta.bgColor,
          borderRadius: meta.borderRadius,
        }}
      >
        No image available
      </div>
    );
  }

  const useNaturalSize = meta.objectFit === 'none' || meta.height === 'auto';

  if (useNaturalSize) {
    return (
      <div
        style={{
          width: meta.width,
          backgroundColor: meta.bgColor,
          borderRadius: meta.borderRadius,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={safeUrl}
          alt={content.image_alt || 'Image'}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: meta.borderRadius,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: meta.width,
        height: meta.height,
        backgroundColor: meta.bgColor,
        borderRadius: meta.borderRadius,
      }}
    >
      <Image
        src={safeUrl}
        alt={content.image_alt || 'Image'}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="h-full w-full"
        style={{ objectFit: meta.objectFit }}
        unoptimized
      />
    </div>
  );
}
