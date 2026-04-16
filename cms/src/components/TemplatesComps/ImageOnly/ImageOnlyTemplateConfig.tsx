import type { ImageOnlyData, ImageOnlyMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import { DimensionInput } from '../shared/DimensionInput';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — image display style only
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ImageOnlyMeta = {
  bgColor: '#ffffff',
  borderRadius: '0px',
  objectFit: 'cover',
  width: '100%',
  height: '100%',
  alignX: 'left',
  margin: '0px',
  maxWidth: '',
  maxHeight: '',
  minWidth: '',
  minHeight: '',
};

const FIT_OPTIONS: { value: ImageOnlyMeta['objectFit']; label: string }[] = [
  { value: 'cover', label: 'Cover (fill, crop edges)' },
  { value: 'contain', label: 'Contain (fit inside, letterbox)' },
  { value: 'fill', label: 'Fill (stretch to fit)' },
  { value: 'none', label: 'None (original size)' },
];

const ALIGN_OPTIONS: { value: ImageOnlyMeta['alignX']; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
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

export function ImageOnlyTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ImageOnlyData;
  const meta: ImageOnlyMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<ImageOnlyMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure display style. Image URL is set during page creation.
      </p>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Display Options</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Object Fit')}
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.objectFit}
              onChange={(e) => updateMeta({ objectFit: e.target.value as ImageOnlyMeta['objectFit'] })}
            >
              {FIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label>
            {label('Border Radius')}
            {textInput(meta.borderRadius, (v) => updateMeta({ borderRadius: v }), '0px')}
          </label>
          <label>
            {label('Background')}
            <div className="flex gap-2">
              <input type="color" value={meta.bgColor} onChange={(e) => updateMeta({ bgColor: e.target.value })} className="h-9 w-10 rounded border border-gray-300 cursor-pointer" />
              {textInput(meta.bgColor, (v) => updateMeta({ bgColor: v }))}
            </div>
          </label>
          <div>
            <DimensionInput
              label="Width"
              value={meta.width}
              onChange={(v) => updateMeta({ width: v })}
            />
          </div>
          <div>
            <DimensionInput
              label="Height"
              value={meta.height}
              onChange={(v) => updateMeta({ height: v })}
            />
          </div>
        </div>
      </fieldset>

      {/* Position */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Position</legend>
        <div>
          {label('Horizontal Alignment')}
          <div className="flex gap-2">
            {ALIGN_OPTIONS.map(({ value, label: lbl }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ alignX: value })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.alignX === value
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
          {label('Margin (CSS shorthand)')}
          {textInput(meta.margin, (v) => updateMeta({ margin: v }), '0px')}
        </label>
      </fieldset>

      {/* Size Constraints */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Size Constraints</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <DimensionInput
              label="Max Width"
              value={meta.maxWidth}
              onChange={(v) => updateMeta({ maxWidth: v })}
            />
          </div>
          <div>
            <DimensionInput
              label="Max Height"
              value={meta.maxHeight}
              onChange={(v) => updateMeta({ maxHeight: v })}
            />
          </div>
          <div>
            <DimensionInput
              label="Min Width"
              value={meta.minWidth}
              onChange={(v) => updateMeta({ minWidth: v })}
            />
          </div>
          <div>
            <DimensionInput
              label="Min Height"
              value={meta.minHeight}
              onChange={(v) => updateMeta({ minHeight: v })}
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
