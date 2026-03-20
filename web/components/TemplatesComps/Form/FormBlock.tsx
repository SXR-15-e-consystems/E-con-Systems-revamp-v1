'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { FormContent, FormData, FormMeta, FormType, QuoteQuantity } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — FormBlock
// Renders one of three form types based on meta.formType.
// Submits to /api/v1/forms/{formType} via fetch (through M5 only).
// Integrates reCAPTCHA v3 — token appended to payload, never exposed in form.
// ─────────────────────────────────────────────────────────────────────────────

interface FormBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: FormMeta = {
  formType: 'contact',
  recaptchaSiteKey: '',
  tcLink: '/terms',
  bgColor: '#ffffff',
  width: '600px',
  submitLabel: 'Submit',
};

const DEFAULT_CONTENT: FormContent = {
  heading: undefined,
  subheading: undefined,
  successMessage: 'Thank you! We will be in touch shortly.',
  errorMessage: 'Something went wrong. Please try again.',
};

const COUNTRIES = [
  'United States', 'United Kingdom', 'India', 'Germany', 'France',
  'Canada', 'Australia', 'Japan', 'China', 'Singapore', 'Other',
];

const QUOTE_QUANTITIES: { value: QuoteQuantity; label: string }[] = [
  { value: '<100', label: 'Less than 100' },
  { value: '<500', label: '100 – 499' },
  { value: '<1000', label: '500 – 999' },
  { value: '>1000', label: '1,000 or more' },
];

// ── reCAPTCHA v3 ─────────────────────────────────────────────────────────────

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

// ── Form state interfaces ─────────────────────────────────────────────────────

interface BaseFields {
  name: string;
  email: string;
  company: string;
  country: string;
  state: string;
  requirement: string;
  tc: boolean;
}

interface RegistrationFields extends BaseFields {
  eventDate: string;
  eventTime: string;
}

interface QuoteFields extends BaseFields {
  quantity: QuoteQuantity | '';
}

type UnionFields = BaseFields | RegistrationFields | QuoteFields;

const BASE_DEFAULT: BaseFields = {
  name: '',
  email: '',
  company: '',
  country: '',
  state: '',
  requirement: '',
  tc: false,
};

function buildDefaultFields(formType: FormType): UnionFields {
  if (formType === 'registration') return { ...BASE_DEFAULT, eventDate: '', eventTime: '' };
  if (formType === 'get-quote') return { ...BASE_DEFAULT, quantity: '' };
  return { ...BASE_DEFAULT };
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function FieldWrapper({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition';

// ── Main component ────────────────────────────────────────────────────────────

export function FormBlock({ data }: FormBlockProps) {
  const parsed = data as unknown as FormData;
  const meta: FormMeta = { ...DEFAULT_META, ...parsed.meta };
  const content: FormContent = { ...DEFAULT_CONTENT, ...parsed.content };

  const [fields, setFields] = useState<UnionFields>(() => buildDefaultFields(meta.formType));
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const hasLoadedRecaptcha = useRef(false);

  // Load reCAPTCHA script once on mount
  useEffect(() => {
    if (meta.recaptchaSiteKey && !hasLoadedRecaptcha.current) {
      loadRecaptchaScript(meta.recaptchaSiteKey);
      hasLoadedRecaptcha.current = true;
    }
  }, [meta.recaptchaSiteKey]);

  function set<K extends keyof UnionFields>(key: K, value: UnionFields[K]) {
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
    if (meta.formType === 'registration') {
      const reg = fields as RegistrationFields;
      if (!reg.eventDate) errors['eventDate'] = 'Required';
    }
    if (meta.formType === 'get-quote') {
      const quote = fields as QuoteFields;
      if (!quote.quantity) errors['quantity'] = 'Required';
    }
    if (!fields.tc) errors['tc'] = 'You must accept the Terms & Conditions';
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
        if (meta.recaptchaSiteKey) {
          recaptchaToken = await getRecaptchaToken(meta.recaptchaSiteKey, `form_${meta.formType}`);
        }

        const payload = { ...fields, recaptchaToken };
        const response = await fetch(`/api/v1/forms/${meta.formType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        setStatus('success');
        setFields(buildDefaultFields(meta.formType));
      } catch {
        setStatus('error');
      }
    },
    [fields, meta],
  );

  if (status === 'success') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-green-200 bg-green-50 px-8 py-10 text-center"
        style={{ width: meta.width, backgroundColor: meta.bgColor }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-10 w-10 text-green-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-base font-semibold text-green-800">{content.successMessage}</p>
      </div>
    );
  }

  const isReg = meta.formType === 'registration';
  const isQuote = meta.formType === 'get-quote';

  return (
    <div
      className="rounded-xl border border-gray-200 p-6 shadow-sm"
      style={{ width: meta.width, backgroundColor: meta.bgColor }}
    >
      {content.heading && (
        <h2 className="text-xl font-bold text-gray-900 mb-1">{content.heading}</h2>
      )}
      {content.subheading && (
        <p className="text-sm text-gray-500 mb-5">{content.subheading}</p>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name + Email */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Name" required>
            <input
              className={inputClass}
              value={fields.name}
              placeholder="Your name"
              onChange={(e) => set('name', e.target.value)}
              autoComplete="name"
            />
            {fieldErrors['name'] && <span className="text-xs text-red-500">{fieldErrors['name']}</span>}
          </FieldWrapper>
          <FieldWrapper label="Email" required>
            <input
              type="email"
              className={inputClass}
              value={fields.email}
              placeholder="you@company.com"
              onChange={(e) => set('email', e.target.value)}
              autoComplete="email"
            />
            {fieldErrors['email'] && <span className="text-xs text-red-500">{fieldErrors['email']}</span>}
          </FieldWrapper>
        </div>

        {/* Company */}
        <FieldWrapper label="Company" required>
          <input
            className={inputClass}
            value={fields.company}
            placeholder="Your company"
            onChange={(e) => set('company', e.target.value)}
            autoComplete="organization"
          />
          {fieldErrors['company'] && <span className="text-xs text-red-500">{fieldErrors['company']}</span>}
        </FieldWrapper>

        {/* Country + State */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWrapper label="Country" required>
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
          </FieldWrapper>
          <FieldWrapper label="State / Province">
            <input
              className={inputClass}
              value={fields.state}
              placeholder="State or province"
              onChange={(e) => set('state', e.target.value)}
              autoComplete="address-level1"
            />
          </FieldWrapper>
        </div>

        {/* Registration: Event Date + Time */}
        {isReg && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldWrapper label="Event Date" required>
              <input
                type="date"
                className={inputClass}
                value={(fields as RegistrationFields).eventDate}
                onChange={(e) => set('eventDate' as keyof UnionFields, e.target.value as UnionFields[keyof UnionFields])}
              />
              {fieldErrors['eventDate'] && <span className="text-xs text-red-500">{fieldErrors['eventDate']}</span>}
            </FieldWrapper>
            <FieldWrapper label="Event Time">
              <input
                type="time"
                className={inputClass}
                value={(fields as RegistrationFields).eventTime}
                onChange={(e) => set('eventTime' as keyof UnionFields, e.target.value as UnionFields[keyof UnionFields])}
              />
            </FieldWrapper>
          </div>
        )}

        {/* Get Quote: Quantity */}
        {isQuote && (
          <FieldWrapper label="Quantity" required>
            <select
              className={inputClass}
              value={(fields as QuoteFields).quantity}
              onChange={(e) => set('quantity' as keyof UnionFields, e.target.value as UnionFields[keyof UnionFields])}
            >
              <option value="">Select quantity</option>
              {QUOTE_QUANTITIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {fieldErrors['quantity'] && <span className="text-xs text-red-500">{fieldErrors['quantity']}</span>}
          </FieldWrapper>
        )}

        {/* Requirement */}
        <FieldWrapper label="Requirement">
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            value={fields.requirement}
            placeholder="Describe your requirement…"
            onChange={(e) => set('requirement', e.target.value)}
          />
        </FieldWrapper>

        {/* T&C */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={fields.tc}
            onChange={(e) => set('tc', e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">
            I agree to the{' '}
            <a
              href={meta.tcLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Terms & Conditions
            </a>
          </span>
        </label>
        {fieldErrors['tc'] && <span className="text-xs text-red-500 -mt-2 block">{fieldErrors['tc']}</span>}

        {/* reCAPTCHA v3 notice */}
        {meta.recaptchaSiteKey && (
          <p className="text-xs text-gray-400">
            This form is protected by reCAPTCHA v3. By submitting, you agree to Google's{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
              Terms of Service
            </a>
            .
          </p>
        )}

        {/* Error message */}
        {status === 'error' && (
          <p className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {content.errorMessage}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {status === 'submitting' ? 'Submitting…' : meta.submitLabel}
        </button>
      </form>
    </div>
  );
}
