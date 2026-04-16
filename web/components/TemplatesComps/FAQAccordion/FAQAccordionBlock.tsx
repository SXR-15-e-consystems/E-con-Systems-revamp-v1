'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

import { sanitizeHtml, sanitizeUrl } from '@/lib/security';
import type { FAQAccordionData, FAQAccordionMeta, FAQAccordionContent } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — FAQAccordionBlock
// Accordion FAQ section for hub pages: numbered or plain items with
// expand/collapse, section heading, and optional "know more" link.
// ─────────────────────────────────────────────────────────────────────────────

interface FAQAccordionBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: FAQAccordionMeta = {
  bgColor: '#ffffff',
  questionColor: '#1f2937',
  questionFontSize: '16px',
  answerColor: '#4b5563',
  answerFontSize: '14px',
  borderColor: '#e5e7eb',
  numbered: true,
  width: '100%',
  headingColor: '#111827',
  headingAlign: 'left',
};

const HEADING_ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function FAQAccordionBlock({ data }: FAQAccordionBlockProps) {
  const raw = data as unknown as FAQAccordionData;
  const meta: FAQAccordionMeta = { ...DEFAULT_META, ...raw.meta };
  const content: FAQAccordionContent = { ...({} as FAQAccordionContent), ...raw.content };

  const heading = content.heading ?? '';
  const items = content.items ?? [];
  const knowMoreText = content.know_more_text ?? '';
  const knowMoreLink = sanitizeUrl(content.know_more_link);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback((idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  }, []);

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

        <div className="divide-y" style={{ borderColor: meta.borderColor }}>
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            const answerHtml = sanitizeHtml(item.answer ?? '');

            return (
              <div
                key={idx}
                style={{ borderColor: meta.borderColor }}
                className={idx === 0 ? 'border-t' : ''}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center gap-3 py-4 text-left transition-colors hover:opacity-80"
                  aria-expanded={isOpen}
                >
                  {meta.numbered && (
                    <span
                      className="shrink-0 font-semibold"
                      style={{ color: meta.questionColor, fontSize: meta.questionFontSize }}
                    >
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                  )}
                  <span
                    className="flex-1 font-medium"
                    style={{ color: meta.questionColor, fontSize: meta.questionFontSize }}
                  >
                    {item.question}
                  </span>
                  <svg
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: meta.questionColor }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div
                      className="pb-4 pt-2"
                      style={{
                        color: meta.answerColor,
                        fontSize: meta.answerFontSize,
                        paddingLeft: meta.numbered ? '2.25rem' : undefined,
                      }}
                      dangerouslySetInnerHTML={{ __html: answerHtml }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {knowMoreText && knowMoreLink && (
          <div className="mt-8 text-center">
            <Link
              href={knowMoreLink}
              className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {knowMoreText} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
