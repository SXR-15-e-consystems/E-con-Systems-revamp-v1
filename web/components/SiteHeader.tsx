'use client';

import Image from 'next/image';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// Static site header — pixel-match of e-con Systems production nav.
// Two sections: Logo (left) | 2-row content (right).
// border-top 5px #1e4ea2, all icons/search #1e4ea2, Developers #059f46.
// ─────────────────────────────────────────────────────────────────────────────

const BLUE = '#1e4ea2';
const GREEN = '#059f46';

const NAV_ITEMS = [
  { label: 'Camera Products', href: '#' },
  { label: 'Markets', href: '#' },
  { label: 'Explore', href: '#' },
  { label: 'Resources', href: '#' },
  { label: 'About Us', href: '#' },
] as const;

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="8"
      height="5"
      viewBox="0 0 8 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 1l3 3 3-3" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header
      className="w-full bg-white"
      style={{ borderTop: `5px solid ${BLUE}`, boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' ,borderBottom: '1px solid #e5e7eb' }}
    >
      <div className="mx-auto flex max-w-7xl items-stretch px-4">
        {/* ── Section 1: Logo ── */}
        <Link href="/" className="flex flex-shrink-0 items-center pr-5 py-2">
          <Image
            src="https://d2u56hfpsewfc3.cloudfront.net/images/e-con-twenty-plus-years-logo-register.svg"
            alt="e-con Systems"
            width={140}
            height={40}
            priority
            className="w-auto"
            style={{height: '50px'}}
          />
        </Link>

        {/* ── Section 2: Two rows ── */}
        <div className="flex flex-1 flex-col min-w-0">

          {/* Row 1: Search | spacer | Phone | divider | Contact Us | divider | Flag */}
          <div className="flex items-center gap-4 py-2">
            {/* Search */}
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search"
                className="h-[28px] w-[280px] bg-white px-2.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none"
                style={{
                  border: `1px solid ${BLUE}`,
                  borderRight: 'none',
                  borderRadius: '3px 0 0 3px',
                }}
                readOnly
              />
              <button
                type="button"
                className="flex h-[28px] w-[30px] flex-shrink-0 items-center justify-center text-white"
                style={{
                  backgroundColor: BLUE,
                  borderRadius: '0 3px 3px 0',
                }}
                aria-label="Search"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Phone */}
            <a
              href="tel:+14087667503"
              className="flex items-center gap-1.5 whitespace-nowrap text-gray-700 transition-colors hover:opacity-80"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: BLUE }}>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c1.21.34 2 .57 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              <span className="text-[13px] font-medium">+1 408 766 7503</span>
            </a>

            {/* Divider */}
            <span className="h-4 w-px bg-gray-300" />

            {/* Contact Us */}
            <a
              href="#"
              className="flex items-center gap-1.5 whitespace-nowrap text-gray-700 transition-colors hover:opacity-80"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: BLUE }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span className="text-[13px]">Contact Us</span>
            </a>

            {/* Divider */}
            <span className="h-4 w-px bg-gray-300" />

            {/* US Flag */}
            <button
              type="button"
              className="flex h-[20px] w-[28px] items-center justify-center overflow-hidden rounded-sm border border-gray-300"
              aria-label="Language"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://flagcdn.com/w40/us.png"
                alt="US"
                width={28}
                height={20}
                className="h-full w-full object-cover"
              />
            </button>
          </div>

          {/* Row 2: Nav items (left) | Cart + User + Developers (right) */}
          <div className="flex items-center justify-between">
            {/* Nav links */}
            <nav className="flex items-center -ml-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-1 px-3 py-2 text-[13px] font-medium text-gray-800 transition-colors hover:text-blue-700"
                >
                  {item.label}
                  <ChevronDown className="text-gray-500" />
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1 pb-1">
              {/* Cart */}
              <button
                type="button"
                className="p-2 transition-colors hover:opacity-80"
                aria-label="Cart"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: BLUE }}>
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
              </button>
              {/* User */}
              <button
                type="button"
                className="p-2 transition-colors hover:opacity-80"
                aria-label="Account"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: BLUE }}>
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              {/* Developers */}
              <Link
                href="#"
                className="ml-1.5 flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: GREEN, borderRadius: '5px' }}
              >
                {/* File / document icon */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Developers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
