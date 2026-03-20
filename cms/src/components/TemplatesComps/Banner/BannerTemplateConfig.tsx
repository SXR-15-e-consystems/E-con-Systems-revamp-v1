import type { BannerData, BannerMeta, CTAPosition, BannerVariant } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — layout & style metadata only, no content values
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: BannerMeta = {
  width: '100%',
  height: '480px',
  bgColor: '#000000',
  variant: 'type2',
  sliderMode: false,
  autoplayInterval: 5000,
  ctaPosition: 'bottom-left',
  ctaStyle: {
    bgColor: '#e63329',
    textColor: '#ffffff',
    borderRadius: '4px',
    fontSize: '16px',
  },
};

const CTA_POSITIONS: CTAPosition[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'center',
];

const BANNER_VARIANTS: BannerVariant[] = ['type1', 'type2'];

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

function textInput(
  value: string,
  onChange: (v: string) => void,
  placeholder?: string,
) {
  return (
    <input
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function BannerTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as BannerData;
  const meta: BannerMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<BannerMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  function updateCtaStyle(patch: Partial<BannerMeta['ctaStyle']>) {
    updateMeta({ ctaStyle: { ...meta.ctaStyle, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Content is filled during page creation.
      </p>

      {/* Dimensions */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Dimensions</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Width')}
            {textInput(meta.width, (v) => updateMeta({ width: v }), '100% or 1200px')}
          </label>
          <label>
            {label('Height')}
            {textInput(meta.height, (v) => updateMeta({ height: v }), '480px or 60vh')}
          </label>
        </div>
        <label>
          {label('Fallback BG Colour')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.bgColor}
              onChange={(e) => updateMeta({ bgColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.bgColor, (v) => updateMeta({ bgColor: v }))}
          </div>
        </label>
      </fieldset>

      {/* Variant */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Variant</legend>
        <label>
          {label('Banner type')}
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.variant}
            onChange={(e) => updateMeta({ variant: e.target.value as BannerVariant })}
          >
            {BANNER_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {v === 'type1' ? 'Type 1 — Image + link only' : 'Type 2 — Image + title + description + CTA'}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      {/* Slider */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Slider</legend>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={meta.sliderMode}
            onChange={(e) => updateMeta({ sliderMode: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm">Enable slider mode</span>
        </label>
        {meta.sliderMode && (
          <label>
            {label('Autoplay interval (ms) — 0 = manual')}
            <input
              type="number"
              min={0}
              step={500}
              value={meta.autoplayInterval}
              onChange={(e) => updateMeta({ autoplayInterval: Number(e.target.value) })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        )}
      </fieldset>

      {/* CTA style — only relevant for type2 */}
      {meta.variant === 'type2' && (
        <fieldset className="border border-gray-200 rounded p-3 space-y-3">
          <legend className="text-xs font-bold text-gray-700 px-1">CTA Style</legend>
          <label>
            {label('CTA Position')}
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.ctaPosition}
              onChange={(e) => updateMeta({ ctaPosition: e.target.value as CTAPosition })}
            >
              {CTA_POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              {label('CTA BG Colour')}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={meta.ctaStyle.bgColor}
                  onChange={(e) => updateCtaStyle({ bgColor: e.target.value })}
                  className="h-8 w-12 cursor-pointer rounded border"
                />
                {textInput(meta.ctaStyle.bgColor, (v) => updateCtaStyle({ bgColor: v }))}
              </div>
            </label>
            <label>
              {label('CTA Text Colour')}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={meta.ctaStyle.textColor}
                  onChange={(e) => updateCtaStyle({ textColor: e.target.value })}
                  className="h-8 w-12 cursor-pointer rounded border"
                />
                {textInput(meta.ctaStyle.textColor, (v) => updateCtaStyle({ textColor: v }))}
              </div>
            </label>
            <label>
              {label('Border Radius')}
              {textInput(meta.ctaStyle.borderRadius, (v) => updateCtaStyle({ borderRadius: v }), '4px')}
            </label>
            <label>
              {label('Font Size')}
              {textInput(meta.ctaStyle.fontSize, (v) => updateCtaStyle({ fontSize: v }), '16px')}
            </label>
          </div>
        </fieldset>
      )}
    </div>
  );
}
