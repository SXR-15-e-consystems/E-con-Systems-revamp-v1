'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

import { sanitizeHtml, sanitizeUrl } from '@/lib/security';
import type { FAQNewData, FAQNewMeta, FAQNewContent } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — FAQNewBlock
// Card-style accordion FAQ. Each item is a rounded card:
//   collapsed → gray bg, question + [+] circle button
//   expanded  → white bg, question + [×] circle button + HTML answer + optional CTA link
// Supports full HTML in answers (links, bold, lists) via DOMPurify.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  data: Record<string, unknown>;
}

const DEFAULT_META: FAQNewMeta = {
  bgColor: '#f3f4f6',
  headingColor: '#111827',
  headingSize: '1.875rem',
  headingAlign: 'center',
  cardCollapsedBg: '#f3f4f6',
  cardExpandedBg: '#ffffff',
  cardBorderRadius: '12px',
  questionColor: '#111827',
  questionFontSize: '1rem',
  answerColor: '#4b5563',
  answerFontSize: '0.9375rem',
  linkColor: '#2563eb',
  btnBgColor: '#ffffff',
  btnIconColor: '#374151',
  sectionPadding: '60px 0',
};

export function FAQNewBlock({ data }: Props) {
  const raw = data as unknown as FAQNewData;
  const meta: FAQNewMeta = { ...DEFAULT_META, ...raw.meta };
  const content: FAQNewContent = {
    heading: raw.content?.heading ?? '',
    items: raw.content?.items ?? [],
  };

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = useCallback((i: number) => {
    setOpenIdx((prev) => (prev === i ? null : i));
  }, []);

  if (!content.heading && content.items.length === 0) return null;

  const headingAlignClass =
    { left: 'text-left', center: 'text-center', right: 'text-right' }[meta.headingAlign] ??
    'text-center';

  return (
    <section style={{ backgroundColor: meta.bgColor, padding: meta.sectionPadding }}>
      <style>{`
        .faqnew-answer a {
          color: ${meta.linkColor};
          text-decoration: underline;
        }
        .faqnew-answer a:hover { opacity: 0.8; }
        .faqnew-answer p { margin-bottom: 0.75em; }
        .faqnew-answer p:last-child { margin-bottom: 0; }
        .faqnew-answer ul { list-style: disc; padding-left: 1.5em; margin-bottom: 0.75em; }
        .faqnew-answer ol { list-style: decimal; padding-left: 1.5em; margin-bottom: 0.75em; }
        .faqnew-answer strong { font-weight: 600; }
        .faqnew-question{
            color: ${meta.questionColor};
            font-size: ${meta.questionFontSize};
            padding:0 1em;
        }
        .faqnew-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: ${meta.btnBgColor};
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
          box-shadow: 0 1px 5px rgba(0,0,0,0.14);
        }
        .faqnew-btn:hover { filter: brightness(0.96); }
      `}</style>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        {content.heading && (
          <h2
            className={`font-bold mb-10 ${headingAlignClass}`}
            style={{ color: meta.headingColor, fontSize: meta.headingSize }}
          >
            {content.heading}
          </h2>
        )}

        {/* FAQ cards */}
        <div className="flex flex-col gap-4">
          {content.items.map((item, i) => {
            const isOpen = openIdx === i;
            const answerHtml = sanitizeHtml(item.answer ?? '');
            const linkHref = sanitizeUrl(item.link_href);
            const isExternal = linkHref.startsWith('http');

            return (
              <div
                key={i}
                style={{
                  backgroundColor: isOpen ? meta.cardExpandedBg : meta.cardCollapsedBg,
                  borderRadius: meta.cardBorderRadius,
                  boxShadow: isOpen ? '0 2px 14px rgba(0,0,0,0.09)' : 'none',
                  transition: 'background-color 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Question row — full-width clickable */}
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                  style={{
                    padding: '1em',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  aria-expanded={isOpen}
                >
                  <span
                    className="font-semibold leading-snug faqnew-question"
                    style={{ color: meta.questionColor, fontSize: meta.questionFontSize }}
                  >
                    {item.question}
                  </span>
                  <span className="faqnew-btn" aria-hidden="true">
                    {isOpen ? (
                      /* × */
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path
                          d="M1 1l11 11M12 1L1 12"
                          stroke={meta.btnIconColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      /* + */
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path
                          d="M6.5 1v11M1 6.5h11"
                          stroke={meta.btnIconColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </span>
                </button>

                {/* Answer (open only) */}
                {isOpen && (
                  <div style={{ padding: '0 24px 24px 24px' }}>
                    {answerHtml && (
                      <div
                        className="faqnew-answer"
                        style={{
                          color: meta.answerColor,
                          fontSize: meta.answerFontSize,
                          lineHeight: '1.75',
                        }}
                        dangerouslySetInnerHTML={{ __html: answerHtml }}
                      />
                    )}

                    {/* Optional CTA link below answer */}
                    {linkHref && item.link_text && (
                      <Link
                        href={linkHref}
                        className="inline-flex items-center gap-1.5 mt-3 font-semibold"
                        style={{
                          color: meta.linkColor,
                          fontSize: meta.answerFontSize,
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                        }}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                      >
                        {item.link_text}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            d="M5 12h14M12 5l7 7-7 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
