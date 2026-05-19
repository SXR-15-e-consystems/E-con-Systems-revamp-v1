'use client';

import { useState, useEffect, useRef } from 'react';
import type { DatasheetInlineLinks } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const EU_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU',
  'IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
]);

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'DK', name: 'Denmark' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RU', name: 'Russia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'TR', name: 'Turkey' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'Other', name: 'Other' },
];

const REASON_MESSAGES: Record<string, string> = {
  free_email:        'Please use your company/work email. Free providers (Gmail, Yahoo, etc.) are not accepted.',
  blocked_domain:    'This email domain is not accepted. Please use a valid company email.',
  email_unverifiable:'We could not verify this email address. Please enter a valid company email.',
  zerobounce_invalid:'This email address could not be verified. Please enter a valid company email.',
  zerobounce_unknown:'We could not verify this email address. Please use a valid company email.',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: DatasheetInlineLinks;
  selectedKeys?: string[];
  productName: string;
}

type Step = 'idle' | 'validating' | 'submitting' | 'done' | 'blocked';

// ─── Component ───────────────────────────────────────────────────────────────

export default function DownloadModal({ isOpen, onClose, config, selectedKeys, productName }: Props) {
  const [name, setName]             = useState('');
  const [company, setCompany]       = useState('');
  const [email, setEmail]           = useState('');
  const [country, setCountry]       = useState('US');
  const [stateName, setState]       = useState('');
  const [phone, setPhone]           = useState('');
  const [knowecon, setKnowecon]     = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [termsAccepted, setTerms]   = useState(false);

  const [step, setStep]             = useState<Step>('idle');
  const [error, setError]           = useState('');
  const [fieldErrors, setFE]        = useState<Record<string, string>>({});
  const [isEU, setIsEU]             = useState(false);

  // Stores ZeroBounce result string for internal tracking
  const incorpidRef = useRef('');

  const docKeys = selectedKeys ?? (config?.params?.qdocs ? [config.params.qdocs] : []);

  // Detect EU visitor for GDPR newsletter toggle
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/geo-country')
      .then((r) => r.json())
      .then((d: { countryCode?: string }) => {
        if (d.countryCode && EU_COUNTRIES.has(d.countryCode)) {
          setIsEU(true);
          setNewsletter(false);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Validate required fields ────────────────────────────────────────────
  function validateFields(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2)
      errs.name = 'Full name is required.';
    if (!company.trim())
      errs.company = 'Company name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Valid work email is required.';
    if (country === 'US' && !stateName)
      errs.state = 'State is required for US.';
    if (!termsAccepted)
      errs.terms = 'You must accept the Terms & Conditions.';
    setFE(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Server-side email validation (domain + ZeroBounce) ─────────────────
  // All validation happens on the server — the ZeroBounce API key is never
  // exposed to the browser.
  async function validateEmail(): Promise<boolean> {
    const res = await fetch('/api/download/validate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json() as { valid: boolean; reason?: string; incorpid?: string };

    if (!data.valid) {
      const reason = data.reason ?? 'email_unverifiable';
      // Log blocked attempt
      const domain = email.split('@')[1] ?? '';
      await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BLOCKEDMAIL',
          name, company, email: email.trim().toLowerCase(),
          domain, status: reason,
          country, state: stateName, city: '', phone,
          psi: productName,
        }),
      }).catch(() => {});

      // Store incorpid for later submission
      if (data.incorpid) incorpidRef.current = data.incorpid;

      setError(REASON_MESSAGES[reason] ?? REASON_MESSAGES.email_unverifiable);
      return false;
    }

    if (data.incorpid) incorpidRef.current = data.incorpid;
    return true;
  }

  // ── Form submit ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateFields()) return;

    // Step 1: Validate email server-side
    setStep('validating');
    const emailOk = await validateEmail().catch(() => {
      setError('Network error during email validation. Please try again.');
      return false;
    });
    if (!emailOk) { setStep('idle'); return; }

    // Step 2: Submit lead
    setStep('submitting');
    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MAIL',
          name: name.trim(),
          company: company.trim(),
          email: email.trim().toLowerCase(),
          country,
          state: stateName,
          phone: phone.trim(),
          knowecon: knowecon.trim(),
          newsletter,
          incorpid: incorpidRef.current || 'N/A',
          productName,
          docKeys,
        }),
      });
      const data = await res.json() as { message?: string };
      if (res.status === 429) { setStep('blocked'); return; }
      if (!res.ok) { setError(data.message ?? 'Something went wrong. Please try again.'); setStep('idle'); return; }
      setStep('done');
    } catch {
      setError('Network error. Please try again.');
      setStep('idle');
    }
  }

  const isLoading = step === 'validating' || step === 'submitting';
  const loadingLabel = step === 'validating' ? 'Validating email…' : 'Submitting…';

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-[520px] mx-4 z-10 max-h-[92vh] flex flex-col">
        {/* ── Header ── */}
        <div className="bg-[#1e3a5f] text-white px-5 py-3 rounded-t-lg flex items-center justify-between shrink-0">
          <h3 className="font-semibold text-sm">Download Document</h3>
          <button onClick={onClose} aria-label="Close" className="text-white/70 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1">

          {/* SUCCESS / BLOCKED */}
          {(step === 'done' || step === 'blocked') && (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-[#28a745]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <p className="font-semibold text-[#1e3a5f] text-base mb-1">
                {step === 'blocked' ? 'Already sent!' : 'Download link sent!'}
              </p>
              <p className="text-sm text-gray-500 mb-5">
                {step === 'blocked'
                  ? 'The download details have already been sent to your registered email.'
                  : <>Check your inbox at <strong>{email}</strong></>}
              </p>
              <button onClick={onClose}
                className="bg-[#28a745] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-[#218838] transition-colors">
                Close
              </button>
            </div>
          )}

          {/* FORM */}
          {step !== 'done' && step !== 'blocked' && (
            <form onSubmit={handleSubmit} noValidate className="p-5">
              <p className="text-xs text-gray-500 mb-4">
                Fill in your details to download the <strong>{productName}</strong> documents.
                Fields marked <span className="text-red-500">*</span> are required.
              </p>

              {/* Row 1: Name | Company */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <FF label="Full Name" required error={fieldErrors.name}>
                  <input type="text" value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inp(fieldErrors.name)}
                    placeholder="Your full name"
                    maxLength={100} autoComplete="name" />
                </FF>
                <FF label="Company" required error={fieldErrors.company}>
                  <input type="text" value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={inp(fieldErrors.company)}
                    placeholder="Company name"
                    maxLength={200} autoComplete="organization" />
                </FF>
              </div>

              {/* Row 2: Work Email | Phone */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <FF label="Work Email" required error={fieldErrors.email}>
                  <input type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inp(fieldErrors.email)}
                    placeholder="you@company.com"
                    maxLength={200} autoComplete="email" />
                </FF>
                <FF label="Phone">
                  <input type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-() ]/g, ''))}
                    className={inp()}
                    placeholder="+1 555 000 0000"
                    maxLength={30} autoComplete="tel" />
                </FF>
              </div>

              {/* Row 3: Country | State (US only) */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <FF label="Country" required>
                  <select value={country}
                    onChange={(e) => { setCountry(e.target.value); setState(''); }}
                    className={inp()}>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </FF>
                {country === 'US' ? (
                  <FF label="State" required error={fieldErrors.state}>
                    <select value={stateName}
                      onChange={(e) => setState(e.target.value)}
                      className={inp(fieldErrors.state)}>
                      <option value="">— Select —</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </FF>
                ) : (
                  <FF label="How did you hear about us?">
                    <input type="text" value={knowecon}
                      onChange={(e) => setKnowecon(e.target.value)}
                      className={inp()}
                      placeholder="e.g. Google, LinkedIn…"
                      maxLength={300} />
                  </FF>
                )}
              </div>

              {/* Row 4: How did you hear (shown below state for US, already in row 3 for non-US) */}
              {country === 'US' && (
                <div className="mb-3">
                  <FF label="How did you hear about us?">
                    <input type="text" value={knowecon}
                      onChange={(e) => setKnowecon(e.target.value)}
                      className={inp()}
                      placeholder="e.g. Google, LinkedIn…"
                      maxLength={300} />
                  </FF>
                </div>
              )}

              {/* Newsletter — EU: explicit opt-in; non-EU: auto opt-in with notice */}
              <div className="mb-2">
                {isEU ? (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className="mt-0.5 accent-[#28a745] shrink-0" />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      I agree to receive e-con Systems newsletters and product updates by email.
                    </span>
                  </label>
                ) : (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    You will receive e-con Systems newsletters and product updates.
                    You can unsubscribe at any time.
                  </p>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="mb-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={termsAccepted}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-0.5 accent-[#28a745] shrink-0" />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    I agree to the{' '}
                    <a href="https://www.e-consystems.com/privacy-policy.asp"
                       target="_blank" rel="noreferrer"
                       className="text-[#0066cc] underline hover:text-[#004499]">
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a href="https://www.e-consystems.com/terms-conditions.asp"
                       target="_blank" rel="noreferrer"
                       className="text-[#0066cc] underline hover:text-[#004499]">
                      Terms &amp; Conditions
                    </a>.{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                {fieldErrors.terms && (
                  <p className="text-red-500 text-[11px] mt-0.5 ml-5">{fieldErrors.terms}</p>
                )}
              </div>

              {/* Global error */}
              {error && (
                <div className="mb-3 text-red-700 text-xs bg-red-50 border border-red-200 rounded px-3 py-2 leading-relaxed">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isLoading}
                className="w-full bg-[#28a745] hover:bg-[#218838] disabled:opacity-60 text-white
                           font-semibold py-2.5 rounded text-sm transition-colors flex items-center justify-center gap-2">
                {isLoading && (
                  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                )}
                {isLoading ? loadingLabel : 'Download Now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function inp(err?: string) {
  return [
    'w-full border rounded px-2.5 py-1.5 text-xs outline-none transition-colors',
    err
      ? 'border-red-400 focus:border-red-500 bg-red-50'
      : 'border-gray-300 focus:border-[#0066cc] bg-white',
  ].join(' ');
}

function FF({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-semibold text-[#444] mb-1 leading-none">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-[10px] mt-0.5 leading-tight">{error}</p>}
    </div>
  );
}
