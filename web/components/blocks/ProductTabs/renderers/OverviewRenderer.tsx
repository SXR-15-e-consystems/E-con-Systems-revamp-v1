'use client';

import { useState } from 'react';

import { sanitizeHtml, sanitizeUrl } from '@/lib/security';
import type { DatasheetCTA, DocumentsTabContent, RichTextTabContent } from '@/types/templates';

import { DownloadFormModal } from './DownloadFormModal';

interface Props {
  data: RichTextTabContent;
  datasheetCta?: DatasheetCTA;
  documentsData?: DocumentsTabContent;
  recaptchaSiteKey?: string;
}

export function OverviewRenderer({ data, datasheetCta, documentsData, recaptchaSiteKey }: Props) {
  const safeHtml = sanitizeHtml(data.html ?? '');
  const [showDownloadForm, setShowDownloadForm] = useState(false);

  // Collect all documents from the documents tab for the download form
  const allDocs = (documentsData?.groups ?? []).flatMap((g) =>
    g.items.map((item) => ({ name: item.name, url: item.url })),
  );

  return (
    <div>
      {safeHtml ? (
        <div
          className="prose prose-sm max-w-none text-slate-700
            [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-700
            [&_a]:text-[#1762af] [&_a]:underline [&_a]:text-sm
            [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-1.5
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-sm
            [&_ul>li:not(.nobullet)]:relative [&_ul>li:not(.nobullet)]:pl-6 [&_ul>li:not(.nobullet)]:text-sm [&_ul>li:not(.nobullet)]:leading-relaxed [&_ul>li:not(.nobullet)]:text-slate-700
            [&_ul>li:not(.nobullet)]:before:content-['\2713'] [&_ul>li:not(.nobullet)]:before:absolute [&_ul>li:not(.nobullet)]:before:left-0
            [&_ul>li:not(.nobullet)]:before:text-green-600 [&_ul>li:not(.nobullet)]:before:font-bold
            prose-headings:text-slate-900 prose-headings:font-bold
            prose-strong:text-slate-900"
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

      {/* Datasheet CTA line */}
      {datasheetCta?.enabled && allDocs.length > 0 && (
        <>
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-700">
              Refer{' '}
              <button
                type="button"
                onClick={() => setShowDownloadForm(true)}
                className="inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:text-blue-800 underline"
              >
                {/* PDF icon */}
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 3.5L18.5 8H14V3.5zM12 17.5a.5.5 0 01-.5-.5v-1h-1a.5.5 0 010-1h1v-1a.5.5 0 011 0v1h1a.5.5 0 010 1h-1v1a.5.5 0 01-.5.5z" />
                  <path d="M8.5 13h-.25a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0V15.5h.25a1.25 1.25 0 000-2.5zm0 1.5H8.25v-.5h.25a.25.25 0 010 .5zM11.5 13h-.5a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h.5a1.75 1.75 0 001.75-1.75v-.5A1.75 1.75 0 0011.5 13zm.75 2.25a.75.75 0 01-.75.75H11.5h-.5v-2h.5a.75.75 0 01.75.75v.5z" />
                </svg>
                {datasheetCta.label || 'Datasheet'}
              </button>{' '}
              for complete details
            </p>
          </div>
          <DownloadFormModal
            open={showDownloadForm}
            onClose={() => setShowDownloadForm(false)}
            documents={allDocs}
            recaptchaSiteKey={recaptchaSiteKey ?? ''}
          />
        </>
      )}
    </div>
  );
}
