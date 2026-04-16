import type {
  VariantsTableData,
  VariantsTableMeta,
  VariantColumn,
  VariantActionButton,
  VariantColumnKey,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style & column configuration only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_COLUMNS: VariantColumn[] = [
  { key: 'product_name', label: 'Product Name', visible: true, width: '200px' },
  { key: 'interface', label: 'Interface', visible: true, width: '120px' },
  { key: 'supported_platforms', label: 'Supported Platforms', visible: true, width: '180px' },
  { key: 'resolution', label: 'Resolution', visible: true, width: '120px' },
  { key: 'frame_rate', label: 'Frame Rate', visible: true, width: '100px' },
  { key: 'chroma', label: 'Chroma', visible: true, width: '80px' },
  { key: 'lens_option', label: 'Lens Option', visible: true, width: '120px' },
  { key: 'promotional_sample_price', label: 'Sample Price', visible: true, width: '120px' },
  { key: 'documents', label: 'Documents', visible: false, width: '120px' },
];

const DEFAULT_ACTIONS: VariantActionButton[] = [
  { type: 'buy_now', label: 'Buy Now', bgColor: '#e63329', textColor: '#ffffff' },
  { type: 'contact_us', label: 'Contact Us', bgColor: '#2952cc', textColor: '#ffffff' },
];

const DEFAULT_META: VariantsTableMeta = {
  bgColor: '#ffffff',
  headingColor: '#1f2937',
  headingAlign: 'left',
  headerBgColor: '#002B5B',
  headerTextColor: '#ffffff',
  rowBgColor: '#ffffff',
  rowAltBgColor: '#f8fafc',
  rowTextColor: '#1f2937',
  highlightRowColor: '#fef3c7',
  width: '100%',
  columns: DEFAULT_COLUMNS,
  actionButtons: DEFAULT_ACTIONS,
};

const ACTION_TYPES: { value: VariantActionButton['type']; label: string }[] = [
  { value: 'buy_now', label: 'Buy Now' },
  { value: 'pre_order', label: 'Pre-Order' },
  { value: 'contact_us', label: 'Contact Us' },
  { value: 'download', label: 'Download' },
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

export function VariantsTableTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as VariantsTableData;
  const meta: VariantsTableMeta = {
    ...DEFAULT_META,
    ...data.meta,
    columns: data.meta?.columns ?? DEFAULT_COLUMNS,
    actionButtons: data.meta?.actionButtons ?? DEFAULT_ACTIONS,
  };

  function updateMeta(patch: Partial<VariantsTableMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  function updateColumn(index: number, patch: Partial<VariantColumn>) {
    const updated = meta.columns.map((col, i) => (i === index ? { ...col, ...patch } : col));
    updateMeta({ columns: updated });
  }

  function updateAction(index: number, patch: Partial<VariantActionButton>) {
    const updated = meta.actionButtons.map((btn, i) =>
      i === index ? { ...btn, ...patch } : btn,
    );
    updateMeta({ actionButtons: updated });
  }

  function addAction() {
    updateMeta({
      actionButtons: [
        ...meta.actionButtons,
        { type: 'contact_us', label: 'Contact Us', bgColor: '#2952cc', textColor: '#ffffff' },
      ],
    });
  }

  function removeAction(index: number) {
    updateMeta({ actionButtons: meta.actionButtons.filter((_, i) => i !== index) });
  }

  const visibleColumns = meta.columns.filter((c) => c.visible);

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure table style, columns &amp; action buttons. Row data is filled
        during page creation.
      </p>

      {/* Colors */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Colors</legend>
        <div className="grid grid-cols-2 gap-3">
          {colorField('Background', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
          {colorField('Header BG', meta.headerBgColor, (v) => updateMeta({ headerBgColor: v }))}
          {colorField('Header Text', meta.headerTextColor, (v) =>
            updateMeta({ headerTextColor: v }),
          )}
          {colorField('Row BG', meta.rowBgColor, (v) => updateMeta({ rowBgColor: v }))}
          {colorField('Alt Row BG', meta.rowAltBgColor, (v) =>
            updateMeta({ rowAltBgColor: v }),
          )}
          {colorField('Row Text', meta.rowTextColor, (v) => updateMeta({ rowTextColor: v }))}
          {colorField('Highlight Row', meta.highlightRowColor, (v) =>
            updateMeta({ highlightRowColor: v }),
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

      {/* Width */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <label>
          {label('Table Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100%')}
        </label>
      </fieldset>

      {/* Column Configurator */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Columns</legend>
        <div className="space-y-2">
          {meta.columns.map((col, i) => (
            <div
              key={col.key}
              className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5"
            >
              <input
                type="checkbox"
                checked={col.visible}
                onChange={(e) => updateColumn(i, { visible: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                value={col.label}
                onChange={(e) => updateColumn(i, { label: e.target.value })}
                placeholder="Column label"
              />
              <input
                className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                value={col.width}
                onChange={(e) => updateColumn(i, { width: e.target.value })}
                placeholder="120px"
              />
              <span className="text-[10px] text-gray-400 w-24 truncate" title={col.key}>
                {col.key}
              </span>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Action Buttons Configurator */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Action Buttons</legend>
        <div className="space-y-3">
          {meta.actionButtons.map((btn, i) => (
            <div key={i} className="bg-gray-50 rounded p-2 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
                  value={btn.type}
                  onChange={(e) =>
                    updateAction(i, {
                      type: e.target.value as VariantActionButton['type'],
                    })
                  }
                >
                  {ACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                  value={btn.label}
                  onChange={(e) => updateAction(i, { label: e.target.value })}
                  placeholder="Button label"
                />
                <button
                  type="button"
                  onClick={() => removeAction(i)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {colorField('BG', btn.bgColor, (v) => updateAction(i, { bgColor: v }))}
                {colorField('Text', btn.textColor, (v) => updateAction(i, { textColor: v }))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addAction}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add Action Button
        </button>
      </fieldset>

      {/* Live preview */}
      <div>
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="mt-2 rounded border overflow-x-auto"
          style={{ backgroundColor: meta.bgColor }}
        >
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-2 py-1.5 text-left font-semibold"
                    style={{
                      backgroundColor: meta.headerBgColor,
                      color: meta.headerTextColor,
                      minWidth: col.width,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
                {meta.actionButtons.length > 0 && (
                  <th
                    className="px-2 py-1.5 text-left font-semibold"
                    style={{
                      backgroundColor: meta.headerBgColor,
                      color: meta.headerTextColor,
                    }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {[0, 1].map((rowIdx) => (
                <tr key={rowIdx}>
                  {visibleColumns.map((col) => (
                    <td
                      key={col.key}
                      className="px-2 py-1.5"
                      style={{
                        backgroundColor:
                          rowIdx % 2 === 0 ? meta.rowBgColor : meta.rowAltBgColor,
                        color: meta.rowTextColor,
                      }}
                    >
                      {col.label}
                    </td>
                  ))}
                  {meta.actionButtons.length > 0 && (
                    <td
                      className="px-2 py-1.5"
                      style={{
                        backgroundColor:
                          rowIdx % 2 === 0 ? meta.rowBgColor : meta.rowAltBgColor,
                      }}
                    >
                      <div className="flex gap-1">
                        {meta.actionButtons.map((btn, bi) => (
                          <span
                            key={bi}
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ backgroundColor: btn.bgColor, color: btn.textColor }}
                          >
                            {btn.label}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
