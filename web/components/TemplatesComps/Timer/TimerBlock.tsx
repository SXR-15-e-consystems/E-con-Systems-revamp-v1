'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { useCountdown } from '@/hooks/useCountdown';
import type { TimerContent, TimerData, TimerMeta } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — TimerBlock
// Renders either a full-width bar (top/bottom) or a popup card (bottom-left/right).
// Countdown stops at expiry; component hides itself when expired or meta.visible=false.
// ─────────────────────────────────────────────────────────────────────────────

interface TimerBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: TimerMeta = {
  layout: 'bar',
  position: 'bottom',
  visible: true,
  bgColor: '#1a1a1a',
  textColor: '#ffffff',
  width: '380px',
};

// ── Countdown display ─────────────────────────────────────────────────────────

function CountdownDisplay({
  expiryIso,
  textColor,
}: {
  expiryIso: string;
  textColor: string;
}) {
  const { days, hours, minutes, seconds, expired } = useCountdown(expiryIso);

  if (expired) return null;

  const unit = (value: string, label: string) => (
    <div className="flex flex-col items-center min-w-[3rem]">
      <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: textColor }}>
        {value}
      </span>
      <span className="text-xs opacity-70 mt-0.5" style={{ color: textColor }}>
        {label}
      </span>
    </div>
  );

  const separator = (
    <span className="text-xl font-bold pb-3 opacity-60" style={{ color: textColor }}>
      :
    </span>
  );

  return (
    <div className="flex items-end gap-1">
      {unit(days, 'DD')}
      {separator}
      {unit(hours, 'HH')}
      {separator}
      {unit(minutes, 'MM')}
      {separator}
      {unit(seconds, 'SS')}
    </div>
  );
}

// ── Inner timer card content ──────────────────────────────────────────────────

function TimerInner({
  content,
  meta,
  onDismiss,
  isPopup,
}: {
  content: TimerContent;
  meta: TimerMeta;
  onDismiss?: () => void;
  isPopup: boolean;
}) {
  const { expired } = useCountdown(content.expiry_iso);

  if (expired) return null;

  return (
    <div
      className={`flex items-center gap-4 ${isPopup ? 'flex-col p-5' : 'flex-row flex-wrap justify-center gap-x-6 px-6 py-3'}`}
      style={{ backgroundColor: meta.bgColor, color: meta.textColor }}
    >
      {/* Optional image */}
      {content.image_url && (
        <div className={`relative flex-shrink-0 ${isPopup ? 'h-20 w-full' : 'h-10 w-16'} overflow-hidden rounded`}>
          <Image
            src={content.image_url}
            alt={content.title}
            fill
            className="object-cover"
            sizes={isPopup ? '340px' : '64px'}
          />
        </div>
      )}

      {/* Text content */}
      <div className={`flex flex-col ${isPopup ? 'items-center text-center' : 'items-start'} min-w-0 flex-1`}>
        <span className="text-sm font-semibold leading-tight" style={{ color: meta.textColor }}>
          {content.title}
        </span>
        {content.description && (
          <span className="text-xs opacity-80 mt-0.5 line-clamp-2" style={{ color: meta.textColor }}>
            {content.description}
          </span>
        )}
      </div>

      {/* Countdown */}
      <CountdownDisplay expiryIso={content.expiry_iso} textColor={meta.textColor} />

      {/* CTA */}
      {content.cta_text && content.cta_link && (
        <Link
          href={content.cta_link}
          className="flex-shrink-0 rounded px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80 border border-current whitespace-nowrap"
          style={{ color: meta.textColor }}
        >
          {content.cta_text}
        </Link>
      )}

      {/* Dismiss for popup */}
      {isPopup && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: meta.textColor }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TimerBlock({ data }: TimerBlockProps) {
  const parsed = data as unknown as TimerData;
  const meta: TimerMeta = { ...DEFAULT_META, ...parsed.meta };
  const content: TimerContent | undefined = parsed.content;

  const [dismissed, setDismissed] = useState(false);

  if (!meta.visible || !content?.expiry_iso || dismissed) return null;

  const isPopup = meta.layout === 'popup';

  const positionClasses: Record<string, string> = {
    top: 'fixed top-0 inset-x-0 z-40',
    bottom: 'fixed bottom-0 inset-x-0 z-40',
    'bottom-left': 'fixed bottom-4 left-4 z-40',
    'bottom-right': 'fixed bottom-4 right-4 z-40',
  };

  const outerClass = positionClasses[meta.position] ?? 'fixed bottom-0 inset-x-0 z-40';

  return (
    <div
      className={`${outerClass} ${isPopup ? 'relative rounded-xl overflow-hidden shadow-2xl' : 'shadow-md'}`}
      style={isPopup ? { width: meta.width } : undefined}
    >
      <TimerInner
        content={content}
        meta={meta}
        isPopup={isPopup}
        onDismiss={isPopup ? () => setDismissed(true) : undefined}
      />
    </div>
  );
}
