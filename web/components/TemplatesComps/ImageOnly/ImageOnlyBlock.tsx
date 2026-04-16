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
  alignX: 'left',
  margin: '0px',
  maxWidth: '',
  maxHeight: '',
  minWidth: '',
  minHeight: '',
};

export function ImageOnlyBlock({ data }: ImageOnlyBlockProps) {
  const raw = data as unknown as ImageOnlyData;
  const meta: ImageOnlyMeta = { ...DEFAULT_META, ...raw.meta };
  const content: ImageOnlyContent = {
    image_url: raw.content?.image_url ?? '',
    image_alt: raw.content?.image_alt ?? '',
  };

  const safeUrl = sanitizeUrl(content.image_url, false);

  const JUSTIFY_MAP: Record<string, string> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };

  // Outer wrapper handles horizontal alignment via flexbox
  const outerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: JUSTIFY_MAP[meta.alignX] ?? 'flex-start',
    width: '100%',
  };

  // Inner container holds the image with its own sizing/margin
  const containerStyle: React.CSSProperties = {
    width: meta.width,
    backgroundColor: meta.bgColor,
    borderRadius: meta.borderRadius,
    ...(meta.margin && meta.margin !== '0px' && meta.margin !== '0'
      ? { margin: meta.margin }
      : {}),
    ...(meta.maxWidth ? { maxWidth: meta.maxWidth } : {}),
    ...(meta.maxHeight ? { maxHeight: meta.maxHeight } : {}),
    ...(meta.minWidth ? { minWidth: meta.minWidth } : {}),
    ...(meta.minHeight ? { minHeight: meta.minHeight } : {}),
  };

  if (!safeUrl) {
    return (
      <div style={outerStyle}>
        <div
          className="flex items-center justify-center text-slate-400 text-sm"
          style={{
            ...containerStyle,
            height: meta.height,
          }}
        >
          No image available
        </div>
      </div>
    );
  }

  const useNaturalSize = meta.objectFit === 'none' || meta.height === 'auto';

  if (useNaturalSize) {
    return (
      <div style={outerStyle}>
        <div style={containerStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={safeUrl}
            alt={content.image_alt || 'Image'}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: meta.borderRadius,
              ...(meta.maxHeight ? { maxHeight: meta.maxHeight, objectFit: 'contain' as const } : {}),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={outerStyle}>
      <div
        className="relative overflow-hidden"
        style={{
          ...containerStyle,
          height: meta.height,
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
    </div>
  );
}
