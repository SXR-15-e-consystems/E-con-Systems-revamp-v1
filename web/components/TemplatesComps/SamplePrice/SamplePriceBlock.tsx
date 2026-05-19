'use client';

import type { SamplePriceData, SamplePriceMeta, SamplePriceContent } from '@/types/templates';
import { getUiStrings, EN_DEFAULTS } from '@/lib/ui-strings';
import type { UiStrings } from '@/lib/ui-strings';

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
  priceColor: '#1e4ea2',
  labelFontSize: '12px',
  priceFontSize: '18px',
  borderRadius: '10px',
  borderColor: '#e5e7eb',
  width: '100%',
};

export function SamplePriceBlock({ data }: SamplePriceBlockProps) {
  const t = getUiStrings(data.__ui as UiStrings | undefined);
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[SamplePrice] __ui present:', !!data.__ui, '| samplePrice:', t.samplePrice);
  }
  const raw = data as unknown as SamplePriceData;
  const meta: SamplePriceMeta = { ...DEFAULT_META, ...raw.meta, label: raw.meta?.label || t.samplePrice };
  // When the locale has a translated samplePrice UI string, it always wins over the
  // English label baked into the block's content/meta fields.
  const label =
    t.samplePrice !== EN_DEFAULTS.samplePrice
      ? t.samplePrice
      : (raw.content?.label ?? meta.label);
  const content: SamplePriceContent = {
    label,
    price: raw.content?.price ?? meta.price,
    currency: raw.content?.currency ?? meta.currency,
  };

  return (
    <div
      className="inline-flex flex-col gap-0.5 px-4 py-2"
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
