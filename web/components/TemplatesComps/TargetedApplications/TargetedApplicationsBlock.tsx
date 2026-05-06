'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { sanitizeUrl } from '@/lib/security';
import type {
  TargetedApplicationsData,
  TargetedApplicationsMeta,
  TargetedApplicationsContent,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — TargetedApplicationsBlock
// Applications slider with bottom-right nav arrows. Image-over-title card style.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  data: Record<string, unknown>;
}

const DEFAULT_META: TargetedApplicationsMeta = {
  bgColor: '#f3f4f6',
  headingColor: '#111827',
  headingSize: '1.75rem',
  headingAlign: 'center',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  cardGap: '16px',
  titleColor: '#1f2937',
  titleSize: '0.9375rem',
  imageAspectRatio: '4/3',
  visibleCards: 4,
  sectionPadding: '40px 0',
};

const HEADING_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function TargetedApplicationsBlock({ data }: Props) {
  const raw = data as unknown as TargetedApplicationsData;
  const meta: TargetedApplicationsMeta = { ...DEFAULT_META, ...raw.meta };
  const content: TargetedApplicationsContent = {
    heading: raw.content?.heading ?? '',
    items: raw.content?.items ?? [],
  };

  const items = content.items;
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState<number>(meta.visibleCards);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w < 640) setVisible(1);
      else if (w < 768) setVisible(2);
      else if (w < 1024) setVisible(Math.min(3, meta.visibleCards));
      else setVisible(meta.visibleCards);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [meta.visibleCards]);

  const maxIdx = Math.max(0, items.length - visible);

  useEffect(() => {
    setIdx((prev) => Math.min(prev, maxIdx));
  }, [maxIdx]);

  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx((i) => Math.min(maxIdx, i + 1)), [maxIdx]);

  const showNav = items.length > visible;
  const itemWidthPct = 100 / visible;

  if (!content.heading && items.length === 0) return null;

  return (
    <section style={{ backgroundColor: meta.bgColor, padding: meta.sectionPadding }}>
      <style>{`
        .tap-card {
          background-color: ${meta.cardBgColor};
          border-radius: ${meta.cardBorderRadius};
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          transition: box-shadow 0.2s;
        }
        .tap-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
        .tap-nav-btn {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d1d5db;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.15s;
          padding: 0;
        }
        .tap-nav-btn:hover:not(:disabled) { background: #f9fafb; }
        .tap-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        {content.heading && (
          <h2
            className={`font-bold mb-8 ${HEADING_ALIGN[meta.headingAlign] ?? 'text-center'}`}
            style={{ color: meta.headingColor, fontSize: meta.headingSize }}
          >
            {content.heading}
          </h2>
        )}

        {/* Slider */}
        {items.length > 0 && (
          <>
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${idx * itemWidthPct}%)` }}
              >
                {items.map((item, i) => {
                  const cardInner = (
                    <div className="tap-card">
                      {/* Image — padded left/top/right inside card */}
                      <div style={{ padding: '8px 8px 0 8px' }}>
                      <div
                        className="relative w-full overflow-hidden"
                        style={{ aspectRatio: meta.imageAspectRatio, borderRadius: '4px' }}
                      >
                        {item.image_url ? (
                          <Image
                            src={sanitizeUrl(item.image_url)}
                            alt={item.image_alt || item.title || 'Application'}
                            fill
                            className="object-cover"
                            sizes={`(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${Math.round(100 / visible)}vw`}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      </div>{/* end image padding wrapper */}

                      {/* Title */}
                      {item.title && (
                        <div className="px-4 py-3 text-center">
                          <span
                            className="font-medium leading-snug"
                            style={{ color: meta.titleColor, fontSize: meta.titleSize }}
                          >
                            {item.title}
                          </span>
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <div
                      key={i}
                      className="flex-shrink-0 px-2"
                      style={{ width: `${itemWidthPct}%` }}
                    >
                      {item.link ? (
                        <Link
                          href={sanitizeUrl(item.link)}
                          className="block hover:opacity-90 transition-opacity"
                        >
                          {cardInner}
                        </Link>
                      ) : (
                        cardInner
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom-right navigation */}
            {showNav && (
              <div className="flex justify-end gap-1 mt-4">
                <button
                  className="tap-nav-btn"
                  onClick={prev}
                  disabled={idx === 0}
                  aria-label="Previous applications"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  className="tap-nav-btn"
                  onClick={next}
                  disabled={idx >= maxIdx}
                  aria-label="Next applications"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
