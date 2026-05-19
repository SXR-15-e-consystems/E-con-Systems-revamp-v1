'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';

import { sanitizeUrl } from '@/lib/security';
import { getUiStrings } from '@/lib/ui-strings';
import type { UiStrings } from '@/lib/ui-strings';
import type {
  ProductHeroData,
  ProductHeroMeta,
  ProductHeroContent,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — ProductHeroBlock
// New product page hero: SKU badge · title · image slider · partner logos ·
// highlights · variant selector · sample + volume price · BUY NOW + DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────

interface ProductHeroBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: ProductHeroMeta = {
  bgColor: '#f5f5f5',
  badgeBgColor: '#1a1a1a',
  badgeTextColor: '#ffffff',
  titleColor: '#111111',
  highlightBulletColor: '#444444',
  imageBgColor: '#ffffff',
  buyNowBgColor: '#22c55e',
  buyNowTextColor: '#ffffff',
  downloadBgColor: '#1a1a1a',
  downloadTextColor: '#ffffff',
  partnerLogosHeight: '32px',
};

// ── Cart icon (shopping cart SVG) ──────────────────────────────────────────
function CartIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

// ── Download icon ──────────────────────────────────────────────────────────
function DownloadIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ── Image slider (left thumbnails + main image) ────────────────────────────
function ProductImageSlider({
  images,
  bgColor,
}: {
  images: ProductHeroContent['images'];
  bgColor: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (images.length === 0) return null;

  const active = images[activeIdx] ?? images[0];

  return (
    <div className="ph-image-slider flex h-full w-full gap-3">
      {/* Thumbnail column */}
      {images.length > 1 && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={img.image_alt || `Product image ${i + 1}`}
              className={`relative h-16 w-16 rounded border-2 overflow-hidden flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                i === activeIdx ? 'border-blue-600' : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: bgColor }}
            >
              <Image
                src={sanitizeUrl(img.image_url, false)}
                alt={img.image_alt}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div
        className="relative flex-1 min-h-0 rounded-lg overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        <Image
          src={sanitizeUrl(active.image_url, false)}
          alt={active.image_alt}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
    </div>
  );
}

// ── Main block ────────────────────────────────────────────────────────────
export function ProductHeroBlock({ data }: ProductHeroBlockProps) {
  const typed = data as unknown as ProductHeroData;
  const t = getUiStrings(data.__ui as UiStrings | undefined);
  const meta: ProductHeroMeta = { ...DEFAULT_META, ...typed.meta };
  const content: ProductHeroContent = {
    sku_badge: typed.content?.sku_badge ?? '',
    title: typed.content?.title ?? '',
    images: typed.content?.images ?? [],
    partner_logos: typed.content?.partner_logos ?? [],
    highlights: typed.content?.highlights ?? [],
    variant_options: typed.content?.variant_options ?? [],
    sample_price: typed.content?.sample_price ?? '',
    sample_currency: typed.content?.sample_currency ?? 'USD',
    volume_price: typed.content?.volume_price,
    volume_currency: typed.content?.volume_currency ?? 'USD',
    buy_now_url: typed.content?.buy_now_url,
    download_url: typed.content?.download_url,
  };

  const [selectedVariant, setSelectedVariant] = useState(
    content.variant_options[0] ?? '',
  );

  const handleVariantChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedVariant(e.target.value),
    [],
  );

  const safeDownloadUrl = content.download_url
    ? sanitizeUrl(content.download_url)
    : '#';
  const safeBuyNowUrl = content.buy_now_url
    ? sanitizeUrl(content.buy_now_url)
    : '#';

  return (
    <section
      className="ph-root w-full"
      style={{ backgroundColor: meta.bgColor }}
    >
      {/* ── Scoped responsive styles ─────────────────────────────── */}
      <style>{`
        .ph-root {
          padding: clamp(16px, 3vw, 40px) clamp(16px, 4vw, 48px);
        }
        .ph-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(24px, 4vw, 56px);
          align-items: start;
        }
        .ph-image-col {
          min-height: clamp(260px, 40vw, 440px);
        }
        .ph-image-slider {
          height: clamp(260px, 40vw, 440px);
        }
        @media (max-width: 767px) {
          .ph-grid {
            grid-template-columns: 1fr;
          }
          .ph-image-col {
            min-height: 260px;
            order: -1;
          }
        }
        .ph-price-row {
          display: flex;
          gap: clamp(16px, 4vw, 40px);
          flex-wrap: wrap;
        }
        .ph-btn-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .ph-btn-row {
            flex-direction: column;
          }
          .ph-btn-row a {
            width: 100%;
            justify-content: center;
          }
        }
        .ph-partner-logos {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
      `}</style>

      <div className="ph-grid mx-auto max-w-screen-xl">
        {/* ── LEFT: Image slider ─────────────────────────────────── */}
        <div className="ph-image-col">
          <ProductImageSlider
            images={content.images}
            bgColor={meta.imageBgColor}
          />
        </div>

        {/* ── RIGHT: Info panel ─────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Partner logos */}
          {content.partner_logos.length > 0 && (
            <div className="ph-partner-logos">
              {content.partner_logos.map((logo, i) => {
                const logoSrc = sanitizeUrl(logo.image_url, false);
                const logoHref = logo.href ? sanitizeUrl(logo.href) : null;
                const imgEl = (
                  <div
                    key={i}
                    className="relative flex-shrink-0"
                    style={{ height: meta.partnerLogosHeight, width: 'auto', minWidth: '40px' }}
                  >
                    <Image
                      src={logoSrc}
                      alt={logo.image_alt}
                      fill
                      className="object-contain"
                      sizes="80px"
                    />
                  </div>
                );
                return logoHref ? (
                  <Link key={i} href={logoHref} target="_blank" rel="noopener noreferrer">
                    {imgEl}
                  </Link>
                ) : (
                  imgEl
                );
              })}
            </div>
          )}

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
              className="text-xl font-bold leading-snug sm:text-2xl lg:text-3xl"
              style={{ color: meta.titleColor }}
            >
              {content.title}
            </h1>
          )}

          {/* Highlights */}
          {content.highlights.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Highlights</p>
              <ul className="space-y-1.5">
                {content.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-relaxed"
                    style={{ color: meta.highlightBulletColor }}
                  >
                    <span className="mt-1.5 h-[5px] w-[5px] flex-shrink-0 rounded-full bg-current" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Variant selector */}
          {content.variant_options.length > 0 && (
            <div>
              <label
                htmlFor="ph-variant-select"
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Select Variant
              </label>
              <div className="relative w-full max-w-xs">
                <select
                  id="ph-variant-select"
                  value={selectedVariant}
                  onChange={handleVariantChange}
                  className="w-full appearance-none rounded border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {content.variant_options.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>
          )}

          {/* Prices */}
          {(content.sample_price || content.volume_price) && (
            <div className="ph-price-row">
              {content.sample_price && (
                <div>
                  <p className="text-xs text-gray-500">{t.samplePrice}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {content.sample_currency} {content.sample_price}
                  </p>
                </div>
              )}
              {content.volume_price && (
                <div>
                  <p className="text-xs text-gray-500">{t.volumePrice}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {content.volume_currency ?? 'USD'} {content.volume_price}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="ph-btn-row">
            {/* BUY NOW — with cart icon */}
            <Link
              href={safeBuyNowUrl}
              className="inline-flex items-center gap-2 rounded px-6 py-3 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                backgroundColor: meta.buyNowBgColor,
                color: meta.buyNowTextColor,
              }}
            >
              <CartIcon className="h-4 w-4" />
              BUY NOW
            </Link>

            {/* DOWNLOAD — with download icon + sub-label */}
            <Link
              href={safeDownloadUrl}
              className="inline-flex flex-col items-center rounded px-6 py-2.5 text-sm font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                backgroundColor: meta.downloadBgColor,
                color: meta.downloadTextColor,
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="flex items-center gap-2">
                DOWNLOAD
                <DownloadIcon className="h-4 w-4" />
              </span>
              <span className="mt-0.5 text-[10px] font-normal opacity-75">
                ( Technical documents )
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
