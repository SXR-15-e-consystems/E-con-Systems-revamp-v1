import type { SamplePriceData, SamplePriceMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style + default values
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

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

function textInput(value: string, onChange: (v: string) => void, placeholder?: string) {
  return (
    <input
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function SamplePriceTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as SamplePriceData;
  const meta: SamplePriceMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<SamplePriceMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure style &amp; default values. Content can be overridden during page creation.
      </p>

      {/* Default values */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Default Values</legend>
        <div className="grid grid-cols-3 gap-3">
          <label>
            {label('Label Text')}
            {textInput(meta.label, (v) => updateMeta({ label: v }), 'Sample Price')}
          </label>
          <label>
            {label('Currency')}
            {textInput(meta.currency, (v) => updateMeta({ currency: v }), 'USD')}
          </label>
          <label>
            {label('Price')}
            {textInput(meta.price, (v) => updateMeta({ price: v }), '299')}
          </label>
        </div>
      </fieldset>

      {/* Style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Label Font Size')}
            {textInput(meta.labelFontSize, (v) => updateMeta({ labelFontSize: v }), '14px')}
          </label>
          <label>
            {label('Price Font Size')}
            {textInput(meta.priceFontSize, (v) => updateMeta({ priceFontSize: v }), '22px')}
          </label>
          <label>
            {label('Label Colour')}
            <div className="flex gap-2">
              <input type="color" value={meta.labelColor} onChange={(e) => updateMeta({ labelColor: e.target.value })} className="h-9 w-10 rounded border border-gray-300 cursor-pointer" />
              {textInput(meta.labelColor, (v) => updateMeta({ labelColor: v }))}
            </div>
          </label>
          <label>
            {label('Price Colour')}
            <div className="flex gap-2">
              <input type="color" value={meta.priceColor} onChange={(e) => updateMeta({ priceColor: e.target.value })} className="h-9 w-10 rounded border border-gray-300 cursor-pointer" />
              {textInput(meta.priceColor, (v) => updateMeta({ priceColor: v }))}
            </div>
          </label>
          <label>
            {label('Background')}
            <div className="flex gap-2">
              <input type="color" value={meta.bgColor} onChange={(e) => updateMeta({ bgColor: e.target.value })} className="h-9 w-10 rounded border border-gray-300 cursor-pointer" />
              {textInput(meta.bgColor, (v) => updateMeta({ bgColor: v }))}
            </div>
          </label>
          <label>
            {label('Border Colour')}
            <div className="flex gap-2">
              <input type="color" value={meta.borderColor} onChange={(e) => updateMeta({ borderColor: e.target.value })} className="h-9 w-10 rounded border border-gray-300 cursor-pointer" />
              {textInput(meta.borderColor, (v) => updateMeta({ borderColor: v }))}
            </div>
          </label>
          <label>
            {label('Border Radius')}
            {textInput(meta.borderRadius, (v) => updateMeta({ borderRadius: v }), '10px')}
          </label>
          <label>
            {label('Width')}
            {textInput(meta.width, (v) => updateMeta({ width: v }), '100%')}
          </label>
        </div>
      </fieldset>

      {/* Preview */}
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <span className="text-xs font-semibold text-gray-500 mb-2 block">Preview</span>
        <div
          className="inline-flex flex-col gap-0.5 px-5 py-3"
          style={{
            backgroundColor: meta.bgColor,
            borderRadius: meta.borderRadius,
            border: `1px solid ${meta.borderColor}`,
          }}
        >
          <span style={{ color: meta.labelColor, fontSize: meta.labelFontSize, fontWeight: 500 }}>
            {meta.label}
          </span>
          <span style={{ color: meta.priceColor, fontSize: meta.priceFontSize, fontWeight: 700 }}>
            {meta.currency} {meta.price}
          </span>
        </div>
      </div>
    </div>
  );
}
