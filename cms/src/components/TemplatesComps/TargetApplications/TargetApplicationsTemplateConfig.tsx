import type { TargetApplicationsData, TargetApplicationsMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style metadata only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: TargetApplicationsMeta = {
  bgColor: '#ffffff',
  cardBorderRadius: '8px',
  captionColor: '#1f2937',
  columns: 4,
  layout: 'grid',
  headingColor: '#1f2937',
  headingAlign: 'center',
  cardAlign: 'center',
  autoplay: false,
  autoplayInterval: 4000,
  width: '100%',
};

const COLUMN_OPTIONS: TargetApplicationsMeta['columns'][] = [3, 4, 5];
const LAYOUT_OPTIONS: { value: TargetApplicationsMeta['layout']; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'slider', label: 'Slider' },
];
const ALIGN_OPTIONS: { value: TargetApplicationsMeta['headingAlign']; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
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

export function TargetApplicationsTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as TargetApplicationsData;
  const meta: TargetApplicationsMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<TargetApplicationsMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Heading, images &amp; captions are
        filled during page creation.
      </p>

      {/* Layout */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        {colorField('Background Colour', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
        {colorField('Heading Colour', meta.headingColor, (v) => updateMeta({ headingColor: v }))}
        <label>
          {label('Section Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100%')}
        </label>
        <div>
          {label('Display Mode')}
          <div className="flex gap-2">
            {LAYOUT_OPTIONS.map(({ value, label: lbl }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ layout: value })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.layout === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          {label('Columns')}
          <div className="flex gap-2">
            {COLUMN_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => updateMeta({ columns: count })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.columns === count
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
        <div>
          {label('Heading Alignment')}
          <div className="flex gap-2">
            {ALIGN_OPTIONS.map(({ value, label: lbl }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ headingAlign: value })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.headingAlign === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          {label('Card Alignment')}
          <div className="flex gap-2">
            {ALIGN_OPTIONS.map(({ value, label: lbl }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ cardAlign: value })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.cardAlign === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Card Style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Card Style</legend>
        <label>
          {label('Card Border Radius')}
          {textInput(meta.cardBorderRadius, (v) => updateMeta({ cardBorderRadius: v }), '8px')}
        </label>
        {colorField('Caption Colour', meta.captionColor, (v) =>
          updateMeta({ captionColor: v }),
        )}
      </fieldset>

      {/* Slider Settings (only when layout is slider) */}
      {meta.layout === 'slider' && (
        <fieldset className="border border-gray-200 rounded p-3 space-y-3">
          <legend className="text-xs font-bold text-gray-700 px-1">Slider Settings</legend>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={meta.autoplay}
              onChange={(e) => updateMeta({ autoplay: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Autoplay</span>
          </label>
          {meta.autoplay && (
            <label>
              {label('Autoplay Interval (ms)')}
              <input
                type="number"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={meta.autoplayInterval}
                min={1000}
                step={500}
                onChange={(e) => updateMeta({ autoplayInterval: Number(e.target.value) })}
              />
            </label>
          )}
        </fieldset>
      )}

      {/* Live preview */}
      <div>
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="mt-2 rounded border overflow-hidden"
          style={{ backgroundColor: meta.bgColor }}
        >
          <div className="p-4">
            <div
              className="text-sm font-bold text-gray-800 mb-3"
              style={{ textAlign: meta.headingAlign }}
            >
              Target Applications
            </div>
            <div className={meta.layout === 'grid' ? 'grid gap-2' : 'flex gap-2'}
              style={meta.layout === 'grid' ? { gridTemplateColumns: `repeat(${meta.columns}, 1fr)` } : undefined}
            >
              {Array.from({ length: meta.columns }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full aspect-square bg-gray-100 flex items-center justify-center"
                    style={{ borderRadius: meta.cardBorderRadius }}
                  >
                    <span className="text-[10px] text-gray-400">Image</span>
                  </div>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: meta.captionColor }}
                  >
                    App {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
