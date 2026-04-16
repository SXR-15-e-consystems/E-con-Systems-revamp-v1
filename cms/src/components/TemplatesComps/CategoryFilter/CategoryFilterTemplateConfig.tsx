import type { CategoryFilterData, CategoryFilterMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style metadata only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: CategoryFilterMeta = {
  bgColor: '#ffffff',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  sidebarWidth: '200px',
  columns: 3,
  width: '100%',
  activeFilterColor: '#2563eb',
  badgeBgColor: '#16a34a',
  badgeTextColor: '#ffffff',
  headingColor: '#1f2937',
  headingAlign: 'left',
  titleColor: '#1f2937',
  titleFontSize: '14px',
  titleBold: true,
  titleItalic: false,
  descColor: '#6b7280',
  descFontSize: '12px',
  descBold: false,
  descItalic: false,
};

const COLUMN_OPTIONS: { value: CategoryFilterMeta['columns']; label: string }[] = [
  { value: 2, label: '2 Columns' },
  { value: 3, label: '3 Columns' },
  { value: 4, label: '4 Columns' },
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

export function CategoryFilterTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as CategoryFilterData;
  const meta: CategoryFilterMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<CategoryFilterMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Categories, products &amp; content are
        filled during page creation.
      </p>

      {/* Layout */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>

        <label>
          {label('Grid Columns')}
          <div className="flex gap-2">
            {COLUMN_OPTIONS.map(({ value, label: lbl }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ columns: value })}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  meta.columns === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </label>

        <label>
          {label('Section Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100%')}
        </label>

        <label>
          {label('Sidebar Width')}
          {textInput(meta.sidebarWidth, (v) => updateMeta({ sidebarWidth: v }), '200px')}
        </label>

        <label>
          {label('Card Border Radius')}
          {textInput(meta.cardBorderRadius, (v) => updateMeta({ cardBorderRadius: v }), '8px')}
        </label>
      </fieldset>

      {/* Colours */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Colours</legend>
        {colorField('Background', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
        {colorField('Card Background', meta.cardBgColor, (v) => updateMeta({ cardBgColor: v }))}
        {colorField('Active Filter', meta.activeFilterColor, (v) =>
          updateMeta({ activeFilterColor: v }),
        )}
        <div className="grid grid-cols-2 gap-3">
          {colorField('Badge BG', meta.badgeBgColor, (v) => updateMeta({ badgeBgColor: v }))}
          {colorField('Badge Text', meta.badgeTextColor, (v) =>
            updateMeta({ badgeTextColor: v }),
          )}
        </div>
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

      {/* Card Typography */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Card Typography</legend>

        {/* Title */}
        <div className="space-y-2">
          <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Product Name</span>
          <div className="grid grid-cols-2 gap-3">
            {colorField('Colour', meta.titleColor, (v) => updateMeta({ titleColor: v }))}
            <label className="flex flex-col gap-1">
              {label('Font Size')}
              {textInput(meta.titleFontSize, (v) => updateMeta({ titleFontSize: v }), '14px')}
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateMeta({ titleBold: !meta.titleBold })}
              className={`px-3 py-1.5 rounded text-sm font-bold border transition-colors ${
                meta.titleBold
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => updateMeta({ titleItalic: !meta.titleItalic })}
              className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                meta.titleItalic
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
              style={{ fontStyle: 'italic' }}
            >
              I
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Description */}
        <div className="space-y-2">
          <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">Description</span>
          <div className="grid grid-cols-2 gap-3">
            {colorField('Colour', meta.descColor, (v) => updateMeta({ descColor: v }))}
            <label className="flex flex-col gap-1">
              {label('Font Size')}
              {textInput(meta.descFontSize, (v) => updateMeta({ descFontSize: v }), '12px')}
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateMeta({ descBold: !meta.descBold })}
              className={`px-3 py-1.5 rounded text-sm font-bold border transition-colors ${
                meta.descBold
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => updateMeta({ descItalic: !meta.descItalic })}
              className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                meta.descItalic
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
              style={{ fontStyle: 'italic' }}
            >
              I
            </button>
          </div>
        </div>
      </fieldset>

      {/* Live preview */}
      <div>
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="mt-2 rounded border overflow-hidden"
          style={{ backgroundColor: meta.bgColor }}
        >
          <div className="flex gap-3 p-4">
            {/* Sidebar preview */}
            <div
              className="shrink-0 space-y-1"
              style={{ width: '80px' }}
            >
              <div
                className="rounded px-2 py-1 text-[10px] font-medium text-white"
                style={{ backgroundColor: meta.activeFilterColor }}
              >
                All
              </div>
              <div className="rounded px-2 py-1 text-[10px] text-gray-500 bg-gray-100">
                USB Camera
              </div>
              <div className="rounded px-2 py-1 text-[10px] text-gray-500 bg-gray-100">
                MIPI Camera
              </div>
            </div>
            {/* Grid preview */}
            <div
              className="flex-1 grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${meta.columns}, 1fr)`,
              }}
            >
              {Array.from({ length: meta.columns * 2 }).map((_, i) => (
                <div
                  key={i}
                  className="relative flex flex-col items-center justify-center p-2 min-h-[48px]"
                  style={{
                    backgroundColor: meta.cardBgColor,
                    borderRadius: meta.cardBorderRadius,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  {i === 0 && (
                    <span
                      className="absolute top-1 right-1 text-[7px] px-1 rounded"
                      style={{
                        backgroundColor: meta.badgeBgColor,
                        color: meta.badgeTextColor,
                      }}
                    >
                      New
                    </span>
                  )}
                  <span className="text-[9px] text-gray-400">📷</span>
                  <span
                    className="text-[8px] mt-0.5"
                    style={{
                      color: meta.titleColor,
                      fontSize: `calc(${meta.titleFontSize} * 0.6)`,
                      fontWeight: meta.titleBold ? 700 : 400,
                      fontStyle: meta.titleItalic ? 'italic' : 'normal',
                    }}
                  >
                    Product
                  </span>
                  <span
                    className="text-[7px]"
                    style={{
                      color: meta.descColor,
                      fontSize: `calc(${meta.descFontSize} * 0.6)`,
                      fontWeight: meta.descBold ? 700 : 400,
                      fontStyle: meta.descItalic ? 'italic' : 'normal',
                    }}
                  >
                    Description text…
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
