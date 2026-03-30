import type {
  ActionButtonData,
  ActionButtonMeta,
  ActionButtonIcon,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — button style (colours, icon, layout)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ActionButtonMeta = {
  bgColor: '#2952cc',
  textColor: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  subTextColor: '#1f2937',
  subTextFontSize: '13px',
  borderRadius: '6px',
  paddingX: '28px',
  paddingY: '12px',
  icon: 'cart',
  iconPosition: 'left',
  width: 'auto',
  align: 'left',
};

const ICON_OPTIONS: { value: ActionButtonIcon; label: string; preview: string }[] = [
  { value: 'none', label: 'None', preview: '' },
  { value: 'cart', label: 'Cart', preview: '🛒' },
  { value: 'download', label: 'Download', preview: '⬇' },
  { value: 'arrow-right', label: 'Arrow →', preview: '→' },
  { value: 'phone', label: 'Phone', preview: '📞' },
  { value: 'mail', label: 'Mail', preview: '✉' },
  { value: 'external', label: 'External Link', preview: '↗' },
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

/** SVG icon for preview */
function IconPreview({ icon, color }: { icon: ActionButtonIcon; color: string }) {
  const cls = "inline-block flex-shrink-0";
  const size = 18;
  switch (icon) {
    case 'cart':
      return (
        <svg className={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
        </svg>
      );
    case 'download':
      return (
        <svg className={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      );
    case 'arrow-right':
      return (
        <svg className={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      );
    case 'phone':
      return (
        <svg className={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
      );
    case 'mail':
      return (
        <svg className={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
        </svg>
      );
    case 'external':
      return (
        <svg className={cls} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      );
    default:
      return null;
  }
}

export { IconPreview };

export function ActionButtonTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ActionButtonData;
  const meta: ActionButtonMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<ActionButtonMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  const sampleText = data.content?.buttonText || 'Button Text';
  const sampleSub = data.content?.subText || 'Sub text goes here';

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure button style. Text &amp; URL are filled during page creation.
      </p>

      {/* Icon */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Icon</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Icon')}
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.icon}
              onChange={(e) => updateMeta({ icon: e.target.value as ActionButtonIcon })}
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.preview} {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {label('Icon Position')}
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.iconPosition}
              onChange={(e) => updateMeta({ iconPosition: e.target.value as 'left' | 'right' })}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      </fieldset>

      {/* Button Style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Button Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Background')}
            <div className="flex gap-2">
              <input type="color" value={meta.bgColor} onChange={(e) => updateMeta({ bgColor: e.target.value })} className="h-9 w-10 rounded border border-gray-300 cursor-pointer" />
              {textInput(meta.bgColor, (v) => updateMeta({ bgColor: v }))}
            </div>
          </label>
          <label>
            {label('Text Colour')}
            <div className="flex gap-2">
              <input type="color" value={meta.textColor} onChange={(e) => updateMeta({ textColor: e.target.value })} className="h-9 w-10 rounded border border-gray-300 cursor-pointer" />
              {textInput(meta.textColor, (v) => updateMeta({ textColor: v }))}
            </div>
          </label>
          <label>
            {label('Font Size')}
            {textInput(meta.fontSize, (v) => updateMeta({ fontSize: v }), '16px')}
          </label>
          <label>
            {label('Font Weight')}
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.fontWeight}
              onChange={(e) => updateMeta({ fontWeight: e.target.value })}
            >
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </label>
          <label>
            {label('Border Radius')}
            {textInput(meta.borderRadius, (v) => updateMeta({ borderRadius: v }), '6px')}
          </label>
          <label>
            {label('Width')}
            {textInput(meta.width, (v) => updateMeta({ width: v }), 'auto')}
          </label>
          <label>
            {label('Padding X')}
            {textInput(meta.paddingX, (v) => updateMeta({ paddingX: v }), '28px')}
          </label>
          <label>
            {label('Padding Y')}
            {textInput(meta.paddingY, (v) => updateMeta({ paddingY: v }), '12px')}
          </label>
        </div>
      </fieldset>

      {/* Sub-text Style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Sub-text Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Sub-text Colour')}
            <div className="flex gap-2">
              <input type="color" value={meta.subTextColor} onChange={(e) => updateMeta({ subTextColor: e.target.value })} className="h-9 w-10 rounded border border-gray-300 cursor-pointer" />
              {textInput(meta.subTextColor, (v) => updateMeta({ subTextColor: v }))}
            </div>
          </label>
          <label>
            {label('Sub-text Font Size')}
            {textInput(meta.subTextFontSize, (v) => updateMeta({ subTextFontSize: v }), '13px')}
          </label>
        </div>
      </fieldset>

      {/* Alignment */}
      <fieldset className="border border-gray-200 rounded p-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <label>
          {label('Alignment')}
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.align}
            onChange={(e) => updateMeta({ align: e.target.value as 'left' | 'center' | 'right' })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
      </fieldset>

      {/* Preview */}
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <span className="text-xs font-semibold text-gray-500 mb-3 block">Preview</span>
        <div style={{ textAlign: meta.align }}>
          <div className="inline-flex flex-col items-center gap-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-2 cursor-default"
              style={{
                backgroundColor: meta.bgColor,
                color: meta.textColor,
                fontSize: meta.fontSize,
                fontWeight: Number(meta.fontWeight),
                borderRadius: meta.borderRadius,
                padding: `${meta.paddingY} ${meta.paddingX}`,
                width: meta.width === 'auto' ? undefined : meta.width,
                border: 'none',
              }}
            >
              {meta.icon !== 'none' && meta.iconPosition === 'left' && (
                <IconPreview icon={meta.icon} color={meta.textColor} />
              )}
              <span>{sampleText}</span>
              {meta.icon !== 'none' && meta.iconPosition === 'right' && (
                <IconPreview icon={meta.icon} color={meta.textColor} />
              )}
            </button>
            <span style={{ color: meta.subTextColor, fontSize: meta.subTextFontSize }}>
              {sampleSub}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
