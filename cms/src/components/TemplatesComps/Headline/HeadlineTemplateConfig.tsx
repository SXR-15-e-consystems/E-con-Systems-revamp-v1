import type {
  HeadlineData,
  HeadlineMeta,
  HeadlineAlign,
  HeadlineWeight,
  HeadlineTag,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — typography & style metadata only
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: HeadlineMeta = {
  tag: 'h2',
  fontFamily: 'Inter, sans-serif',
  fontSize: '28px',
  fontWeight: '700',
  textColor: '#1a1a2e',
  bgColor: 'transparent',
  align: 'left',
  width: '100%',
  letterSpacing: '0px',
  lineHeight: '1.3',
};

const TAG_OPTIONS: { value: HeadlineTag; label: string }[] = [
  { value: 'h1', label: 'H1 — Page title' },
  { value: 'h2', label: 'H2 — Section heading' },
  { value: 'h3', label: 'H3 — Sub-heading' },
  { value: 'h4', label: 'H4' },
  { value: 'h5', label: 'H5' },
  { value: 'h6', label: 'H6' },
  { value: 'p', label: 'Paragraph' },
];

const WEIGHT_OPTIONS: { value: HeadlineWeight; label: string }[] = [
  { value: '400', label: '400 — Regular' },
  { value: '500', label: '500 — Medium' },
  { value: '600', label: '600 — Semi-bold' },
  { value: '700', label: '700 — Bold' },
  { value: '800', label: '800 — Extra-bold' },
  { value: '900', label: '900 — Black' },
];

const ALIGN_OPTIONS: { value: HeadlineAlign; label: string; icon: string }[] = [
  { value: 'left', label: 'Left', icon: '⫷' },
  { value: 'center', label: 'Center', icon: '☰' },
  { value: 'right', label: 'Right', icon: '⫸' },
];

const FONT_OPTIONS: string[] = [
  'Inter, sans-serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Montserrat, sans-serif',
  'Poppins, sans-serif',
  'Lato, sans-serif',
];

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

export function HeadlineTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as HeadlineData;
  const meta: HeadlineMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<HeadlineMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure typography &amp; style. Text is filled during page creation.
      </p>

      {/* Typography */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Typography</legend>

        <label>
          {label('HTML Tag')}
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.tag}
            onChange={(e) => updateMeta({ tag: e.target.value as HeadlineTag })}
          >
            {TAG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <label>
          {label('Font Family')}
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.fontFamily}
            onChange={(e) => updateMeta({ fontFamily: e.target.value })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f.split(',')[0]}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Font Size')}
            {textInput(meta.fontSize, (v) => updateMeta({ fontSize: v }), '28px or 2rem')}
          </label>
          <label>
            {label('Font Weight')}
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.fontWeight}
              onChange={(e) => updateMeta({ fontWeight: e.target.value as HeadlineWeight })}
            >
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Letter Spacing')}
            {textInput(meta.letterSpacing, (v) => updateMeta({ letterSpacing: v }), '0px or 0.05em')}
          </label>
          <label>
            {label('Line Height')}
            {textInput(meta.lineHeight, (v) => updateMeta({ lineHeight: v }), '1.3 or 40px')}
          </label>
        </div>
      </fieldset>

      {/* Alignment */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Alignment</legend>
        <div className="flex gap-2">
          {ALIGN_OPTIONS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => updateMeta({ align: a.value })}
              className={`flex-1 py-2 rounded text-sm font-medium border transition-colors ${
                meta.align === a.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Colours & dimensions */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Colours &amp; Size</legend>
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
          {label('Background Colour')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.bgColor === 'transparent' ? '#ffffff' : meta.bgColor}
              onChange={(e) => updateMeta({ bgColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.bgColor, (v) => updateMeta({ bgColor: v }), 'transparent or #fff')}
          </div>
        </label>
        <label>
          {label('Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100% or 800px')}
        </label>
      </fieldset>

      {/* Live preview */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-2">
        <legend className="text-xs font-bold text-gray-700 px-1">Preview</legend>
        <div
          className="rounded p-4 overflow-hidden"
          style={{ backgroundColor: meta.bgColor === 'transparent' ? '#f8fafc' : meta.bgColor }}
        >
          <span
            style={{
              fontFamily: meta.fontFamily,
              fontSize: meta.fontSize,
              fontWeight: Number(meta.fontWeight),
              color: meta.textColor,
              textAlign: meta.align,
              letterSpacing: meta.letterSpacing,
              lineHeight: meta.lineHeight,
              display: 'block',
            }}
          >
            Sample Headline
          </span>
        </div>
      </fieldset>
    </div>
  );
}
