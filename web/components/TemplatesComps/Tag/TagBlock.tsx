'use client';

import Link from 'next/link';

import { sanitizeUrl } from '@/lib/security';
import type { TagData, TagMeta, TagItem } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — TagBlock
// Renders a titled section of pill-shaped tags in grid (wrapped) or list layout.
// ─────────────────────────────────────────────────────────────────────────────

interface TagBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: TagMeta = {
  layout: 'grid',
  bgColor: '#ffffff',
  tagBgColor: '#f1f5f9',
  tagTextColor: '#334155',
  tagBorderRadius: '4px',
  showIcon: false,
  width: '100%',
};

export function TagBlock({ data }: TagBlockProps) {
  const raw = data as unknown as TagData;
  const meta: TagMeta = { ...DEFAULT_META, ...raw.meta };
  const title: string = raw.content?.title ?? '';
  const tags: TagItem[] = raw.content?.tags ?? [];

  if (tags.length === 0) {
    return null;
  }

  const isRow = meta.layout === 'row';

  const tagElements = tags.map((tag, i) => {
    const hasLink = Boolean(tag.href);
    const safeHref = tag.href ? sanitizeUrl(tag.href) : '';
    const pillBg = hasLink ? '#d5e8ff' : meta.tagBgColor;

    const pillStyle: React.CSSProperties = {
      backgroundColor: pillBg,
      color: meta.tagTextColor,
      borderRadius: meta.tagBorderRadius,
      width: 'max-content',
    };

    if (hasLink && safeHref) {
      return (
        <Link
          key={i}
          href={safeHref}
          className="inline-block px-3 py-1.5 text-[13px] font-normal transition-opacity hover:opacity-80"
          style={pillStyle}
        >
          {tag.label}
        </Link>
      );
    }

    return (
      <span
        key={i}
        className="inline-block px-3 py-1.5 text-[13px] font-normal transition-opacity hover:opacity-80"
        style={pillStyle}
      >
        {tag.label}
      </span>
    );
  });

  if (isRow) {
    return (
      <section
        className="p-3"
        style={{
          width: meta.width,
          maxWidth: '100%',
          backgroundColor: meta.bgColor,
        }}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {title && (
            <span
              className="text-[13px] font-medium text-slate-600"
              style={{ backgroundColor: '#f0f0f0', padding: '5px 15px', borderRadius: '15px' }}
            >
              {title}
            </span>
          )}
          {tagElements}
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg p-3"
      style={{
        width: meta.width,
        maxWidth: '100%',
        backgroundColor: meta.bgColor,
      }}
    >
      {title && (
        <h3 className="text-[16px] font-bold text-slate-800 mb-3 flex items-center gap-2">
          {meta.showIcon && (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-blue-200 bg-blue-50 text-blue-600 text-xs font-bold">
              ▦
            </span>
          )}
          {title}
        </h3>
      )}

      <div
        className={
          meta.layout === 'grid'
            ? 'flex flex-wrap gap-2.5'
            : 'flex flex-col gap-2.5'
        }
      >
        {tagElements}
      </div>
    </section>
  );
}
