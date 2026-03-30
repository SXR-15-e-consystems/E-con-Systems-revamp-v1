'use client';

import { sanitizeHtml, sanitizeUrl } from '@/lib/security';
import type { RichTextTabContent } from '@/types/templates';

interface Props {
  data: RichTextTabContent;
}

export function OverviewRenderer({ data }: Props) {
  const safeHtml = sanitizeHtml(data.html ?? '');

  return (
    <div>
      {safeHtml ? (
        <div
          className="prose prose-sm max-w-none text-slate-700
            prose-headings:text-slate-900 prose-headings:font-bold
            prose-a:text-blue-600 prose-a:underline
            prose-strong:text-slate-900
            prose-ul:list-disc prose-ul:pl-5
            prose-li:text-sm prose-li:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <p className="text-sm text-slate-400">No content available.</p>
      )}

      {data.links && data.links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {data.links.map((link, i) => {
            const safeUrl = sanitizeUrl(link.url);
            if (!safeUrl) return null;
            return (
              <a
                key={`link-${i}`}
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 underline hover:text-blue-800"
              >
                {link.label}
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
