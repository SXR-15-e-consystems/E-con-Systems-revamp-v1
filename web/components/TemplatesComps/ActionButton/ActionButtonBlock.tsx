'use client';

import Link from 'next/link';

import { sanitizeUrl } from '@/lib/security';
import type {
  ActionButtonData,
  ActionButtonMeta,
  ActionButtonContent,
  ActionButtonIcon,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — ActionButtonBlock
// Button with icon + text, and a sub-text line below
// ─────────────────────────────────────────────────────────────────────────────

interface ActionButtonBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: ActionButtonMeta = {
  bgColor: '#1e4ea2',
  textColor: '#ffffff',
  fontSize: '14px',
  fontWeight: '700',
  subTextColor: '#374151',
  subTextFontSize: '12px',
  borderRadius: '6px',
  paddingX: '24px',
  paddingY: '10px',
  icon: 'cart',
  iconPosition: 'left',
  width: 'auto',
  align: 'left',
};

function ButtonIcon({ icon, color }: { icon: ActionButtonIcon; color: string }) {
  const size = 18;
  switch (icon) {
    case 'cart':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
        </svg>
      );
    case 'download':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      );
    case 'arrow-right':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      );
    case 'phone':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
      );
    case 'mail':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
        </svg>
      );
    case 'external':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      );
    default:
      return null;
  }
}

export function ActionButtonBlock({ data }: ActionButtonBlockProps) {
  const raw = data as unknown as ActionButtonData;
  const meta: ActionButtonMeta = { ...DEFAULT_META, ...raw.meta };
  const content: ActionButtonContent = {
    buttonText: raw.content?.buttonText ?? 'Button',
    subText: raw.content?.subText ?? '',
    url: raw.content?.url ?? '',
    openInNewTab: raw.content?.openInNewTab ?? false,
  };

  const safeUrl = content.url ? sanitizeUrl(content.url, false) : '';
  const justifyClass =
    meta.align === 'center' ? 'justify-center' : meta.align === 'right' ? 'justify-end' : 'justify-start';

  const buttonStyle: React.CSSProperties = {
    backgroundColor: meta.bgColor,
    color: meta.textColor,
    fontSize: meta.fontSize,
    fontWeight: Number(meta.fontWeight),
    borderRadius: meta.borderRadius,
    padding: `${meta.paddingY} ${meta.paddingX}`,
    width: meta.width === 'auto' ? undefined : meta.width,
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'filter 0.15s ease',
  };

  const buttonContent = (
    <>
      {meta.icon !== 'none' && meta.iconPosition === 'left' && (
        <ButtonIcon icon={meta.icon} color={meta.textColor} />
      )}
      <span>{content.buttonText}</span>
      {meta.icon !== 'none' && meta.iconPosition === 'right' && (
        <ButtonIcon icon={meta.icon} color={meta.textColor} />
      )}
    </>
  );

  return (
    <div className={`flex ${justifyClass} w-full`}>
      <div className="inline-flex flex-col items-center gap-1.5">
        {safeUrl ? (
          <Link
            href={safeUrl}
            target={content.openInNewTab ? '_blank' : undefined}
            rel={content.openInNewTab ? 'noopener noreferrer' : undefined}
            style={buttonStyle}
            className="hover:brightness-110"
          >
            {buttonContent}
          </Link>
        ) : (
          <span style={buttonStyle}>{buttonContent}</span>
        )}
        {content.subText && (
          <span
            style={{
              color: meta.subTextColor,
              fontSize: meta.subTextFontSize,
              lineHeight: 1.4,
            }}
          >
            {content.subText}
          </span>
        )}
      </div>
    </div>
  );
}
