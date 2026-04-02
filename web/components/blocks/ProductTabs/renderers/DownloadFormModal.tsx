'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { sanitizeFormType } from '@/lib/security';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

// ─────────────────────────────────────────────────────────────────────────────
// DownloadFormModal — popup form for download requests
// Collects user info, validates, submits to /api/v1/public/downloads/request
// reCAPTCHA v3 integration — same pattern as FormBlock.
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

function loadRecaptchaScript(siteKey: string): void {
  if (document.getElementById('recaptcha-script')) return;
  const script = document.createElement('script');
  script.id = 'recaptcha-script';
  script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

async function getRecaptchaToken(siteKey: string, action: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error('reCAPTCHA not loaded'));
      return;
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha!.execute(siteKey, { action }).then(resolve).catch(reject);
    });
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SelectedDocument {
  name: string;
  url: string;
}

interface DownloadFormFields {
  name: string;
  email: string;
  company: string;
  country: string;
  state: string;
  requirements: string;
  howDidYouHear: string;
}

interface DownloadFormModalProps {
  open: boolean;
  onClose: () => void;
  documents: SelectedDocument[];
  recaptchaSiteKey: string;
}

const COUNTRIES = [
  'United States', 'United Kingdom', 'India', 'Germany', 'France',
  'Canada', 'Australia', 'Japan', 'China', 'Singapore', 'Other',
];

const HOW_HEARD_OPTIONS = [
  'Search Engine (Google, Bing, etc.)',
  'Social Media',
  'Industry Event / Trade Show',
  'Referral / Word of Mouth',
  'Technical Publication / Blog',
  'Email Newsletter',
  'Other',
];

const DEFAULT_FIELDS: DownloadFormFields = {
  name: '',
  email: '',
  company: '',
  country: '',
  state: '',
  requirements: '',
  howDidYouHear: '',
};

const inputClass =
  'rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition';

// ── Component ─────────────────────────────────────────────────────────────────

export function DownloadFormModal({
  open,
  onClose,
  documents,
  recaptchaSiteKey,
}: DownloadFormModalProps) {
  const [fields, setFields] = useState<DownloadFormFields>(DEFAULT_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const hasLoadedRecaptcha = useRef(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Load reCAPTCHA script
  useEffect(() => {
    if (recaptchaSiteKey && !hasLoadedRecaptcha.current) {
      loadRecaptchaScript(recaptchaSiteKey);
      hasLoadedRecaptcha.current = true;
    }
  }, [recaptchaSiteKey]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function set<K extends keyof DownloadFormFields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errors: Partial<Record<string, string>> = {};
    if (!fields.name.trim()) errors['name'] = 'Required';
    if (!fields.email.trim()) {
      errors['email'] = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors['email'] = 'Invalid email address';
    }
    if (!fields.company.trim()) errors['company'] = 'Required';
    if (!fields.country) errors['country'] = 'Required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setStatus('submitting');

      try {
        let recaptchaToken = '';
        if (recaptchaSiteKey) {
          recaptchaToken = await getRecaptchaToken(recaptchaSiteKey, 'download_request');
        }

        const payload = {
          ...fields,
          recaptchaToken,
          documents: documents.map((d) => ({ name: d.name, url: d.url })),
        };

        const response = await fetch(`${API_BASE_URL}/public/downloads/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        setStatus('success');
      } catch {
        setStatus('error');
      }
    },
    [fields, documents, recaptchaSiteKey],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  const handleReset = useCallback(() => {
    setFields(DEFAULT_FIELDS);
    setFieldErrors({});
    setStatus('idle');
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Download request form"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={handleReset}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Success state */}
        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-12 w-12 text-green-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900">Request Submitted</h3>
            <p className="text-sm text-gray-600 max-w-xs">
              The download links will be sent to <strong>{fields.email}</strong> shortly.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-3 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 p-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Download Documents</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Fill in your details and we&apos;ll email the download links to you.
              </p>
            </div>

            {/* Selected documents summary */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Selected ({documents.length})
              </span>
              <ul className="mt-1 space-y-0.5">
                {documents.map((doc, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                    {doc.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </span>
                <input
                  className={inputClass}
                  value={fields.name}
                  placeholder="Your name"
                  onChange={(e) => set('name', e.target.value)}
                  autoComplete="name"
                />
                {fieldErrors['name'] && <span className="text-xs text-red-500">{fieldErrors['name']}</span>}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </span>
                <input
                  type="email"
                  className={inputClass}
                  value={fields.email}
                  placeholder="you@company.com"
                  onChange={(e) => set('email', e.target.value)}
                  autoComplete="email"
                />
                {fieldErrors['email'] && <span className="text-xs text-red-500">{fieldErrors['email']}</span>}
              </label>
            </div>

            {/* Company */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                Company <span className="text-red-500">*</span>
              </span>
              <input
                className={inputClass}
                value={fields.company}
                placeholder="Your company"
                onChange={(e) => set('company', e.target.value)}
                autoComplete="organization"
              />
              {fieldErrors['company'] && <span className="text-xs text-red-500">{fieldErrors['company']}</span>}
            </label>

            {/* Country + State */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Country <span className="text-red-500">*</span>
                </span>
                <select
                  className={inputClass}
                  value={fields.country}
                  onChange={(e) => set('country', e.target.value)}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {fieldErrors['country'] && <span className="text-xs text-red-500">{fieldErrors['country']}</span>}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">State / Province</span>
                <input
                  className={inputClass}
                  value={fields.state}
                  placeholder="State or province"
                  onChange={(e) => set('state', e.target.value)}
                  autoComplete="address-level1"
                />
              </label>
            </div>

            {/* Requirements */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Requirements</span>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={fields.requirements}
                placeholder="Describe your requirements…"
                onChange={(e) => set('requirements', e.target.value)}
              />
            </label>

            {/* How did you hear about us */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">How did you hear about us?</span>
              <select
                className={inputClass}
                value={fields.howDidYouHear}
                onChange={(e) => set('howDidYouHear', e.target.value)}
              >
                <option value="">Select an option</option>
                {HOW_HEARD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>

            {/* reCAPTCHA v3 notice */}
            {recaptchaSiteKey && (
              <p className="text-xs text-gray-400">
                This form is protected by reCAPTCHA v3. By submitting, you agree to Google&apos;s{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
                  Terms of Service
                </a>.
              </p>
            )}

            {/* Error message */}
            {status === 'error' && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Something went wrong. Please try again.
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'submitting' ? 'Submitting…' : 'Submit & Get Download Links'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
