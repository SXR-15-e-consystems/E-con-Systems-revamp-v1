'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';

import { sanitizeUrl } from '@/lib/security';
import type {
  ProductHeroNewData,
  ProductHeroNewMeta,
  ProductHeroNewContent,
  ProductHighlightIcon,
  ProductHeroAdItem,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — ProductHeroNewBlock
// Layout:
//   LEFT column   → SKU badge · title · image + icon strip · flat indicators · tags
//   MIDDLE column → partner logos · Highlights · variant select · prices · CTAs
//   RIGHT column (optional) → Advertisement / notification card
// ─────────────────────────────────────────────────────────────────────────────

interface ProductHeroNewBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: ProductHeroNewMeta = {
  bgColor: '#f5f5f5',
  badgeBgColor: '#1a1a1a',
  badgeTextColor: '#ffffff',
  titleColor: '#111111',
  highlightsHeadingColor: '#111111',
  highlightBulletColor: '#444444',
  imageBgColor: '#f5f5f5',
  buyNowBgColor: '#22c55e',
  buyNowTextColor: '#ffffff',
  downloadBgColor: '#1e2d3d',
  downloadTextColor: '#ffffff',
  partnerLogosHeight: '28px',
  priceLabelColor: '#6b7280',
  priceValueColor: '#1e3a8a',
};

// ── Icons ──────────────────────────────────────────────────────────────────
function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-gray-400 pointer-events-none"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Highlight icon with CSS hover tooltip ─────────────────────────────────
function HighlightIconItem({ icon }: { icon: ProductHighlightIcon }) {
  if (!icon.icon_url) return null;
  return (
    <div className="phn-icon-item">
      <div
        className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm border border-gray-100"
        aria-label={icon.icon_label}
      >
        <Image
          src={sanitizeUrl(icon.icon_url, false)}
          alt={icon.icon_alt ?? icon.icon_label}
          width={28}
          height={28}
          className="object-contain"
        />
      </div>
      <span className="phn-icon-tooltip" role="tooltip">
        {icon.icon_label}
      </span>
    </div>
  );
}

// ── Advertisement banner (third column) ───────────────────────────────────
function AdBanner({ ad }: { ad: ProductHeroAdItem }) {
  const safeLink = ad.cta_link ? sanitizeUrl(ad.cta_link) : null;
  const inner = (
    <div className="phn-ad-inner relative w-full h-full overflow-hidden rounded-lg">
      <Image
        src={sanitizeUrl(ad.image_url, false)}
        alt={ad.image_alt}
        fill
        className="object-cover"
        sizes="300px"
      />
    </div>
  );
  if (safeLink) {
    return (
      <Link
        href={safeLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
        aria-label={ad.title ?? ad.image_alt}
      >
        {inner}
      </Link>
    );
  }
  return <div className="h-full">{inner}</div>;
}

// ── Main block ─────────────────────────────────────────────────────────────
export function ProductHeroNewBlock({ data }: ProductHeroNewBlockProps) {
  const typed = data as unknown as ProductHeroNewData;
  const meta: ProductHeroNewMeta = { ...DEFAULT_META, ...typed.meta };
  const content: ProductHeroNewContent = {
    sku_badge: typed.content?.sku_badge ?? '',
    title: typed.content?.title ?? '',
    images: typed.content?.images ?? [],
    partner_logos: typed.content?.partner_logos ?? [],
    highlights: typed.content?.highlights ?? [],
    highlight_icons: typed.content?.highlight_icons ?? [],
    show_highlight_icons: typed.content?.show_highlight_icons ?? false,
    variant_options: typed.content?.variant_options ?? [],
    sample_price: typed.content?.sample_price ?? '',
    sample_currency: typed.content?.sample_currency ?? 'USD',
    volume_price: typed.content?.volume_price,
    volume_currency: typed.content?.volume_currency ?? 'USD',
    buy_now_url: typed.content?.buy_now_url,
    download_url: typed.content?.download_url,
    download_label: typed.content?.download_label ?? 'DOWNLOAD',
    download_sub_label: typed.content?.download_sub_label ?? '( Technical documents )',
    tags: typed.content?.tags ?? [],
    ad: typed.content?.ad,
    template_ad: typed.content?.template_ad,
    hide_ad: typed.content?.hide_ad ?? false,
  };

  // Active ad: page-level .ad overrides template_ad; hide_ad suppresses both
  const activeAd: ProductHeroAdItem | null = content.hide_ad
    ? null
    : (content.ad ?? content.template_ad ?? null);

  const hasIcons =
    content.show_highlight_icons === true &&
    Array.isArray(content.highlight_icons) &&
    content.highlight_icons.length > 0;

  const images = content.images;
  const [activeIdx, setActiveIdx] = useState(0);
  const activeImage = images[activeIdx] ?? images[0];

  const [selectedVariant, setSelectedVariant] = useState(
    content.variant_options[0] ?? '',
  );

  const handleVariantChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedVariant(e.target.value),
    [],
  );

  const safeDownloadUrl = content.download_url ? sanitizeUrl(content.download_url) : '#';
  const safeBuyNowUrl = content.buy_now_url ? sanitizeUrl(content.buy_now_url) : '#';
  const hasTags = Array.isArray(content.tags) && content.tags.length > 0;

  return (
    <section
      className="phn-root w-full"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* ── Scoped responsive styles ─────────────────────────────── */}
      <style>{`
        .phn-root { padding: 0; }

        /* Grid */
        .phn-grid { display: grid; align-items: stretch; }
        .phn-grid--2col { grid-template-columns: 1fr 1fr; }
        .phn-grid--3col { grid-template-columns: 1fr 1fr minmax(220px, 280px); }

        @media (max-width: 1023px) {
          .phn-grid--3col { grid-template-columns: 1fr 1fr; }
          .phn-ad-col { display: none; }
        }
        @media (max-width: 767px) {
          .phn-grid--2col,
          .phn-grid--3col { grid-template-columns: 1fr; }
        }

        /* Left col */
        .phn-left-col {
          display: flex;
          flex-direction: column;
        }

        /* Two-tone flex row: gray (SKU+title+image) | icon strip */
        .phn-left-zone {
          flex: 1;
          display: flex;
          flex-direction: row;
          align-items: stretch;
        }

        /* Gray content strip — SKU badge, title, product image */
        .phn-gray-strip {
          flex: 1;
          min-width: 0;
          background-color: ${meta.bgColor};
          padding: clamp(20px, 3vw, 40px) clamp(20px, 3.5vw, 40px);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Icon strip — same gray bg as the left panel */
        .phn-icon-strip {
          width: 72px;
          flex-shrink: 0;
          background-color: ${meta.bgColor};
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
          padding: 24px 8px;
        }

        /* Indicators row — inside gray strip, centered */
        .phn-indicators-row {
          display: flex;
          justify-content: center;
        }

        /* Tags row — inside gray strip */
        .phn-tags {
          margin-top: 24px;
          font-size: 0.8125rem;
          text-align:center;
        }

        /* Right col */
        .phn-right-col {
          padding: clamp(16px, 3vw, 40px) clamp(16px, 4vw, 48px);
        }

        /* Ad col */
        .phn-ad-col {
          padding: clamp(12px, 2vw, 24px) clamp(12px, 2vw, 24px) clamp(12px, 2vw, 24px) 0;
        }
        .phn-ad-inner { min-height: 320px; }

        /* Buttons */
        .phn-btn-row { display: flex; gap: 12px; flex-wrap: wrap; }
        @media (max-width: 480px) {
          .phn-btn-row { flex-direction: column; }
          .phn-btn-row a,
          .phn-btn-row > div > a { width: 100%; justify-content: center; }
        }
        .phn-partner-logos {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        .phn-price-row {
          display: flex;
          gap: clamp(16px, 4vw, 40px);
          flex-wrap: wrap;
          align-items: flex-end;
        }
        .phn-btn-split {
          display: inline-flex;
          align-items: stretch;
          border-radius: 4px;
          overflow: hidden;
          text-decoration: none;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          min-width: 170px;
          height: 44px;
          flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .phn-btn-split:hover { opacity: 0.9; }
        .phn-btn-split:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
        .phn-btn-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 16px;
        }
        .phn-btn-accent {
          width: 44px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Highlight icon strip */
        .phn-icon-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .phn-icon-tooltip {
          position: absolute;
          right: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          background: #1f2937;
          color: #fff;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 4px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
          z-index: 20;
        }
        .phn-icon-item:hover .phn-icon-tooltip { opacity: 1; }

        /* Flat indicators */
        .phn-indicator {
          height: 3px;
          border-radius: 2px;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: width 0.2s, background-color 0.2s;
          flex-shrink: 0;
        }
        .phn-indicator--active  { width: 24px; background-color: #22c55e; }
        .phn-indicator--inactive { width: 16px; background-color: #9ca3af; }
        .phn-indicator:hover { background-color: #4ade80; width: 24px; }
        .phn-indicator:focus-visible { outline: 2px solid #22c55e; outline-offset: 3px; }
      `}</style>

      <div className={`phn-grid mx-auto max-w-screen-xl ${activeAd ? 'phn-grid--3col' : 'phn-grid--2col'}`}>

        {/* ── LEFT COL ──────────────────────────────────────────────────────── */}
        <div className="phn-left-col">

          {/* Two-tone zone: gray (SKU+title+image) | white (icons) */}
          <div className="phn-left-zone">

            {/* Gray strip */}
            <div className="phn-gray-strip">

              {/* SKU Badge */}
              {content.sku_badge && (
                <span
                  className="inline-block self-start rounded px-3 py-1 text-xs font-semibold tracking-wide"
                  style={{
                    backgroundColor: meta.badgeBgColor,
                    color: meta.badgeTextColor,
                  }}
                >
                  {content.sku_badge}
                </span>
              )}

              {/* Title */}
              {content.title && (
                <h1
                  className="text-xl font-bold leading-snug sm:text-2xl lg:text-[1.6rem]"
                  style={{ color: meta.titleColor }}
                >
                  {content.title}
                </h1>
              )}

              {/* Product image */}
              {activeImage && (
                <div
                  className="relative w-full overflow-hidden rounded-sm"
                  style={{ aspectRatio: '4/3' }}
                >
                  <Image
                    src={sanitizeUrl(activeImage.image_url, false)}
                    alt={activeImage.image_alt}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 768px) 100vw, 40vw"
                    priority
                  />
                </div>
              )}

              {/* Flat dash indicators — inside gray strip, centered below image */}
              {images.length > 1 && (
                <div className="phn-indicators-row">
                  <div
                    className="flex flex-row gap-2 items-center"
                    role="tablist"
                    aria-label="Product images"
                  >
                    {images.map((img, i) => (
                      <button
                        key={i}
                        role="tab"
                        aria-selected={i === activeIdx}
                        aria-label={img.image_alt || `Image ${i + 1}`}
                        onClick={() => setActiveIdx(i)}
                        className={`phn-indicator ${i === activeIdx ? 'phn-indicator--active' : 'phn-indicator--inactive'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tags — inside gray strip, large gap below indicators */}
              {hasTags && (
                <div className="phn-tags">
                  <span className="font-medium text-gray-700">Tags:&nbsp;</span>
                  {content.tags!.map((tag, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1 text-gray-400">|</span>}
                      {tag.href ? (
                        <Link
                          href={sanitizeUrl(tag.href)}
                          className="text-blue-600 hover:underline focus-visible:underline"
                        >
                          {tag.label}
                        </Link>
                      ) : (
                        <span className="text-blue-600">{tag.label}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Icon strip — same gray bg, visible only when icons configured */}
            {hasIcons && (
              <div className="phn-icon-strip">
                {content.highlight_icons!.map((icon, i) => (
                  <HighlightIconItem key={i} icon={icon} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── MIDDLE COL: partner logos · highlights · variant · price · CTAs ── */}
        <div className="phn-right-col flex flex-col gap-5">

          {/* Partner logos */}
          {content.partner_logos.length > 0 && (
            <div className="phn-partner-logos">
              {content.partner_logos.map((logo, i) => {
                const logoSrc = sanitizeUrl(logo.image_url, false);
                const logoHref = logo.href ? sanitizeUrl(logo.href) : null;
                const imgEl = (
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      height: meta.partnerLogosHeight,
                      width: 'auto',
                      minWidth: '40px',
                      aspectRatio: 'auto',
                    }}
                  >
                    <Image
                      src={logoSrc}
                      alt={logo.image_alt}
                      fill
                      className="object-contain"
                      sizes="100px"
                    />
                  </div>
                );
                return logoHref ? (
                  <Link
                    key={i}
                    href={logoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {imgEl}
                  </Link>
                ) : (
                  <div key={i}>{imgEl}</div>
                );
              })}
            </div>
          )}

          {/* Highlights */}
          {content.highlights.length > 0 && (
            <div>
              <p
                className="mb-2 text-sm font-semibold"
                style={{ color: meta.highlightsHeadingColor }}
              >
                Highlights
              </p>
              <ul className="divide-y divide-gray-100">
                {content.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-relaxed py-2"
                    style={{ color: meta.highlightBulletColor }}
                  >
                    <span className="flex-shrink-0 font-medium" aria-hidden="true">–</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variant selector */}
          {content.variant_options.length > 0 && (
            <div className="relative w-full max-w-xs">
              <select
                id="phn-variant-select"
                value={selectedVariant}
                onChange={handleVariantChange}
                aria-label="Select product variant"
                className="w-full appearance-none rounded border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="" disabled>
                  Select Variant
                </option>
                {content.variant_options.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <ChevronDownIcon />
              </span>
            </div>
          )}

          {/* Price row */}
          {(content.sample_price || content.volume_price) && (
            <div className="phn-price-row">
              {content.sample_price && (
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-xs font-medium"
                    style={{ color: meta.priceLabelColor }}
                  >
                    Sample Price
                  </span>
                  <span
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: meta.priceValueColor }}
                  >
                    {content.sample_currency}&nbsp;{content.sample_price}
                  </span>
                </div>
              )}
              {content.volume_price && (
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-xs font-medium"
                    style={{ color: meta.priceLabelColor }}
                  >
                    Volume Price
                  </span>
                  <span
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: meta.priceValueColor }}
                  >
                    {content.volume_currency}&nbsp;{content.volume_price}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* CTA buttons */}
          <div className="phn-btn-row">
            {/* BUY NOW — text in main area, cart icon in right accent strip */}
            <Link
              href={safeBuyNowUrl}
              className="phn-btn-split"
              style={{ color: meta.buyNowTextColor }}
              aria-label="Buy now"
            >
              <span
                className="phn-btn-main"
                style={{ backgroundColor: meta.buyNowBgColor }}
              >
                BUY NOW
              </span>
              <span
                className="phn-btn-accent"
                style={{ backgroundColor: '#1a9e4a' }}
              >
                <CartIcon />
              </span>
            </Link>

            {/* DOWNLOAD */}
            <div className="flex flex-col items-center gap-0.5">
              <Link
                href={safeDownloadUrl}
                className="phn-btn-split"
                style={{ color: meta.downloadTextColor }}
                aria-label={content.download_label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span
                  className="phn-btn-main"
                  style={{ backgroundColor: meta.downloadBgColor }}
                >
                  {content.download_label}
                </span>
                <span
                  className="phn-btn-accent"
                  style={{ backgroundColor: '#2d4a63' }}
                >
                  <DownloadIcon />
                </span>
              </Link>
              {content.download_sub_label && (
                <span className="text-[11px] text-gray-500">
                  {content.download_sub_label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── AD COLUMN (optional third column) ─────────────────────────────── */}
        {activeAd && (
          <div className="phn-ad-col">
            <AdBanner ad={activeAd} />
          </div>
        )}
      </div>
    </section>
  );
}
