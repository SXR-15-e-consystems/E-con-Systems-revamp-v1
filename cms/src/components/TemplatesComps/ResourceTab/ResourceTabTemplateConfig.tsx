import type { ResourceTabData, ResourceTabMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config — visual style + tab count only (no content)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ResourceTabMeta = {
  bgColor: '#f3f4f6',
  sidebarBgColor: '#f3f4f6',
  tabActiveColor: '#16a34a',
  tabInactiveColor: '#111827',
  tabFontSize: '0.9375rem',
  cardBgColor: '#ffffff',
  cardBorderRadius: '12px',
  cardGap: '20px',
  titleColor: '#111827',
  titleSize: '0.9375rem',
  descColor: '#4b5563',
  descSize: '0.8125rem',
  ctaBgColor: '#16a34a',
  ctaTextColor: '#ffffff',
  ctaBorderRadius: '4px',
  ctaSize: '0.8125rem',
  imageAspectRatio: '4/3',
  visibleCards: 3,
  tabCount: 3,
  sectionPadding: '40px 0',
};

const TAB_COUNT_OPTIONS: ResourceTabMeta['tabCount'][] = [1, 2, 3, 4, 5];
const VISIBLE_OPTIONS: ResourceTabMeta['visibleCards'][] = [1, 2, 3, 4];
const ASPECT_OPTIONS = [
  { value: '4/3', label: '4:3' },
  { value: '1/1', label: '1:1' },
  { value: '3/2', label: '3:2' },
  { value: '16/9', label: '16:9' },
];

function lbl(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

function colorField(fieldLabel: string, value: string, onChange: (v: string) => void) {
  return (
    <label className="flex flex-col gap-1">
      {lbl(fieldLabel)}
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border" />
        <input className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-xs font-mono" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </label>
  );
}

function textField(fieldLabel: string, value: string, onChange: (v: string) => void, placeholder?: string) {
  return (
    <label className="flex flex-col gap-1">
      {lbl(fieldLabel)}
      <input className="w-full rounded border border-gray-300 px-3 py-2 text-sm" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function ResourceTabTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ResourceTabData;
  const meta: ResourceTabMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<ResourceTabMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
        Template layer — set visual style &amp; tab count. Tab names &amp; cards are filled during page creation.
      </p>

      {/* Tab count — most important setting */}
      <fieldset className="rounded border border-blue-200 bg-blue-50 p-3 space-y-2">
        <legend className="px-1 text-xs font-bold text-blue-700">Tab Count</legend>
        <p className="text-xs text-blue-600">How many tabs this component will have. Page editors will name each tab.</p>
        <div className="flex gap-2 mt-1">
          {TAB_COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => updateMeta({ tabCount: n })}
              className={`w-10 py-1.5 rounded text-sm font-bold border transition-colors ${
                meta.tabCount === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Colours */}
      <fieldset className="rounded border border-gray-200 p-3 space-y-3">
        <legend className="px-1 text-xs font-bold text-gray-700">Colours</legend>
        <div className="grid grid-cols-2 gap-3">
          {colorField('Section BG', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
          {colorField('Sidebar BG', meta.sidebarBgColor, (v) => updateMeta({ sidebarBgColor: v }))}
          {colorField('Active Tab', meta.tabActiveColor, (v) => updateMeta({ tabActiveColor: v }))}
          {colorField('Inactive Tab', meta.tabInactiveColor, (v) => updateMeta({ tabInactiveColor: v }))}
          {colorField('Card BG', meta.cardBgColor, (v) => updateMeta({ cardBgColor: v }))}
          {colorField('Title', meta.titleColor, (v) => updateMeta({ titleColor: v }))}
          {colorField('Description', meta.descColor, (v) => updateMeta({ descColor: v }))}
          {colorField('CTA BG', meta.ctaBgColor, (v) => updateMeta({ ctaBgColor: v }))}
          {colorField('CTA Text', meta.ctaTextColor, (v) => updateMeta({ ctaTextColor: v }))}
        </div>
      </fieldset>

      {/* Typography */}
      <fieldset className="rounded border border-gray-200 p-3 space-y-3">
        <legend className="px-1 text-xs font-bold text-gray-700">Typography</legend>
        <div className="grid grid-cols-2 gap-3">
          {textField('Tab Font Size', meta.tabFontSize, (v) => updateMeta({ tabFontSize: v }), '0.9375rem')}
          {textField('Title Size', meta.titleSize, (v) => updateMeta({ titleSize: v }), '0.9375rem')}
          {textField('Desc Size', meta.descSize, (v) => updateMeta({ descSize: v }), '0.8125rem')}
          {textField('CTA Size', meta.ctaSize, (v) => updateMeta({ ctaSize: v }), '0.8125rem')}
        </div>
      </fieldset>

      {/* Layout */}
      <fieldset className="rounded border border-gray-200 p-3 space-y-3">
        <legend className="px-1 text-xs font-bold text-gray-700">Layout</legend>
        <div>
          {lbl('Visible Cards')}
          <div className="flex gap-2">
            {VISIBLE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateMeta({ visibleCards: n })}
                className={`w-10 py-1 rounded text-xs font-medium border transition-colors ${
                  meta.visibleCards === n
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          {lbl('Image Aspect Ratio')}
          <div className="flex flex-wrap gap-2">
            {ASPECT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ imageAspectRatio: value })}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                  meta.imageAspectRatio === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {textField('Card Border Radius', meta.cardBorderRadius, (v) => updateMeta({ cardBorderRadius: v }), '12px')}
          {textField('Card Gap', meta.cardGap, (v) => updateMeta({ cardGap: v }), '20px')}
          {textField('CTA Border Radius', meta.ctaBorderRadius, (v) => updateMeta({ ctaBorderRadius: v }), '4px')}
          {textField('Section Padding', meta.sectionPadding, (v) => updateMeta({ sectionPadding: v }), '40px 0')}
        </div>
      </fieldset>
    </div>
  );
}
