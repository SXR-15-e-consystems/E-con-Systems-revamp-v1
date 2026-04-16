'use client';

import type { HeadlineData, HeadlineMeta, HeadlineTag } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — HeadlineBlock
// Renders a styled heading/text with full typography control.
// ─────────────────────────────────────────────────────────────────────────────

interface HeadlineBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: HeadlineMeta = {
  tag: 'h2',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '20px',
  fontWeight: '700',
  textColor: '#1e4ea2',
  bgColor: 'transparent',
  align: 'left',
  width: '100%',
  letterSpacing: '0px',
  lineHeight: '1.3',
};

const TAG_MAP: Record<HeadlineTag, keyof JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  p: 'p',
};

export function HeadlineBlock({ data }: HeadlineBlockProps) {
  const raw = data as unknown as HeadlineData;
  const meta: HeadlineMeta = { ...DEFAULT_META, ...raw.meta };
  const text: string = raw.content?.text ?? '';

  if (!text) return null;

  const Tag = TAG_MAP[meta.tag] ?? 'h2';

  return (
    <section
      className="w-full"
      style={{
        width: meta.width,
        maxWidth: '100%',
        backgroundColor: meta.bgColor,
      }}
    >
      <Tag
        style={{
          fontFamily: meta.fontFamily,
          fontSize: `clamp(${Math.max(Math.round(parseFloat(meta.fontSize) * 0.6), 14)}px, 4vw, ${meta.fontSize})`,
          fontWeight: Number(meta.fontWeight),
          color: meta.textColor,
          textAlign: meta.align,
          letterSpacing: meta.letterSpacing,
          lineHeight: meta.lineHeight,
          margin: 0,
          padding: '0.5em 0',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </Tag>
    </section>
  );
}
