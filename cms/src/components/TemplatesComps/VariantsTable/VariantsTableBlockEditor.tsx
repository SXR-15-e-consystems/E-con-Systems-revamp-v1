import { useState, useEffect } from 'react';
import type {
  VariantsTableData,
  VariantsTableMeta,
  VariantsTableContent,
  VariantRow,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import { fetchPageSummaries, type PageSummary } from '../../../api/endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills heading and product rows
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: VariantsTableMeta = {
  bgColor: '#ffffff',
  headerBgColor: '#002B5B',
  headerTextColor: '#ffffff',
  rowBgColor: '#ffffff',
  rowAltBgColor: '#f8fafc',
  rowTextColor: '#1f2937',
  highlightRowColor: '#fef3c7',
  width: '100%',
  columns: [],
  actionButtons: [],
  headingColor: '#111827',
  headingAlign: 'left',
};

const DEFAULT_CONTENT: VariantsTableContent = {
  heading: '',
  rows: [],
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function VariantsTableBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as VariantsTableData;
  const meta: VariantsTableMeta = { ...DEFAULT_META, ...data.meta };
  const content: VariantsTableContent = { ...DEFAULT_CONTENT, ...data.content };

  const [summaries, setSummaries] = useState<PageSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');

  useEffect(() => {
    fetchPageSummaries().then(setSummaries).catch(() => {});
  }, []);

  function updateContent(patch: Partial<VariantsTableContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  function updateRow(index: number, patch: Partial<VariantRow>) {
    const updated = content.rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    updateContent({ rows: updated });
  }

  function addRow() {
    if (!selectedSlug) return;
    const newRow: VariantRow = {
      page_slug: selectedSlug,
      badge: '',
      highlighted: false,
      custom_fields: {},
    };
    updateContent({ rows: [...content.rows, newRow] });
    setSelectedSlug('');
  }

  function removeRow(index: number) {
    updateContent({ rows: content.rows.filter((_, i) => i !== index) });
  }

  function moveRow(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= content.rows.length) return;
    const updated = [...content.rows];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    updateContent({ rows: updated });
  }

  function updateCustomField(rowIndex: number, key: string, value: string) {
    const row = content.rows[rowIndex];
    const custom_fields = { ...row.custom_fields, [key]: value };
    updateRow(rowIndex, { custom_fields });
  }

  function removeCustomField(rowIndex: number, key: string) {
    const row = content.rows[rowIndex];
    const custom_fields = { ...row.custom_fields };
    delete custom_fields[key];
    updateRow(rowIndex, { custom_fields });
  }

  function addCustomField(rowIndex: number) {
    updateCustomField(rowIndex, '', '');
  }

  const usedSlugs = new Set(content.rows.map((r) => r.page_slug));
  const availableSummaries = summaries.filter((s) => !usedSlugs.has(s.slug));

  const visibleColumnCount = meta.columns.filter((c) => c.visible).length;

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Header:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.headerBgColor }}
          />
        </span>
        <span>
          <strong>Columns:</strong> {visibleColumnCount} visible
        </span>
        <span>
          <strong>Actions:</strong> {meta.actionButtons.length} button
          {meta.actionButtons.length !== 1 ? 's' : ''}
        </span>
        <span>
          <strong>Width:</strong> {meta.width}
        </span>
      </div>

      {/* Heading */}
      <div className="border border-gray-200 rounded p-4 space-y-4">
        <label className="flex flex-col gap-1">
          {label('Table Heading')}
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.heading}
            placeholder='e.g. "Explore All Camera Variants"'
            onChange={(e) => updateContent({ heading: e.target.value })}
          />
        </label>
      </div>

      {/* Add Product Row */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Product Rows</legend>

        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 flex-1">
            {label('Add Product Row')}
            <select
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              <option value="">— Select a page —</option>
              {availableSummaries.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title} ({s.slug})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={addRow}
            disabled={!selectedSlug}
            className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        {/* Row list */}
        <div className="space-y-3">
          {content.rows.map((row, i) => {
            const summary = summaries.find((s) => s.slug === row.page_slug);
            return (
              <div key={row.page_slug} className="bg-gray-50 rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveRow(i, -1)}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(i, 1)}
                      disabled={i === content.rows.length - 1}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs leading-none"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate block">
                      {summary?.title ?? row.page_slug}
                    </span>
                    <span className="text-[10px] text-gray-400">/{row.page_slug}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    {label('Badge')}
                    <input
                      className="rounded border border-gray-300 px-2 py-1 text-xs"
                      value={row.badge}
                      placeholder='e.g. "New", "Launching Soon"'
                      onChange={(e) => updateRow(i, { badge: e.target.value })}
                    />
                  </label>
                  <label className="flex items-center gap-2 self-end">
                    <input
                      type="checkbox"
                      checked={row.highlighted}
                      onChange={(e) => updateRow(i, { highlighted: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-600">Highlighted</span>
                  </label>
                </div>

                {/* Custom fields */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    Custom Fields
                  </span>
                  {Object.entries(row.custom_fields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-1">
                      <input
                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                        value={key}
                        placeholder="Key"
                        onChange={(e) => {
                          const newFields = { ...row.custom_fields };
                          delete newFields[key];
                          newFields[e.target.value] = value;
                          updateRow(i, { custom_fields: newFields });
                        }}
                      />
                      <input
                        className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                        value={value}
                        placeholder="Value"
                        onChange={(e) => updateCustomField(i, key, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField(i, key)}
                        className="text-red-400 hover:text-red-600 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addCustomField(i)}
                    className="text-[10px] text-blue-600 hover:text-blue-800"
                  >
                    + Add Field
                  </button>
                </div>
              </div>
            );
          })}
          {content.rows.length === 0 && (
            <p className="text-xs text-gray-400 italic py-2">
              No product rows added yet. Select a page above to add one.
            </p>
          )}
        </div>
      </fieldset>
    </div>
  );
}
