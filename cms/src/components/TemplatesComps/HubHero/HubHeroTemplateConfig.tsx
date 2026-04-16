import type { HubHeroData, HubHeroMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style metadata only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: HubHeroMeta = {
  bgColor: '#ffffff',
  titleColor: '#1a1a2e',
  titleFontSize: '32px',
  titleAlign: 'left',
  descriptionColor: '#374151',
  descriptionFontSize: '15px',
  imagePosition: 'right',
  contentWidth: '50%',
  mediaWidth: '50%',
  mediaMode: 'single',
  width: '100%',
  ctaBgColor: '#2563eb',
  ctaTextColor: '#ffffff',
  brandBadgePosition: 'below-image',
  brandBadgeWidth: '120px',
  brandBadgeHeight: '40px',
};

const IMAGE_POSITIONS: { value: HubHeroMeta['imagePosition']; label: string }[] = [
  { value: 'right', label: 'Image Right' },
  { value: 'left', label: 'Image Left' },
];

const BADGE_POSITIONS: { value: HubHeroMeta['brandBadgePosition']; label: string }[] = [
  { value: 'below-image', label: 'Below Image' },
  { value: 'title-row-right', label: 'Title Row (Right)' },
];

const WIDTH_PRESETS: { label: string; content: string; media: string }[] = [
  { label: '50 / 50', content: '50%', media: '50%' },
  { label: '60 / 40', content: '60%', media: '40%' },
  { label: '70 / 30', content: '70%', media: '30%' },
];

const MEDIA_MODES: { value: HubHeroMeta['mediaMode']; label: string }[] = [
  { value: 'single', label: 'Single Image' },
  { value: 'slider', label: 'Image Slider' },
];

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

function colorField(
  fieldLabel: string,
  value: string,
  onChange: (v: string) => void,
) {
  return (
    <label className="flex flex-col gap-1">
      {label(fieldLabel)}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 cursor-pointer rounded border"
        />
        <input
          className="flex-1 rounded border border-gray-300 px-2 py-2 text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  );
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

export function HubHeroTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as HubHeroData;
  const meta: HubHeroMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<HubHeroMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  const isRight = meta.imagePosition === 'right';

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Title, description &amp; images are
        filled during page creation.
      </p>

      {/* Layout */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <label>
          {label('Image Position')}
          <div className="flex gap-2">
            {IMAGE_POSITIONS.map(({ value, label: lbl }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ imagePosition: value })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.imagePosition === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </label>
        <div>
          {label('Content / Media Width')}
          <div className="flex gap-2">
            {WIDTH_PRESETS.map(({ label: lbl, content: cw, media: mw }) => (
              <button
                key={lbl}
                type="button"
                onClick={() => updateMeta({ contentWidth: cw, mediaWidth: mw })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.contentWidth === cw && meta.mediaWidth === mw
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500">Content Width</span>
              {textInput(meta.contentWidth, (v) => updateMeta({ contentWidth: v }), '50%')}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500">Media Width</span>
              {textInput(meta.mediaWidth, (v) => updateMeta({ mediaWidth: v }), '50%')}
            </label>
          </div>
        </div>
        <div>
          {label('Media Mode')}
          <div className="flex gap-2">
            {MEDIA_MODES.map(({ value, label: lbl }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ mediaMode: value })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.mediaMode === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <label>
          {label('Section Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100%')}
        </label>
        {colorField('Background Colour', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
      </fieldset>

      {/* Title style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Title Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Font Size')}
            {textInput(meta.titleFontSize, (v) => updateMeta({ titleFontSize: v }), '32px')}
          </label>
          {colorField('Colour', meta.titleColor, (v) => updateMeta({ titleColor: v }))}
        </div>
        <div>
          {label('Title Alignment')}
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => updateMeta({ titleAlign: align })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.titleAlign === align
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Description style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Description Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Font Size')}
            {textInput(
              meta.descriptionFontSize,
              (v) => updateMeta({ descriptionFontSize: v }),
              '15px',
            )}
          </label>
          {colorField('Colour', meta.descriptionColor, (v) =>
            updateMeta({ descriptionColor: v }),
          )}
        </div>
      </fieldset>

      {/* CTA style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">CTA Button Style</legend>
        <div className="grid grid-cols-2 gap-3">
          {colorField('BG Colour', meta.ctaBgColor, (v) => updateMeta({ ctaBgColor: v }))}
          {colorField('Text Colour', meta.ctaTextColor, (v) =>
            updateMeta({ ctaTextColor: v }),
          )}
        </div>
      </fieldset>

      {/* Brand Badge style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Brand Badge</legend>
        <div>
          {label('Badge Position')}
          <div className="flex gap-2">
            {BADGE_POSITIONS.map(({ value, label: lbl }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ brandBadgePosition: value })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.brandBadgePosition === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Badge Width')}
            {textInput(meta.brandBadgeWidth, (v) => updateMeta({ brandBadgeWidth: v }), '120px')}
          </label>
          <label>
            {label('Badge Height')}
            {textInput(meta.brandBadgeHeight, (v) => updateMeta({ brandBadgeHeight: v }), '40px')}
          </label>
        </div>
      </fieldset>

      {/* Live preview */}
      <div>
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="mt-2 rounded border overflow-hidden"
          style={{ backgroundColor: meta.bgColor }}
        >
          <div className={`flex gap-4 p-4 ${isRight ? '' : 'flex-row-reverse'}`}>
            {/* Text side */}
            <div className="min-w-0 space-y-2" style={{ flex: `0 0 ${meta.contentWidth}` }}>
              <div
                className="font-bold leading-tight"
                style={{ color: meta.titleColor, fontSize: '14px' }}
              >
                Sample Hub Hero Title
              </div>
              <div style={{ color: meta.descriptionColor, fontSize: '11px' }}>
                Sample description paragraph for the hub page hero section.
              </div>
              <span
                className="inline-block mt-1 px-3 py-1 rounded text-xs font-semibold"
                style={{ backgroundColor: meta.ctaBgColor, color: meta.ctaTextColor }}
              >
                CONTACT US
              </span>
            </div>
            {/* Image side */}
            <div
              className="flex items-center justify-center bg-gray-100 rounded min-h-[80px]"
              style={{ flex: `0 0 ${meta.mediaWidth}` }}
            >
              <span className="text-xs text-gray-400">
                {meta.mediaMode === 'slider' ? 'Slider' : 'Image'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
