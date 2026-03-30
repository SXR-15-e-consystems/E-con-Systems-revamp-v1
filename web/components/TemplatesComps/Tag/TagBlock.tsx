'use client';

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
  tagBorderRadius: '9999px',
  showIcon: true,
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

  return (
    <section
      className="mx-auto rounded-lg p-6"
      style={{
        width: meta.width,
        maxWidth: '100%',
        backgroundColor: meta.bgColor,
      }}
    >
      {title && (
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
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
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-block px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: meta.tagBgColor,
              color: meta.tagTextColor,
              borderRadius: meta.tagBorderRadius,
            }}
          >
            {tag.label}
          </span>
        ))}
      </div>
    </section>
  );
}
