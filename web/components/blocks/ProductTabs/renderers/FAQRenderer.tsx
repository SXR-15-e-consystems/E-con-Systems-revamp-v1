'use client';

import { useCallback, useState } from 'react';

import { sanitizeHtml } from '@/lib/security';
import type { FAQTabContent } from '@/types/templates';

interface Props {
  data: FAQTabContent;
}

export function FAQRenderer({ data }: Props) {
  const items = data.items ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback((i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  }, []);

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No FAQs available.</p>;
  }

  return (
    <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const safeAnswer = sanitizeHtml(item.answer ?? '');

        return (
          <div key={`faq-${i}`}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-medium text-slate-800 pr-4">{item.question}</span>
              <svg
                className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && safeAnswer && (
              <div
                className="px-4 pb-4 prose prose-sm max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: safeAnswer }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
