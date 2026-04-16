import type { DocumentDownloadData, DocumentDownloadMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style metadata only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: DocumentDownloadMeta = {
  bgColor: '#ffffff',
  headingColor: '#1f2937',
  headingAlign: 'left',
  headerColor: '#1f2937',
  linkColor: '#2563eb',
  checkboxColor: '#2563eb',
  columns: 2,
  width: '100%',
};

const COLUMN_OPTIONS: { value: DocumentDownloadMeta['columns']; label: string }[] = [
  { value: 1, label: '1 Column' },
  { value: 2, label: '2 Columns' },
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

export function DocumentDownloadTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as DocumentDownloadData;
  const meta: DocumentDownloadMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<DocumentDownloadMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Heading, products &amp; files are
        filled during page creation.
      </p>

      {/* Layout */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <label>
          {label('Columns')}
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
        {colorField('Background Colour', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
      </fieldset>

      {/* Colours */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Colours</legend>
        <div className="grid grid-cols-2 gap-3">
          {colorField('Header Colour', meta.headerColor, (v) => updateMeta({ headerColor: v }))}
          {colorField('Link Colour', meta.linkColor, (v) => updateMeta({ linkColor: v }))}
        </div>
        {colorField('Checkbox Colour', meta.checkboxColor, (v) => updateMeta({ checkboxColor: v }))}
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

      {/* Live preview */}
      <div>
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="mt-2 rounded border overflow-hidden"
          style={{ backgroundColor: meta.bgColor }}
        >
          <div className="p-4 space-y-3">
            <div
              className="font-bold text-sm"
              style={{ color: meta.headerColor }}
            >
              Downloads
            </div>
            <div className={`grid gap-4 ${meta.columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Sample category 1 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: meta.headerColor }}>
                  <span>📄</span> Datasheets
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span
                    className="inline-block w-3 h-3 rounded-sm border"
                    style={{ borderColor: meta.checkboxColor, backgroundColor: meta.checkboxColor }}
                  />
                  <span style={{ color: meta.linkColor }}>Product_Datasheet.pdf</span>
                </div>
              </div>
              {/* Sample category 2 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: meta.headerColor }}>
                  <span>📦</span> Drivers
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span
                    className="inline-block w-3 h-3 rounded-sm border"
                    style={{ borderColor: meta.checkboxColor, backgroundColor: meta.checkboxColor }}
                  />
                  <span style={{ color: meta.linkColor }}>Linux_Driver_v2.zip</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
