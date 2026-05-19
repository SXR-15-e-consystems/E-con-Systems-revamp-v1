'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';

import { sanitizeUrl } from '@/lib/security';
import { getUiStrings } from '@/lib/ui-strings';
import type { UiStrings } from '@/lib/ui-strings';
import { useLivePricing } from '@/hooks/useLivePricing';
import { useModal } from '@/hooks/useModal';
import { ContactUsModal } from './ContactUsModal';
import { DownloadFormModal } from '../../blocks/ProductTabs/renderers/DownloadFormModal';
import type {
  ProductHeroNewData,
  ProductHeroNewMeta,
  ProductHeroNewContent,
  ProductHighlightIcon,
  ProductHeroAdItem,
  ProductPriceResult,
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

function MailIcon() {
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
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
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
  const t = getUiStrings(data.__ui as UiStrings | undefined);
  const meta: ProductHeroNewMeta = { ...DEFAULT_META, ...typed.meta };
  const pageProductName = (data.__page_product_name as string) ?? '';
  const content: ProductHeroNewContent = {
    sku_badge: typed.content?.sku_badge ?? '',
    title: typed.content?.title ?? '',
    images: typed.content?.images ?? [],
    partner_logos: typed.content?.partner_logos ?? [],
    highlights: typed.content?.highlights ?? [],
    highlight_icons: typed.content?.highlight_icons ?? [],
    show_highlight_icons: typed.content?.show_highlight_icons ?? false,
    variant_options: typed.content?.variant_options ?? [],
    variant_product_codes: typed.content?.variant_product_codes,
    product_codes: typed.content?.product_codes,
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

  // ── Live pricing ─────────────────────────────────────────────────────────
  const { priceMap, loading: priceLoading } = useLivePricing(content.product_codes);
  const contactModal = useModal();

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

  // Resolve live pricing for the currently selected variant
  const currentCode = content.variant_product_codes?.[selectedVariant];
  const livePrice: ProductPriceResult | null =
    currentCode && priceMap[currentCode] ? priceMap[currentCode] : null;

  const isContactUs = livePrice?.purchaseType === 'contact_us';
  const displayPrice = livePrice?.price != null
    ? String(livePrice.price)
    : content.sample_price;

  const safeDownloadUrl = content.download_url ? sanitizeUrl(content.download_url) : '#';
  void safeDownloadUrl; // kept for potential use; DOWNLOAD button now opens modal
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const safeBuyNowUrl = content.buy_now_url ? sanitizeUrl(content.buy_now_url) : '#';
  // If product has a code, append it as a query param for the webstore
  const buyNowHref = currentCode
    ? `${safeBuyNowUrl}${safeBuyNowUrl.includes('?') ? '&' : '?'}productId=${encodeURIComponent(currentCode)}`
    : safeBuyNowUrl;
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
          padding: clamp(12px, 2vw, 24px) clamp(16px, 2.5vw, 32px);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Icon strip — same gray bg as the left panel */
        .phn-icon-strip {
          width: 88px;
          flex-shrink: 0;
          background-color: ${meta.bgColor};
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
          padding: 36px 16px 36px 8px;
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
          padding: clamp(12px, 2vw, 28px) clamp(16px, 3vw, 40px);
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
                  style={{ aspectRatio: '16/9' }}
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
        <div className="phn-right-col flex flex-col gap-3">

          {/* Partner logos */}
          {content.partner_logos.length > 0 && (
            <div className="phn-partner-logos">
              {content.partner_logos.map((logo, i) => {
                const logoSrc = sanitizeUrl(logo.image_url, false);
                const logoHref = logo.href ? sanitizeUrl(logo.href) : null;
                const imgEl = (
                  <Image
                    src={logoSrc}
                    alt={logo.image_alt}
                    width={0}
                    height={0}
                    sizes="120px"
                    style={{
                      height: meta.partnerLogosHeight,
                      width: 'auto',
                      maxWidth: '120px',
                    }}
                    className="object-contain flex-shrink-0"
                  />
                );
                return logoHref ? (
                  <Link
                    key={i}
                    href={logoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    {imgEl}
                  </Link>
                ) : (
                  <div key={i} className="flex-shrink-0">{imgEl}</div>
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
                    className="flex items-start gap-2 text-sm leading-snug py-1"
                    style={{ color: meta.highlightBulletColor }}
                  >
                    <span className="flex-shrink-0 font-medium" aria-hidden="true">–</span>
                    <span className="font-semibold">{h}</span>
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
          {(displayPrice || content.volume_price) && (
            <div className="phn-price-row">
              {displayPrice && (
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-xs font-medium"
                    style={{ color: meta.priceLabelColor }}
                  >
                    {t.samplePrice}
                  </span>
                  {priceLoading ? (
                    <span className="h-8 w-20 animate-pulse rounded bg-gray-200" />
                  ) : (
                    <span
                      className="text-2xl font-bold tracking-tight"
                      style={{ color: meta.priceValueColor }}
                    >
                      {content.sample_currency}&nbsp;{displayPrice}
                    </span>
                  )}
                </div>
              )}
              {!isContactUs && content.volume_price && (
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-xs font-medium"
                    style={{ color: meta.priceLabelColor }}
                  >
                    {t.volumePrice}
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
            {isContactUs ? (
              /* CONTACT US — opens popup form, no navigation */
              <button
                type="button"
                onClick={contactModal.open}
                className="phn-btn-split"
                style={{ color: meta.downloadTextColor }}
                aria-label="Contact us about this product"
              >
                <span
                  className="phn-btn-main"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  CONTACT US
                </span>
                <span
                  className="phn-btn-accent"
                  style={{ backgroundColor: '#1d4ed8' }}
                >
                  <MailIcon />
                </span>
              </button>
            ) : (
              /* BUY NOW — navigates to webstore */
              <Link
                href={buyNowHref}
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
            )}

            {/* DOWNLOAD */}
            <div className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                className="phn-btn-split"
                style={{ color: meta.downloadTextColor }}
                aria-label={content.download_label}
                onClick={() => setShowDownloadForm(true)}
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
              </button>
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

      {/* Contact Us modal — rendered outside the grid so it portals over everything */}
      <ContactUsModal
        isOpen={contactModal.isOpen}
        onClose={contactModal.close}
        productName={pageProductName || content.title || content.sku_badge}
      />

      <DownloadFormModal
        open={showDownloadForm}
        onClose={() => setShowDownloadForm(false)}
        documents={
          content.download_url
            ? [{ name: content.download_label ?? 'Download', url: content.download_url }]
            : []
        }
        productName={pageProductName || content.title || content.sku_badge}
      />
    </section>
  );
}
