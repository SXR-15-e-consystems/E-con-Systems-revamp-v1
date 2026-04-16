import type { SpotlightsData, SpotlightsMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style metadata only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: SpotlightsMeta = {
  bgColor: '#ffffff',
  headingColor: '#1f2937',
  headingAlign: 'center',
  iconSize: '48px',
  titleColor: '#1f2937',
  titleFontSize: '18px',
  descriptionColor: '#6b7280',
  descriptionFontSize: '14px',
  columns: 3,
  layout: 'grid',
  cardAlign: 'left',
  width: '100%',
};

const COLUMN_OPTIONS: SpotlightsMeta['columns'][] = [2, 3, 4, 5];

const LAYOUT_OPTIONS: { value: SpotlightsMeta['layout']; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'slider', label: 'Slider' },
];

const CARD_ALIGN_OPTIONS: { value: SpotlightsMeta['cardAlign']; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
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

export function SpotlightsTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as SpotlightsData;
  const meta: SpotlightsMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<SpotlightsMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Heading, icons &amp; descriptions are
        filled during page creation.
      </p>

      {/* Layout */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <div>
          {label('Layout Mode')}
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
        {meta.layout === 'grid' && (
          <>
            <label>
              {label('Columns')}
              <div className="flex gap-2">
                {COLUMN_OPTIONS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => updateMeta({ columns: col })}
                    className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                      meta.columns === col
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </label>
            <div>
              {label('Card Alignment')}
              <div className="flex gap-2">
                {CARD_ALIGN_OPTIONS.map(({ value, label: lbl }) => (
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
          </>
        )}
        <label>
          {label('Section Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100%')}
        </label>
        <label>
          {label('Icon Size')}
          {textInput(meta.iconSize, (v) => updateMeta({ iconSize: v }), '48px')}
        </label>
        {colorField('Background Colour', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
      </fieldset>

      {/* Heading Style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Heading Style</legend>
        {colorField('Heading Colour', meta.headingColor, (v) => updateMeta({ headingColor: v }))}
        <div>
          {label('Heading Alignment')}
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => updateMeta({ headingAlign: align })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.headingAlign === align
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

      {/* Title style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Title Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Font Size')}
            {textInput(meta.titleFontSize, (v) => updateMeta({ titleFontSize: v }), '18px')}
          </label>
          {colorField('Colour', meta.titleColor, (v) => updateMeta({ titleColor: v }))}
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
              '14px',
            )}
          </label>
          {colorField('Colour', meta.descriptionColor, (v) =>
            updateMeta({ descriptionColor: v }),
          )}
        </div>
      </fieldset>

      {/* Live preview */}
      <div>
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="mt-2 rounded border overflow-hidden"
          style={{ backgroundColor: meta.bgColor }}
        >
          <div
            className={`grid gap-4 p-4 ${
              meta.columns === 4
                ? 'grid-cols-4'
                : meta.columns === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
            }`}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1">
                <div
                  className="rounded bg-gray-100 flex items-center justify-center"
                  style={{
                    width: parseInt(meta.iconSize) || 48,
                    height: parseInt(meta.iconSize) || 48,
                  }}
                >
                  <span className="text-[10px] text-gray-400">Icon</span>
                </div>
                <div
                  className="font-semibold leading-tight"
                  style={{ color: meta.titleColor, fontSize: '12px' }}
                >
                  Spotlight {i}
                </div>
                <div style={{ color: meta.descriptionColor, fontSize: '10px' }}>
                  Sample description text
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
