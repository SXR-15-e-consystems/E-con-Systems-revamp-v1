import type { TagData, TagMeta, TagLayout } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — layout & style metadata only, no content values
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: TagMeta = {
  layout: 'grid',
  bgColor: '#ffffff',
  tagBgColor: '#f1f5f9',
  tagTextColor: '#334155',
  tagBorderRadius: '9999px',
  showIcon: true,
  width: '100%',
};

const LAYOUT_OPTIONS: { value: TagLayout; label: string }[] = [
  { value: 'grid', label: 'Grid — tags wrap in rows' },
  { value: 'list', label: 'List — tags stack vertically' },
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

export function TagTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as TagData;
  const meta: TagMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<TagMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Tags are added during page creation.
      </p>

      {/* Layout */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <label>
          {label('Display Format')}
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.layout}
            onChange={(e) => updateMeta({ layout: e.target.value as TagLayout })}
          >
            {LAYOUT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label>
          {label('Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100% or 600px')}
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={meta.showIcon}
            onChange={(e) => updateMeta({ showIcon: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm">Show title icon</span>
        </label>
      </fieldset>

      {/* Colours */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Colours</legend>
        <label>
          {label('Section Background')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.bgColor}
              onChange={(e) => updateMeta({ bgColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.bgColor, (v) => updateMeta({ bgColor: v }))}
          </div>
        </label>
        <label>
          {label('Tag Pill Background')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.tagBgColor}
              onChange={(e) => updateMeta({ tagBgColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.tagBgColor, (v) => updateMeta({ tagBgColor: v }))}
          </div>
        </label>
        <label>
          {label('Tag Text Colour')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.tagTextColor}
              onChange={(e) => updateMeta({ tagTextColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.tagTextColor, (v) => updateMeta({ tagTextColor: v }))}
          </div>
        </label>
      </fieldset>

      {/* Tag Pill Style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Tag Style</legend>
        <label>
          {label('Border Radius')}
          {textInput(meta.tagBorderRadius, (v) => updateMeta({ tagBorderRadius: v }), '9999px or 8px')}
        </label>
      </fieldset>

      {/* Live preview */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Preview</legend>
        <div className="rounded p-3" style={{ backgroundColor: meta.bgColor }}>
          <div className={meta.layout === 'grid' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}>
            {['Sample Tag 1', 'Sample Tag 2', 'Sample Tag 3'].map((t) => (
              <span
                key={t}
                className="inline-block px-4 py-1.5 text-sm font-medium"
                style={{
                  backgroundColor: meta.tagBgColor,
                  color: meta.tagTextColor,
                  borderRadius: meta.tagBorderRadius,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
