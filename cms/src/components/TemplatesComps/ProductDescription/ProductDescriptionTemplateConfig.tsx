import type {
  ProductDescriptionData,
  ProductDescriptionMeta,
  BulletStyle,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style metadata only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ProductDescriptionMeta = {
  bgColor: '#ffffff',
  titleColor: '#1a1a2e',
  titleFontSize: '18px',
  titleFontWeight: '700',
  textColor: '#374151',
  textFontSize: '15px',
  bulletStyle: 'disc',
  bulletColor: '#374151',
  lineSpacing: '1.7',
  width: '100%',
};

const BULLET_OPTIONS: { value: BulletStyle; label: string; preview: string }[] = [
  { value: 'disc', label: 'Disc', preview: '•' },
  { value: 'circle', label: 'Circle', preview: '◦' },
  { value: 'square', label: 'Square', preview: '▪' },
  { value: 'dash', label: 'Dash', preview: '–' },
  { value: 'check', label: 'Checkmark', preview: '✓' },
];

const WEIGHT_OPTIONS = ['400', '500', '600', '700', '800'];

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

export function ProductDescriptionTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ProductDescriptionData;
  const meta: ProductDescriptionMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<ProductDescriptionMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure style only. Title &amp; bullet points are filled during page creation.
      </p>

      {/* Title style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Title Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Font Size')}
            {textInput(meta.titleFontSize, (v) => updateMeta({ titleFontSize: v }), '18px')}
          </label>
          <label>
            {label('Font Weight')}
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.titleFontWeight}
              onChange={(e) => updateMeta({ titleFontWeight: e.target.value })}
            >
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {label('Title Colour')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.titleColor}
              onChange={(e) => updateMeta({ titleColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.titleColor, (v) => updateMeta({ titleColor: v }))}
          </div>
        </label>
      </fieldset>

      {/* Bullet style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Bullet Style</legend>
        <label>
          {label('Bullet Type')}
          <div className="flex gap-2 flex-wrap">
            {BULLET_OPTIONS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => updateMeta({ bulletStyle: b.value })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.bulletStyle === b.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {b.preview} {b.label}
              </button>
            ))}
          </div>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Text Font Size')}
            {textInput(meta.textFontSize, (v) => updateMeta({ textFontSize: v }), '15px')}
          </label>
          <label>
            {label('Line Spacing')}
            {textInput(meta.lineSpacing, (v) => updateMeta({ lineSpacing: v }), '1.7')}
          </label>
        </div>
        <label>
          {label('Text Colour')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.textColor}
              onChange={(e) => updateMeta({ textColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.textColor, (v) => updateMeta({ textColor: v }))}
          </div>
        </label>
        <label>
          {label('Bullet Colour')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.bulletColor}
              onChange={(e) => updateMeta({ bulletColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.bulletColor, (v) => updateMeta({ bulletColor: v }))}
          </div>
        </label>
      </fieldset>

      {/* Background & dimensions */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <label>
          {label('Background Colour')}
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
        <label>
          {label('Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100% or 600px')}
        </label>
      </fieldset>
    </div>
  );
}
