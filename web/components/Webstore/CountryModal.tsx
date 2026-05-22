'use client';

import { useEffect, useRef } from 'react';
import type { WebstoreDistributor } from '@/types';

interface Props {
  onClose: () => void;
  distributor: WebstoreDistributor | null;
  country: string;
}

export function CountryModal({ onClose, distributor, country }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const hasDistributor = distributor && (distributor.name || distributor.email || distributor.phone);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Contact Sales</h2>
            <p className="text-xs text-slate-400 mt-0.5">Region: {country}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {hasDistributor ? (
            <>
              {distributor!.message && (
                <p className="text-sm text-slate-600 border-l-4 border-blue-400 pl-4 italic">{distributor!.message}</p>
              )}
              <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200 overflow-hidden">
                {distributor!.name && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 0 1 0-1.5h12.5a.75.75 0 0 1 0 1.5H16v13h.25a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75v-2.5a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 1-.75.75h-3.5a.75.75 0 0 1 0-1.5H4Z" clipRule="evenodd" /></svg>
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{distributor!.name}</span>
                  </div>
                )}
                {distributor!.email && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
                    </span>
                    <a href={`mailto:${distributor!.email}`} className="text-sm font-medium text-blue-600 hover:underline">{distributor!.email}</a>
                  </div>
                )}
                {distributor!.phone && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" /></svg>
                    </span>
                    <a href={`tel:${distributor!.phone}`} className="text-sm font-medium text-slate-700">{distributor!.phone}</a>
                  </div>
                )}
                {distributor!.website && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2ZM5.904 9.458a6.5 6.5 0 0 1 .908-2.443A6.004 6.004 0 0 1 8.5 3.72V9.5H5.904ZM8.5 11H5.888a6.004 6.004 0 0 0 2.47 4.22L8.5 11Zm1.5 0v4.28a6.004 6.004 0 0 0 2.112-4.28H10Zm0-1.5V3.72a6.004 6.004 0 0 1 1.688 3.295L10 9.5Zm1.5 0h2.597a6.004 6.004 0 0 0-.909-2.444A6.004 6.004 0 0 0 11.5 3.72V9.5Zm0 1.5v4.28a6.004 6.004 0 0 0 2.47-4.28H11.5Z" /></svg>
                    </span>
                    <a href={distributor!.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{distributor!.website}</a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-5">
              <p className="text-sm font-semibold text-blue-800 mb-1">Contact e-con Systems</p>
              <p className="text-sm text-blue-700">For purchasing assistance in your region, please reach out to our sales team:</p>
              <a href="mailto:sales@e-consystems.com" className="mt-2 inline-flex items-center text-sm font-semibold text-blue-700 hover:underline">
                sales@e-consystems.com
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 transition-colors"
          >Close</button>
        </div>
      </div>
    </div>
  );
}
