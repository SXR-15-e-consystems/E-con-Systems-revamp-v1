import type {
  CTAButtonData,
  CTAButtonMeta,
  CTAButtonPosition,
  CTAButtonStyle,
  FormType,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config — form type, position, style only
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: CTAButtonMeta = {
  formType: 'contact',
  width: 'auto',
  position: 'inline',
  style: {
    bgColor: '#e63329',
    textColor: '#ffffff',
    borderRadius: '4px',
    fontSize: '16px',
    padding: '12px 24px',
  },
};

const FORM_TYPES: { value: FormType; label: string }[] = [
  { value: 'contact', label: 'Contact Form' },
  { value: 'registration', label: 'Registration Form' },
  { value: 'get-quote', label: 'Get Quote Form' },
];

const POSITIONS: { value: CTAButtonPosition; label: string }[] = [
  { value: 'inline', label: 'Inline (in page flow)' },
  { value: 'fixed-bottom-right', label: 'Fixed — bottom right' },
  { value: 'fixed-bottom-center', label: 'Fixed — bottom center' },
];

export function CTAButtonTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as CTAButtonData;
  const meta: CTAButtonMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<CTAButtonMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  function updateStyle(patch: Partial<CTAButtonStyle>) {
    updateMeta({ style: { ...meta.style, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure form type, position &amp; style only.
      </p>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Form to Open</legend>
        <div className="space-y-2">
          {FORM_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="ctaFormType"
                value={value}
                checked={meta.formType === value}
                onChange={() => updateMeta({ formType: value })}
                className="h-4 w-4"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Position</legend>
        <div className="space-y-2">
          {POSITIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="ctaPosition"
                value={value}
                checked={meta.position === value}
                onChange={() => updateMeta({ position: value })}
                className="h-4 w-4"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Button Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">BG Colour</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={meta.style.bgColor}
                onChange={(e) => updateStyle({ bgColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border"
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-2 text-xs"
                value={meta.style.bgColor}
                onChange={(e) => updateStyle({ bgColor: e.target.value })}
              />
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Text Colour</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={meta.style.textColor}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border"
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-2 text-xs"
                value={meta.style.textColor}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
              />
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Border Radius</span>
            <input
              className="rounded border border-gray-300 px-2 py-2 text-xs"
              value={meta.style.borderRadius}
              onChange={(e) => updateStyle({ borderRadius: e.target.value })}
              placeholder="4px"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Font Size</span>
            <input
              className="rounded border border-gray-300 px-2 py-2 text-xs"
              value={meta.style.fontSize}
              onChange={(e) => updateStyle({ fontSize: e.target.value })}
              placeholder="16px"
            />
          </label>
          <label className="flex flex-col gap-1 col-span-2">
            <span className="text-xs font-semibold text-gray-600">Padding</span>
            <input
              className="rounded border border-gray-300 px-2 py-2 text-xs"
              value={meta.style.padding}
              onChange={(e) => updateStyle({ padding: e.target.value })}
              placeholder="12px 24px"
            />
          </label>
        </div>

        {/* Live preview */}
        <div>
          <span className="text-xs text-gray-500">Preview:</span>
          <div className="mt-2 p-3 bg-gray-100 rounded flex items-center justify-center">
            <button
              type="button"
              style={{
                backgroundColor: meta.style.bgColor,
                color: meta.style.textColor,
                borderRadius: meta.style.borderRadius,
                fontSize: meta.style.fontSize,
                padding: meta.style.padding,
              }}
              className="font-medium"
            >
              {(data.content as { label?: string })?.label || 'Button Label'}
            </button>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
