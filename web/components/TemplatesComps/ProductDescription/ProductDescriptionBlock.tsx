'use client';

import type {
  ProductDescriptionData,
  ProductDescriptionMeta,
  ProductDescriptionBullet,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — ProductDescriptionBlock
// Renders a titled bullet-point list with word-wrap, custom bullet styles,
// and typography driven by template meta configuration.
// ─────────────────────────────────────────────────────────────────────────────

interface ProductDescriptionBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: ProductDescriptionMeta = {
  bgColor: '#ffffff',
  titleColor: '#1f2937',
  titleFontSize: '15px',
  titleFontWeight: '700',
  textColor: '#374151',
  textFontSize: '13px',
  bulletStyle: 'disc',
  bulletColor: '#1f2937',
  lineSpacing: '1.6',
  width: '100%',
};

const BULLET_CHAR: Record<string, string> = {
  disc: '•',
  circle: '◦',
  square: '▪',
  dash: '–',
  check: '✓',
};

export function ProductDescriptionBlock({ data }: ProductDescriptionBlockProps) {
  const raw = data as unknown as ProductDescriptionData;
  const meta: ProductDescriptionMeta = { ...DEFAULT_META, ...raw.meta };
  const title: string = raw.content?.title ?? '';
  const bullets: ProductDescriptionBullet[] = raw.content?.bullets ?? [];

  if (!title && bullets.length === 0) return null;

  const bulletChar = BULLET_CHAR[meta.bulletStyle] ?? '•';

  return (
    <section
      className="overflow-hidden"
      style={{
        width: meta.width,
        maxWidth: '100%',
        backgroundColor: meta.bgColor,
        padding: '0.75rem',
      }}
    >
      {title && (
        <h3
          className="mb-4"
          style={{
            color: meta.titleColor,
            fontSize: meta.titleFontSize,
            fontWeight: Number(meta.titleFontWeight),
            margin: 0,
            marginBottom: '0.75rem',
          }}
        >
          {title}
        </h3>
      )}

      {bullets.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-2"
              style={{
                fontSize: meta.textFontSize,
                color: meta.textColor,
                lineHeight: meta.lineSpacing,
                marginBottom: '0.35em',
              }}
            >
              <span
                className="flex-shrink-0 mt-[0.15em]"
                style={{ color: meta.bulletColor }}
              >
                {bulletChar}
              </span>
              <span
                style={{
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  minWidth: 0,
                }}
              >
                {b.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
