'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { sanitizeUrl } from '@/lib/security';
import type {
  ResourceTabData,
  ResourceTabMeta,
  ResourceTabContent,
  ResourceTabCard,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — ResourceTabBlock
// Left vertical tab navigation + right card slider with bottom-right nav arrows.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  data: Record<string, unknown>;
}

const DEFAULT_META: ResourceTabMeta = {
  bgColor: '#f3f4f6',
  sidebarBgColor: '#f3f4f6',
  tabActiveColor: '#16a34a',
  tabInactiveColor: '#111827',
  tabFontSize: '0.9375rem',
  cardBgColor: '#ffffff',
  cardBorderRadius: '12px',
  cardGap: '20px',
  titleColor: '#111827',
  titleSize: '0.9375rem',
  descColor: '#4b5563',
  descSize: '0.8125rem',
  ctaBgColor: '#16a34a',
  ctaTextColor: '#ffffff',
  ctaBorderRadius: '4px',
  ctaSize: '0.8125rem',
  imageAspectRatio: '4/3',
  visibleCards: 3,
  tabCount: 3,
  sectionPadding: '40px 0',
};

// ── Resource Card ──────────────────────────────────────────────────────────
function ResourceCard({
  card,
  meta,
}: {
  card: ResourceTabCard;
  meta: ResourceTabMeta;
}) {
  const ctaHref = card.cta_link ? sanitizeUrl(card.cta_link) : '#';

  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: meta.cardBgColor,
        borderRadius: meta.cardBorderRadius,
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Image */}
      <div
        className="relative w-full"
        style={{ aspectRatio: meta.imageAspectRatio }}
      >
        {card.image_url ? (
          <Image
            src={sanitizeUrl(card.image_url)}
            alt={card.image_alt || card.title || 'Resource image'}
            fill
            className="object-contain p-4"
            sizes={`(max-width: 768px) 100vw, ${Math.round(100 / 3)}vw`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <span className="text-xs text-gray-400">No image</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center gap-2 px-4 pb-5 pt-3 text-center">
        {card.title && (
          <span
            className="font-bold leading-snug"
            style={{ color: meta.titleColor, fontSize: meta.titleSize }}
          >
            {card.title}
          </span>
        )}
        {card.description && (
          <p
            className="leading-relaxed"
            style={{ color: meta.descColor, fontSize: meta.descSize }}
          >
            {card.description}
          </p>
        )}
        {card.cta_text && (
          <Link
            href={ctaHref}
            className="rtab-cta-btn mt-2 inline-flex items-center gap-2 font-semibold"
            style={{
              backgroundColor: meta.ctaBgColor,
              color: meta.ctaTextColor,
              borderRadius: meta.ctaBorderRadius,
              fontSize: meta.ctaSize,
            }}
          >
            <span className="flex-1 px-4 py-2">{card.cta_text}</span>
            <span
              className="flex h-full items-center px-2 py-2"
              style={{ backgroundColor: 'rgba(0,0,0,0.12)' }}
              aria-hidden="true"
            >
              &#187;
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Slider ─────────────────────────────────────────────────────────────────
function CardSlider({
  cards,
  meta,
}: {
  cards: ResourceTabCard[];
  meta: ResourceTabMeta;
}) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState<number>(meta.visibleCards);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w < 640) setVisible(1);
      else if (w < 1024) setVisible(Math.min(2, meta.visibleCards));
      else setVisible(meta.visibleCards);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [meta.visibleCards]);

  const maxIdx = Math.max(0, cards.length - visible);
  useEffect(() => { setIdx((prev) => Math.min(prev, maxIdx)); }, [maxIdx]);

  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx((i) => Math.min(maxIdx, i + 1)), [maxIdx]);

  const showNav = cards.length > visible;
  const itemWidthPct = 100 / visible;

  // Reset slider index when cards change (tab switch)
  useEffect(() => { setIdx(0); }, [cards]);

  if (cards.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">No items in this tab yet.</p>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${idx * itemWidthPct}%)` }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className="flex-shrink-0 px-2"
              style={{ width: `${itemWidthPct}%` }}
            >
              <ResourceCard card={card} meta={meta} />
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <div className="flex justify-end gap-1 mt-4">
          <button
            className="rtab-nav-btn"
            onClick={prev}
            disabled={idx === 0}
            aria-label="Previous"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="rtab-nav-btn"
            onClick={next}
            disabled={idx >= maxIdx}
            aria-label="Next"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function ResourceTabBlock({ data }: Props) {
  const raw = data as unknown as ResourceTabData;
  const meta: ResourceTabMeta = { ...DEFAULT_META, ...raw.meta };
  const content: ResourceTabContent = {
    tabs: raw.content?.tabs ?? [],
  };

  const [activeTab, setActiveTab] = useState(0);

  const tabs = content.tabs;
  if (tabs.length === 0) return null;

  const activeCards = tabs[activeTab]?.cards ?? [];

  return (
    <section style={{ backgroundColor: meta.bgColor, padding: meta.sectionPadding }}>
      <style>{`
        .rtab-nav-btn {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #d1d5db;
          background: #ffffff;
          cursor: pointer;
          padding: 0;
          transition: background 0.15s;
        }
        .rtab-nav-btn:hover:not(:disabled) { background: #f9fafb; }
        .rtab-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .rtab-cta-btn {
          text-decoration: none;
          overflow: hidden;
          display: inline-flex;
          align-items: stretch;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-0">
          {/* Left sidebar — tab list */}
          <aside
            className="flex-shrink-0 border-r border-gray-200 pr-0 md:w-52"
            style={{ backgroundColor: meta.sidebarBgColor }}
          >
            <nav className="flex flex-row flex-wrap gap-1 py-2 md:flex-col md:gap-0 md:py-4">
              {tabs.map((tab, i) => {
                const isActive = i === activeTab;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className="flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-gray-100/60 focus-visible:outline-none"
                    style={{
                      color: isActive ? meta.tabActiveColor : meta.tabInactiveColor,
                      fontSize: meta.tabFontSize,
                      fontWeight: isActive ? 700 : 400,
                      borderRight: isActive ? `3px solid ${meta.tabActiveColor}` : '3px solid transparent',
                    }}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {isActive && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={meta.tabActiveColor}
                        strokeWidth="3"
                        className="flex-shrink-0"
                      >
                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {!isActive && <span className="w-[10px] flex-shrink-0" />}
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right content — card slider */}
          <div className="flex-1 pl-0 pt-4 md:pl-6 md:pt-0">
            <CardSlider key={activeTab} cards={activeCards} meta={meta} />
          </div>
        </div>
      </div>
    </section>
  );
}
