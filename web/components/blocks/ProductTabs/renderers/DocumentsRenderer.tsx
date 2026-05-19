'use client';

import { useCallback, useState } from 'react';

import { sanitizeUrl } from '@/lib/security';
import type { DocumentsTabContent } from '@/types/templates';

import { DownloadFormModal } from './DownloadFormModal';

interface Props {
  data: DocumentsTabContent;
  recaptchaSiteKey?: string;
  productName?: string;
}

export function DocumentsRenderer({ data, productName }: Props) {
  const groups = data.groups ?? [];

  const [selected, setSelected] = useState<Set<string>>(() => {
    const all = new Set<string>();
    groups.forEach((g) => g.items.forEach((item) => all.add(item.url)));
    return all;
  });

  const [showForm, setShowForm] = useState(false);

  const toggleItem = useCallback((url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  }, []);

  const handleDownload = useCallback(() => {
    if (selected.size === 0) return;
    setShowForm(true);
  }, [selected]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
  }, []);

  // Build list of selected documents with names for the modal
  const selectedDocuments = groups.flatMap((g) =>
    g.items
      .filter((item) => selected.has(item.url))
      .map((item) => ({
        name: item.name,
        url: sanitizeUrl(item.url) || item.url,
      })),
  );

  if (groups.length === 0) {
    return <p className="text-sm text-slate-400">No documents available.</p>;
  }

  return (
    <div className="space-y-5">
      {groups.map((group, gi) => (
        <div key={`doc-group-${gi}`}>
          <h3 className="text-sm font-bold text-slate-900 mb-2">{group.title}</h3>
          <ul className="space-y-2">
            {group.items.map((item, ii) => (
              <li key={`doc-item-${gi}-${ii}`}>
                <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={selected.has(item.url)}
                    onChange={() => toggleItem(item.url)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  {item.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <button
        type="button"
        onClick={handleDownload}
        disabled={selected.size === 0}
        className="inline-flex items-center gap-2 rounded bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"
          />
        </svg>
        Documents
      </button>

      <DownloadFormModal
        open={showForm}
        onClose={handleCloseForm}
        documents={selectedDocuments}
        productName={productName}
      />
    </div>
  );
}
