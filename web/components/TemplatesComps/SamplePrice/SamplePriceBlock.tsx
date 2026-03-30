'use client';

import type { SamplePriceData, SamplePriceMeta, SamplePriceContent } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — SamplePriceBlock
// Displays a simple price box: label line + currency + price
// ─────────────────────────────────────────────────────────────────────────────

interface SamplePriceBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: SamplePriceMeta = {
  label: 'Sample Price',
  price: '299',
  currency: 'USD',
  bgColor: '#ffffff',
  labelColor: '#374151',
  priceColor: '#2563eb',
  labelFontSize: '14px',
  priceFontSize: '22px',
  borderRadius: '10px',
  borderColor: '#e5e7eb',
  width: '100%',
};

export function SamplePriceBlock({ data }: SamplePriceBlockProps) {
  const raw = data as unknown as SamplePriceData;
  const meta: SamplePriceMeta = { ...DEFAULT_META, ...raw.meta };
  const content: SamplePriceContent = {
    label: raw.content?.label ?? meta.label,
    price: raw.content?.price ?? meta.price,
    currency: raw.content?.currency ?? meta.currency,
  };

  return (
    <div
      className="inline-flex flex-col gap-0.5 px-5 py-3"
      style={{
        backgroundColor: meta.bgColor,
        borderRadius: meta.borderRadius,
        border: `1px solid ${meta.borderColor}`,
        width: meta.width,
        maxWidth: '100%',
      }}
    >
      <span
        style={{
          color: meta.labelColor,
          fontSize: meta.labelFontSize,
          fontWeight: 500,
          lineHeight: 1.3,
        }}
      >
        {content.label}
      </span>
      <span
        style={{
          color: meta.priceColor,
          fontSize: meta.priceFontSize,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {content.currency} {content.price}
      </span>
    </div>
  );
}
