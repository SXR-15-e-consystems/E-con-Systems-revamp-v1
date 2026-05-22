'use client';

import { useState, type FormEvent } from 'react';

import type {
  NewsletterSubscribeData,
  NewsletterSubscribeMeta,
  NewsletterSubscribeContent,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — NewsletterSubscribeBlock
// "Subscribe for latest updates" email capture strip (new_template_full.png)
// Horizontally centred heading + inline email input + submit button.
// ─────────────────────────────────────────────────────────────────────────────

interface NewsletterSubscribeBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: NewsletterSubscribeMeta = {
  bgColor: '#ffffff',
  headingColor: '#111111',
  headingFontSize: '1.25rem',
  headingFontWeight: '600',
  inputBorderColor: '#d1d5db',
  inputBgColor: '#ffffff',
  inputTextColor: '#111111',
  buttonBgColor: '#1a1a1a',
  buttonTextColor: '#ffffff',
  buttonLabel: 'SUBSCRIBE',
  placeholderText: 'Email id*',
  successMessage: 'Thank you for subscribing!',
  errorMessage: 'Please enter a valid email address.',
  width: '100%',
};

// Basic email validation — only structural check, no external calls
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function NewsletterSubscribeBlock({ data }: NewsletterSubscribeBlockProps) {
  const typed = data as unknown as NewsletterSubscribeData;
  const meta: NewsletterSubscribeMeta = { ...DEFAULT_META, ...typed.meta };
  const content: NewsletterSubscribeContent = {
    heading: typed.content?.heading ?? 'Subscribe for latest updates',
    form_action_url: typed.content?.form_action_url ?? '',
  };

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setFieldError(meta.errorMessage);
      return;
    }

    setFieldError('');
    setStatus('submitting');

    try {
      if (content.form_action_url) {
        const res = await fetch(content.form_action_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        if (!res.ok) throw new Error('Server error');
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section
        className="nls-root w-full"
        style={{ backgroundColor: meta.bgColor, width: meta.width }}
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-screen-lg flex-col items-center justify-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-center sm:gap-8">
          <p
            className="font-semibold"
            style={{ color: meta.headingColor, fontSize: meta.headingFontSize }}
          >
            {meta.successMessage}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="nls-root w-full"
      style={{ backgroundColor: meta.bgColor }}
    >
      <style>{`
        .nls-root {
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }
        .nls-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: clamp(24px, 4vw, 40px) clamp(16px, 4vw, 32px);
        }
        @media (min-width: 640px) {
          .nls-inner {
            flex-direction: row;
            gap: 24px;
          }
        }
        .nls-form {
          display: flex;
          gap: 0;
          flex-shrink: 0;
        }
      `}</style>

      <div className="nls-inner mx-auto max-w-screen-lg" style={meta.width && meta.width !== '100%' ? { maxWidth: meta.width } : undefined}>
        {/* Heading */}
        <h2
          style={{
            color: meta.headingColor,
            fontSize: meta.headingFontSize,
            fontWeight: meta.headingFontWeight,
            whiteSpace: 'nowrap',
          }}
        >
          {content.heading}
        </h2>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="nls-form"
          noValidate
          aria-label="Newsletter subscription form"
        >
          <label htmlFor="nls-email" className="sr-only">
            Email address
          </label>
          <input
            id="nls-email"
            type="email"
            autoComplete="email"
            required
            placeholder={meta.placeholderText}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError('');
              if (status === 'error') setStatus('idle');
            }}
            disabled={status === 'submitting'}
            className="rounded-l border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400 disabled:opacity-60"
            style={{
              borderColor: fieldError ? '#ef4444' : meta.inputBorderColor,
              backgroundColor: meta.inputBgColor,
              color: meta.inputTextColor,
              width: '220px',
              borderRight: 'none',
            }}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? 'nls-error' : undefined}
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded-r border border-l-0 px-5 py-2 text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60"
            style={{
              backgroundColor: meta.buttonBgColor,
              color: meta.buttonTextColor,
              borderColor: meta.buttonBgColor,
            }}
          >
            {status === 'submitting' ? '…' : meta.buttonLabel}
          </button>
        </form>

        {/* Inline validation / server error */}
        {(fieldError || status === 'error') && (
          <p
            id="nls-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {fieldError || 'Something went wrong. Please try again.'}
          </p>
        )}
      </div>
    </section>
  );
}
