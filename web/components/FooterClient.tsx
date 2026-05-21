'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef } from 'react';
import type { FooterConfig } from '@/types/navigation';
import { API_BASE_URL } from '@/lib/constants';

// ─────────────────────────────────────────────────────────────────────────────
// Social icon SVGs (inline — no external icon dependency)
// ─────────────────────────────────────────────────────────────────────────────

function TwitterXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
    </svg>
  );
}

function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform.toLowerCase()) {
    case 'twitter': case 'x': return <TwitterXIcon className={className} />;
    case 'linkedin': return <LinkedInIcon className={className} />;
    case 'youtube': return <YouTubeIcon className={className} />;
    case 'facebook': return <FacebookIcon className={className} />;
    case 'instagram': return <InstagramIcon className={className} />;
    default: return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscribe bar — matches screenshot: heading left, email + button right, white bg
// ─────────────────────────────────────────────────────────────────────────────

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'invalid' | 'error';

function SubscribeBar({ config }: { config: FooterConfig['subscribe'] }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SubscribeStatus>('idle');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/public/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setStatus('success');
        setMessage(data.message || 'Thank you for subscribing!');
        setEmail('');
      } else if (data.status === 'invalid') {
        setStatus('invalid');
        setMessage(data.message || 'Please enter a valid business email address.');
      } else {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    /* Same gray bg as footer, white bottom border as divider */
    <div className="w-full bg-[#eef1f4] border-b-2 border-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-4 sm:gap-6">
            {/* Heading */}
            <h3 className="text-[#1a1a1a] text-lg font-bold whitespace-nowrap shrink-0 text-center sm:text-left">
              {config.heading}
            </h3>
            {/* Email + button — slight gap */}
            <div className="flex items-center gap-1 w-full sm:w-auto">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.placeholder}
                disabled={status === 'loading' || status === 'success'}
                className="w-full sm:w-64 border border-gray-300 border-r-0 rounded-l-sm px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#006786] focus:ring-1 focus:ring-[#006786] disabled:bg-gray-100 disabled:cursor-not-allowed"
                aria-label="Email address for newsletter subscription"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="bg-[#1a1a1a] hover:bg-[#333] text-white text-sm font-bold px-6 py-2.5 rounded-r-sm transition-colors duration-150 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed tracking-wider"
              >
                {status === 'loading' ? '...' : config.button_label}
              </button>
            </div>
          </div>
          {message && (
            <p
              className={`mt-2 text-sm ${
                status === 'success' ? 'text-green-700' : 'text-red-600'
              }`}
              role="status"
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main FooterClient component
// ─────────────────────────────────────────────────────────────────────────────

interface FooterClientProps {
  footer: FooterConfig;
}

export function FooterClient({ footer }: FooterClientProps) {
  const year = new Date().getFullYear();
  const copyrightText = footer.copyright_text
    ? footer.copyright_text.replace('{year}', String(year))
    : `Copyright © ${year} e-con Systems®`;

  const borderColor = footer.border_color || '#006786';

  return (
    <footer className="border-t-2" style={{ borderTopColor: borderColor }}>
      {/* ── Subscribe bar ── */}
      {footer.subscribe?.enabled && (
        <SubscribeBar config={footer.subscribe} />
      )}

      {/* ── Main footer body — light gray ── */}
      <div className="bg-[#eef1f4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">

          {/* Grid: logo col + 4 link columns */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr_1fr_1fr] gap-8 lg:gap-10">

            {/* ── Logo + tagline ── */}
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              {footer.logo_url ? (
                <Link href={footer.logo_link || '/'} aria-label={footer.logo_alt || 'e-con Systems'}>
                  <Image
                    src={footer.logo_url}
                    alt={footer.logo_alt || 'e-con Systems'}
                    width={150}
                    height={70}
                    className="h-16 w-auto object-contain"
                    unoptimized
                  />
                </Link>
              ) : (
                <Link href={footer.logo_link || '/'} className="text-lg font-bold text-[#006786]">
                  {footer.logo_alt || 'e-con Systems'}
                </Link>
              )}
              {footer.tagline && (
                <p className="text-xs text-gray-500 leading-snug mt-1 text-center">
                  {footer.tagline}
                </p>
              )}
            </div>

            {/* ── Link columns ── */}
            {footer.columns.map((col) => (
              <div key={col.col_id}>
                <h4 className="text-sm font-bold text-[#1a1a1a] mb-5 tracking-wide">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.items.map((item, idx) => (
                    <li key={idx}>
                      <Link
                        href={item.url}
                        target={item.target === '_blank' ? '_blank' : undefined}
                        rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                        className="text-xs font-medium text-[#313131] hover:text-[#006786] transition-colors duration-150"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Badges row — right-aligned ── */}
          {footer.badges.length > 0 && (
            <div className="mt-8 flex justify-end items-center gap-4 flex-wrap">
              {footer.badges.map((badge) => {
                const img = (
                  <Image
                    src={badge.image_url}
                    alt={badge.alt_text || ''}
                    width={80}
                    height={80}
                    className="h-[80px] w-[80px] object-contain"
                    unoptimized
                  />
                );
                return badge.link_url ? (
                  <Link
                    key={badge.badge_id}
                    href={badge.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={badge.alt_text}
                  >
                    {img}
                  </Link>
                ) : (
                  <div key={badge.badge_id} aria-label={badge.alt_text}>
                    {img}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Blue divider before copyright ── */}
      <div className="h-0.5" style={{ backgroundColor: borderColor }} />

      {/* ── Copyright bar — white ── */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative flex items-center justify-center">
          {/* Copyright + sitemap — centered */}
          <p className="text-sm text-center" style={{ color: '#313131' }}>
            {copyrightText}
            {footer.sitemap_link && (
              <>
                {' | '}
                <Link
                  href={footer.sitemap_link}
                  className="hover:text-[#006786] transition-colors duration-150"
                >
                  {footer.sitemap_label || 'Site Map'}
                </Link>
              </>
            )}
          </p>

          {/* Social icons — absolute right */}
          {footer.social_links.length > 0 && (
            <div className="absolute right-4 sm:right-6 lg:right-8 flex items-center gap-4">
              {footer.social_links.map((social, idx) => (
                <Link
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label || social.platform}
                  className="transition-colors duration-150 hover:opacity-70"
                  style={{ color: '#c7c7c7' }}
                >
                  <SocialIcon platform={social.platform} className="h-[18px] w-[18px]" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
