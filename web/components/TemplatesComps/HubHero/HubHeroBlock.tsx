'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback, FormEvent } from 'react';

import { useModal } from '@/hooks/useModal';
import { useSlider } from '@/hooks/useSlider';
import { sanitizeHtml, sanitizeUrl } from '@/lib/security';
import type {
  HubHeroData,
  HubHeroMeta,
  HubHeroContent,
  HubHeroSlide,
  HubHeroDocument,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — HubHeroBlock
// Split-layout hero for hub pages: title + description on one side,
// product image (or slider) + optional brand badge on the other.
// CTA supports link navigation, contact popup form, or download popup.
// ─────────────────────────────────────────────────────────────────────────────

interface HubHeroBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: HubHeroMeta = {
  bgColor: '#ffffff',
  titleColor: '#1a1a2e',
  titleFontSize: '32px',
  descriptionColor: '#374151',
  descriptionFontSize: '15px',
  imagePosition: 'right',
  contentWidth: '50%',
  mediaWidth: '50%',
  mediaMode: 'single',
  width: '100%',
  ctaBgColor: '#2563eb',
  ctaTextColor: '#ffffff',
  titleAlign: 'left',
  brandBadgePosition: 'below-image',
  brandBadgeWidth: '120px',
  brandBadgeHeight: '40px',
};

// ── Contact Popup ────────────────────────────────────────────────────────────

interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
  formTitle: string;
  ctaBgColor: string;
  ctaTextColor: string;
}

function ContactPopup({ isOpen, onClose, formTitle, ctaBgColor, ctaTextColor }: ContactPopupProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitted(true);
    },
    [],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">✓</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Thank you!</h3>
            <p className="text-sm text-gray-600">We will get back to you shortly.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-5 py-2 rounded text-sm font-semibold"
              style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-4 pr-8">
              {formTitle || 'Contact Us'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  required
                  type="text"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="How can we help?"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded px-4 py-2.5 text-sm font-semibold tracking-wide uppercase"
                style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
              >
                Send Message
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Download Popup ───────────────────────────────────────────────────────────

interface DownloadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  documents: HubHeroDocument[];
  ctaBgColor: string;
  ctaTextColor: string;
}

function DownloadPopup({
  isOpen,
  onClose,
  documents,
  ctaBgColor,
  ctaTextColor,
}: DownloadPopupProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-gray-900 mb-4 pr-8">Download Documents</h3>

        {documents.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No documents available.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {documents.map((doc, idx) => {
              const docUrl = sanitizeUrl(doc.url);
              if (!docUrl) return null;
              return (
                <li key={idx} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.name || 'Document'}
                    </p>
                    {doc.file_type && (
                      <span className="text-xs text-gray-500 uppercase">{doc.file_type}</span>
                    )}
                  </div>
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded px-4 py-1.5 text-xs font-semibold tracking-wide uppercase transition-opacity hover:opacity-90"
                    style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
                  >
                    Download
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Image Slider ─────────────────────────────────────────────────────────────

interface HeroSliderProps {
  slides: HubHeroSlide[];
}

function HeroSlider({ slides }: HeroSliderProps) {
  const validSlides = slides.filter((s) => sanitizeUrl(s.image_url));
  const { activeIndex, goTo, next, prev, pause } = useSlider(validSlides.length, 4000);

  if (validSlides.length === 0) return null;

  return (
    <div className="relative w-full max-w-md">
      {/* Slide image */}
      <div className="relative aspect-square w-full overflow-hidden rounded">
        {validSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-500 ${
              idx === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={sanitizeUrl(slide.image_url)}
              alt={slide.image_alt || `Slide ${idx + 1}`}
              fill
              className="object-contain"
              priority={idx === 0}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {validSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => {
              pause();
              prev();
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow hover:bg-white transition-colors"
            aria-label="Previous slide"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              pause();
              next();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow hover:bg-white transition-colors"
            aria-label="Next slide"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {validSlides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {validSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                pause();
                goTo(idx);
              }}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === activeIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function HubHeroBlock({ data }: HubHeroBlockProps) {
  const raw = data as unknown as HubHeroData;
  const meta: HubHeroMeta = { ...DEFAULT_META, ...raw.meta };
  const content: HubHeroContent = { ...({} as HubHeroContent), ...raw.content };

  const title = content.title ?? '';
  const descriptionHtml = sanitizeHtml(content.description ?? '');
  const imageUrl = sanitizeUrl(content.image_url);
  const imageAlt = content.image_alt ?? '';
  const badgeUrl = sanitizeUrl(content.brand_badge_url);
  const badgeAlt = content.brand_badge_alt ?? '';
  const ctaText = content.cta_text ?? '';
  const ctaLink = sanitizeUrl(content.cta_link);
  const ctaType = content.cta_type ?? 'link';
  const ctaContactTitle = content.cta_contact_title ?? '';
  const images: HubHeroSlide[] = content.images ?? [];
  const documents: HubHeroDocument[] = content.cta_documents ?? [];

  const contactModal = useModal();
  const downloadModal = useModal();

  if (!title && !imageUrl && images.length === 0) return null;

  const isImageRight = meta.imagePosition === 'right';
  const isSliderMode = meta.mediaMode === 'slider';
  const badgeW = parseInt(meta.brandBadgeWidth) || 120;
  const badgeH = parseInt(meta.brandBadgeHeight) || 40;
  const isBadgeInTitleRow = meta.brandBadgePosition === 'title-row-right';

  // Make title font size responsive: scale down to ~60% on very small screens
  const titlePx = parseInt(meta.titleFontSize);
  const responsiveTitleSize = titlePx
    ? `clamp(${Math.max(16, Math.round(titlePx * 0.6))}px, 4vw, ${titlePx}px)`
    : meta.titleFontSize;

  return (
    <>
      <section
        style={{
          width: meta.width,
          maxWidth: '100%',
          backgroundColor: meta.bgColor,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div
            className={`flex flex-col items-center gap-8 lg:gap-12 ${
              isImageRight ? 'lg:flex-row' : 'lg:flex-row-reverse'
            }`}
          >
            {/* ── Text column ── */}
            <div className="w-full lg:w-auto min-w-0" style={{ flex: `0 1 ${meta.contentWidth}` }}>
              {/* Title row — optionally includes badge on the right */}
              {title && (
                isBadgeInTitleRow && badgeUrl ? (
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h1
                      className="font-bold leading-tight min-w-0"
                      style={{
                        color: meta.titleColor,
                        fontSize: responsiveTitleSize,
                        textAlign: meta.titleAlign ?? 'left',
                      }}
                    >
                      {title}
                    </h1>
                    <div className="shrink-0">
                      <Image
                        src={badgeUrl}
                        alt={badgeAlt || 'Brand badge'}
                        width={badgeW}
                        height={badgeH}
                        className="h-auto object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <h1
                    className="font-bold leading-tight mb-4"
                    style={{
                      color: meta.titleColor,
                      fontSize: responsiveTitleSize,
                      textAlign: meta.titleAlign ?? 'left',
                    }}
                  >
                    {title}
                  </h1>
                )
              )}

              {descriptionHtml && (
                <div
                  className="prose max-w-none mb-6 [&>p]:mb-3 [&>p:last-child]:mb-0"
                  style={{
                    color: meta.descriptionColor,
                    fontSize: meta.descriptionFontSize,
                  }}
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              )}

              {/* CTA */}
              {ctaText && ctaType === 'link' && ctaLink && (
                <Link
                  href={ctaLink}
                  className="inline-block rounded px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: meta.ctaBgColor,
                    color: meta.ctaTextColor,
                  }}
                >
                  {ctaText}
                </Link>
              )}

              {ctaText && ctaType === 'contact' && (
                <button
                  type="button"
                  onClick={contactModal.open}
                  className="inline-block rounded px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: meta.ctaBgColor,
                    color: meta.ctaTextColor,
                  }}
                >
                  {ctaText}
                </button>
              )}

              {ctaText && ctaType === 'download' && (
                <button
                  type="button"
                  onClick={downloadModal.open}
                  className="inline-block rounded px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-opacity hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: meta.ctaBgColor,
                    color: meta.ctaTextColor,
                  }}
                >
                  {ctaText}
                </button>
              )}
            </div>

            {/* ── Image / Slider column ── */}
            <div
              className="w-full lg:w-auto flex flex-col items-center gap-3 min-w-0"
              style={{ flex: `0 1 ${meta.mediaWidth}` }}
            >
              {isSliderMode && images.length > 0 ? (
                <HeroSlider slides={images} />
              ) : (
                imageUrl && (
                  <div className="relative w-full max-w-md">
                    <Image
                      src={imageUrl}
                      alt={imageAlt || 'Product hero image'}
                      width={600}
                      height={500}
                      className="h-auto w-full object-contain"
                      priority
                    />
                  </div>
                )
              )}

              {badgeUrl && !isBadgeInTitleRow && (
                <div className="flex items-center justify-center">
                  <Image
                    src={badgeUrl}
                    alt={badgeAlt || 'Brand badge'}
                    width={badgeW}
                    height={badgeH}
                    className="h-auto object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popup modals */}
      <ContactPopup
        isOpen={contactModal.isOpen}
        onClose={contactModal.close}
        formTitle={ctaContactTitle}
        ctaBgColor={meta.ctaBgColor}
        ctaTextColor={meta.ctaTextColor}
      />
      <DownloadPopup
        isOpen={downloadModal.isOpen}
        onClose={downloadModal.close}
        documents={documents}
        ctaBgColor={meta.ctaBgColor}
        ctaTextColor={meta.ctaTextColor}
      />
    </>
  );
}
