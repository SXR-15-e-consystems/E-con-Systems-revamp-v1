import type { RelatedBlogsGridData, RelatedBlogsGridMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style metadata only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: RelatedBlogsGridMeta = {
  bgColor: '#f8fafc',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  columns: 3,
  headingColor: '#1f2937',
  headingAlign: 'left',
  cardAlign: 'left',
  titleColor: '#1f2937',
  ctaBgColor: '#2563eb',
  ctaTextColor: '#ffffff',
  width: '100%',
};

const COLUMN_OPTIONS: RelatedBlogsGridMeta['columns'][] = [2, 3, 4];

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

export function RelatedBlogsGridTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as RelatedBlogsGridData;
  const meta: RelatedBlogsGridMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<RelatedBlogsGridMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Heading &amp; blog items are filled
        during page creation.
      </p>

      {/* Layout */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
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
        <label>
          {label('Section Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100%')}
        </label>
        <label>
          {label('Card Border Radius')}
          {textInput(meta.cardBorderRadius, (v) => updateMeta({ cardBorderRadius: v }), '8px')}
        </label>
        {colorField('Background Colour', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
        {colorField('Card Background', meta.cardBgColor, (v) => updateMeta({ cardBgColor: v }))}
        <div>
          {label('Card Alignment')}
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => updateMeta({ cardAlign: align })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.cardAlign === align
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
        {colorField('Title Colour', meta.titleColor, (v) => updateMeta({ titleColor: v }))}
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

      {/* Live preview */}
      <div>
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="mt-2 rounded border overflow-hidden p-4"
          style={{ backgroundColor: meta.bgColor }}
        >
          <div
            className="text-sm font-bold mb-3"
            style={{ color: meta.titleColor }}
          >
            Related Blogs
          </div>
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${meta.columns}, 1fr)`,
            }}
          >
            {Array.from({ length: meta.columns }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden shadow-sm"
                style={{
                  backgroundColor: meta.cardBgColor,
                  borderRadius: meta.cardBorderRadius,
                }}
              >
                <div className="bg-gray-100 h-16 flex items-center justify-center">
                  <span className="text-[10px] text-gray-400">Image</span>
                </div>
                <div className="p-2 space-y-1">
                  <div className="h-2 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-full" />
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{ backgroundColor: meta.ctaBgColor, color: meta.ctaTextColor }}
                  >
                    Know More
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
