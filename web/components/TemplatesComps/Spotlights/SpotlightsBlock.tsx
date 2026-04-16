'use client';

import Image from 'next/image';

import { useSlider } from '@/hooks/useSlider';
import { sanitizeUrl } from '@/lib/security';
import type { SpotlightsData, SpotlightsMeta, SpotlightsContent, SpotlightItem } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — SpotlightsBlock
// Multi-column grid of feature highlights with icon, title, and description.
// Supports grid (with cardAlign) and slider layout modes.
// ─────────────────────────────────────────────────────────────────────────────

interface SpotlightsBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: SpotlightsMeta = {
  bgColor: '#ffffff',
  iconSize: '48px',
  titleColor: '#1f2937',
  titleFontSize: '18px',
  descriptionColor: '#6b7280',
  descriptionFontSize: '14px',
  columns: 3,
  width: '100%',
  headingColor: '#111827',
  headingAlign: 'center',
  layout: 'grid',
  cardAlign: 'left',
};

const HEADING_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const gridCols: Record<number, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
  5: 'md:grid-cols-2 lg:grid-cols-5',
};

const FLEX_JUSTIFY: Record<string, string> = {
  left: 'flex-start',
  center: 'center',
};

const CARD_WIDTH: Record<number, string> = {
  2: 'calc(50% - 12px)',
  3: 'calc(33.333% - 16px)',
  4: 'calc(25% - 18px)',
  5: 'calc(20% - 19.2px)',
};

const CARD_WIDTH_SM = 'calc(50% - 12px)';

function SpotlightCard({ item, meta }: { item: SpotlightItem; meta: SpotlightsMeta }) {
  const iconUrl = sanitizeUrl(item.icon_url);
  return (
    <div className="flex flex-col items-center text-center p-6">
      {iconUrl && (
        <Image
          src={iconUrl}
          alt={item.icon_alt || item.title}
          width={parseInt(meta.iconSize) || 48}
          height={parseInt(meta.iconSize) || 48}
          className="object-contain mb-4"
        />
      )}
      <h3
        className="font-semibold mb-2"
        style={{ color: meta.titleColor, fontSize: meta.titleFontSize }}
      >
        {item.title}
      </h3>
      <p style={{ color: meta.descriptionColor, fontSize: meta.descriptionFontSize }}>
        {item.description}
      </p>
    </div>
  );
}

function SliderView({ items, meta }: { items: SpotlightItem[]; meta: SpotlightsMeta }) {
  const cols = meta.columns;
  const totalPages = Math.ceil(items.length / cols);
  const { activeIndex, goTo, next, prev } = useSlider(totalPages, 5000);

  const startIdx = activeIndex * cols;
  const visibleItems = items.slice(startIdx, startIdx + cols);

  return (
    <div className="relative">
      <div className={`grid grid-cols-1 gap-8 ${gridCols[cols] ?? 'lg:grid-cols-3'}`}>
        {visibleItems.map((item, idx) => (
          <SpotlightCard key={startIdx + idx} item={item} meta={meta} />
        ))}
      </div>

      {totalPages > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to page ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === activeIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SpotlightsBlock({ data }: SpotlightsBlockProps) {
  const raw = data as unknown as SpotlightsData;
  const meta: SpotlightsMeta = { ...DEFAULT_META, ...raw.meta };
  const content: SpotlightsContent = { ...({ heading: '', items: [] } as SpotlightsContent), ...raw.content };

  const heading = content.heading ?? '';
  const items = content.items ?? [];

  if (!heading && items.length === 0) return null;

  const headingClass = HEADING_ALIGN[meta.headingAlign] ?? 'text-center';

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
            className={`text-2xl font-bold mb-10 ${headingClass}`}
            style={{ color: meta.headingColor }}
          >
            {heading}
          </h2>
        )}

        {meta.layout === 'slider' ? (
          <SliderView items={items} meta={meta} />
        ) : meta.cardAlign === 'left' ? (
          <div className={`grid grid-cols-1 gap-8 ${gridCols[meta.columns] ?? 'lg:grid-cols-3'}`}>
            {items.map((item, idx) => (
              <SpotlightCard key={idx} item={item} meta={meta} />
            ))}
          </div>
        ) : (
          <>
            <style>{`
              .sl-card-wrap { width: 100%; }
              @media (min-width: 640px) { .sl-card-wrap { width: ${CARD_WIDTH_SM}; } }
              @media (min-width: 1024px) { .sl-card-wrap { width: ${CARD_WIDTH[meta.columns] ?? CARD_WIDTH[3]}; } }
            `}</style>
            <div
              className="flex flex-wrap gap-8"
              style={{ justifyContent: FLEX_JUSTIFY[meta.cardAlign] ?? 'flex-start' }}
            >
              {items.map((item, idx) => (
                <div key={idx} className="sl-card-wrap">
                  <SpotlightCard item={item} meta={meta} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
