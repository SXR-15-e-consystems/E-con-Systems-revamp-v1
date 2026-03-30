import type { SamplePriceData, SamplePriceMeta, SamplePriceContent } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills actual price data
// ─────────────────────────────────────────────────────────────────────────────

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

export function SamplePriceBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as SamplePriceData;
  const meta: SamplePriceMeta = { ...DEFAULT_META, ...data.meta };
  const content: SamplePriceContent = {
    label: data.content?.label ?? meta.label,
    price: data.content?.price ?? meta.price,
    currency: data.content?.currency ?? meta.currency,
  };

  function updateContent(patch: Partial<SamplePriceContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Label:</strong> {meta.labelFontSize} / {meta.labelColor}</span>
        <span><strong>Price:</strong> {meta.priceFontSize} / {meta.priceColor}</span>
        <span><strong>Box:</strong> radius {meta.borderRadius}</span>
      </div>

      {/* Editable content */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Label</span>
        <input
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={content.label}
          placeholder="e.g. Sample Price, Starting at…"
          onChange={(e) => updateContent({ label: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Currency</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.currency}
            placeholder="USD"
            onChange={(e) => updateContent({ currency: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Price</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.price}
            placeholder="299"
            onChange={(e) => updateContent({ price: e.target.value })}
          />
        </label>
      </div>

      {/* Live preview */}
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <span className="text-xs font-semibold text-gray-500 mb-2 block">Live Preview</span>
        <div
          className="inline-flex flex-col gap-0.5 px-5 py-3"
          style={{
            backgroundColor: meta.bgColor,
            borderRadius: meta.borderRadius,
            border: `1px solid ${meta.borderColor}`,
          }}
        >
          <span style={{ color: meta.labelColor, fontSize: meta.labelFontSize, fontWeight: 500 }}>
            {content.label}
          </span>
          <span style={{ color: meta.priceColor, fontSize: meta.priceFontSize, fontWeight: 700 }}>
            {content.currency} {content.price}
          </span>
        </div>
      </div>
    </div>
  );
}
