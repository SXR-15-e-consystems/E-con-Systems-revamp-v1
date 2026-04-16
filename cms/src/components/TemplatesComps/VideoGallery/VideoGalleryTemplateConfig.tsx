import type { VideoGalleryData, VideoGalleryMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style metadata only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: VideoGalleryMeta = {
  bgColor: '#ffffff',
  columns: 3,
  layout: 'grid',
  headingColor: '#1f2937',
  headingAlign: 'left',
  cardAlign: 'left',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  titleColor: '#1f2937',
  width: '100%',
};

const COLUMN_OPTIONS: VideoGalleryMeta['columns'][] = [2, 3, 4, 5];
const LAYOUT_OPTIONS: { value: VideoGalleryMeta['layout']; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'slider', label: 'Slider' },
];
const ALIGN_OPTIONS: { value: VideoGalleryMeta['headingAlign']; label: string }[] = [
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

export function VideoGalleryTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as VideoGalleryData;
  const meta: VideoGalleryMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<VideoGalleryMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Heading and videos are
        filled during page creation.
      </p>

      {/* Layout */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
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

      {/* Colours */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Colours</legend>
        {colorField('Background Colour', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
        {colorField('Card Background', meta.cardBgColor, (v) => updateMeta({ cardBgColor: v }))}
        {colorField('Title Colour', meta.titleColor, (v) => updateMeta({ titleColor: v }))}
        {colorField('Heading Colour', meta.headingColor, (v) => updateMeta({ headingColor: v }))}
      </fieldset>

      {/* Live preview */}
      <div>
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="mt-2 rounded border overflow-hidden p-4"
          style={{ backgroundColor: meta.bgColor }}
        >
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${meta.columns}, 1fr)` }}
          >
            {Array.from({ length: meta.columns }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden"
                style={{
                  backgroundColor: meta.cardBgColor,
                  borderRadius: meta.cardBorderRadius,
                  border: '1px solid #e5e7eb',
                }}
              >
                <div className="bg-gray-200 h-16 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="p-2">
                  <div
                    className="text-xs font-semibold truncate"
                    style={{ color: meta.titleColor }}
                  >
                    Video title
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">Subtitle text</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
