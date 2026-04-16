import Image from 'next/image';
import Link from 'next/link';

import { sanitizeUrl } from '@/lib/security';
import type {
  RelatedBlogsGridData,
  RelatedBlogsGridMeta,
  RelatedBlogsGridContent,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — RelatedBlogsGridBlock
// Multi-column grid of related blog cards with image, title, excerpt & CTA.
// ─────────────────────────────────────────────────────────────────────────────

interface RelatedBlogsGridBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: RelatedBlogsGridMeta = {
  bgColor: '#f8fafc',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  columns: 3,
  titleColor: '#1f2937',
  ctaBgColor: '#2563eb',
  ctaTextColor: '#ffffff',
  width: '100%',
  headingColor: '#111827',
  headingAlign: 'left',
  cardAlign: 'left',
};

const HEADING_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const FLEX_JUSTIFY: Record<string, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

const CARD_WIDTH: Record<number, string> = {
  2: 'calc(50% - 12px)',
  3: 'calc(33.333% - 16px)',
  4: 'calc(25% - 18px)',
};

const CARD_WIDTH_SM = 'calc(50% - 12px)';

const gridCols: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
};

function renderCard(
  item: RelatedBlogsGridContent['items'][number],
  index: number,
  imageUrl: string,
  linkUrl: string,
  ctaText: string,
  meta: RelatedBlogsGridMeta,
) {
  return (
    <div
      key={index}
      className="overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
      style={{
        backgroundColor: meta.cardBgColor,
        borderRadius: meta.cardBorderRadius,
      }}
    >
      {imageUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={item.image_alt || item.title || 'Blog image'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="flex flex-col flex-1 p-4">
        {item.title && (
          <h3
            className="text-base font-semibold mb-2 leading-snug"
            style={{ color: meta.titleColor }}
          >
            {item.title}
          </h3>
        )}
        {item.excerpt && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
            {item.excerpt}
          </p>
        )}
        {linkUrl && (
          <Link
            href={linkUrl}
            className="inline-block self-start rounded px-4 py-2 text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 mt-auto"
            style={{
              backgroundColor: meta.ctaBgColor,
              color: meta.ctaTextColor,
            }}
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );
}

export function RelatedBlogsGridBlock({ data }: RelatedBlogsGridBlockProps) {
  const raw = data as unknown as RelatedBlogsGridData;
  const meta: RelatedBlogsGridMeta = { ...DEFAULT_META, ...raw.meta };
  const content: RelatedBlogsGridContent = {
    heading: raw.content?.heading ?? '',
    items: raw.content?.items ?? [],
  };

  const { heading, items } = content;

  if (!heading && items.length === 0) return null;

  const headingClass = HEADING_ALIGN[meta.headingAlign] ?? 'text-left';

  return (
    <section
      style={{
        width: meta.width,
        maxWidth: '100%',
        backgroundColor: meta.bgColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {heading && (
          <h2
            className={`text-2xl font-bold mb-8 ${headingClass}`}
            style={{ color: meta.headingColor }}
          >
            {heading}
          </h2>
        )}

        {meta.cardAlign === 'left' ? (
          <div className={`grid grid-cols-1 gap-6 ${gridCols[meta.columns] ?? 'lg:grid-cols-3'}`}>
            {items.map((item, index) => {
              const imageUrl = sanitizeUrl(item.image_url);
              const linkUrl = sanitizeUrl(item.link);
              const ctaText = item.cta_text || 'Know More';

              return renderCard(item, index, imageUrl, linkUrl, ctaText, meta);
            })}
          </div>
        ) : (
          <>
            <style>{`
              .rbg-card-wrap { width: 100%; }
              @media (min-width: 640px) { .rbg-card-wrap { width: ${CARD_WIDTH_SM}; } }
              @media (min-width: 1024px) { .rbg-card-wrap { width: ${CARD_WIDTH[meta.columns] ?? CARD_WIDTH[3]}; } }
            `}</style>
            <div
              className="flex flex-wrap gap-6"
              style={{ justifyContent: FLEX_JUSTIFY[meta.cardAlign] ?? 'flex-start' }}
            >
              {items.map((item, index) => {
                const imageUrl = sanitizeUrl(item.image_url);
                const linkUrl = sanitizeUrl(item.link);
                const ctaText = item.cta_text || 'Know More';

                return (
                  <div key={index} className="rbg-card-wrap">
                    {renderCard(item, index, imageUrl, linkUrl, ctaText, meta)}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
