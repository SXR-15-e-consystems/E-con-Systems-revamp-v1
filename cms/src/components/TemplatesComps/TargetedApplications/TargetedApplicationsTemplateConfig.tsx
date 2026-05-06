import type {
  TargetedApplicationsData,
  TargetedApplicationsMeta,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config — layout & style only (no content)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: TargetedApplicationsMeta = {
  bgColor: '#f3f4f6',
  headingColor: '#111827',
  headingSize: '1.75rem',
  headingAlign: 'center',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  cardGap: '16px',
  titleColor: '#1f2937',
  titleSize: '0.9375rem',
  imageAspectRatio: '4/3',
  visibleCards: 4,
  sectionPadding: '40px 0',
};

const VISIBLE_OPTIONS: TargetedApplicationsMeta['visibleCards'][] = [2, 3, 4, 5];
const ALIGN_OPTIONS: { value: TargetedApplicationsMeta['headingAlign']; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];
const ASPECT_OPTIONS = [
  { value: '4/3', label: '4:3' },
  { value: '16/9', label: '16:9' },
  { value: '1/1', label: '1:1 Square' },
  { value: '3/2', label: '3:2' },
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

export function TargetedApplicationsTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as TargetedApplicationsData;
  const meta: TargetedApplicationsMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<TargetedApplicationsMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
        Template layer — set layout &amp; style. Heading, images &amp; titles are filled during page creation.
      </p>

      {/* Colours */}
      <fieldset className="rounded border border-gray-200 p-3 space-y-3">
        <legend className="px-1 text-xs font-bold text-gray-700">Colours</legend>
        <div className="grid grid-cols-2 gap-3">
          {colorField('Background', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
          {colorField('Heading', meta.headingColor, (v) => updateMeta({ headingColor: v }))}
          {colorField('Card Background', meta.cardBgColor, (v) => updateMeta({ cardBgColor: v }))}
          {colorField('Title', meta.titleColor, (v) => updateMeta({ titleColor: v }))}
        </div>
      </fieldset>

      {/* Typography */}
      <fieldset className="rounded border border-gray-200 p-3 space-y-3">
        <legend className="px-1 text-xs font-bold text-gray-700">Typography</legend>
        <div className="grid grid-cols-2 gap-3">
          {textField('Heading Size', meta.headingSize, (v) => updateMeta({ headingSize: v }), '1.75rem')}
          {textField('Title Size', meta.titleSize, (v) => updateMeta({ titleSize: v }), '0.9375rem')}
        </div>
        <div>
          {lbl('Heading Align')}
          <div className="flex gap-2">
            {ALIGN_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateMeta({ headingAlign: value })}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                  meta.headingAlign === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Layout */}
      <fieldset className="rounded border border-gray-200 p-3 space-y-3">
        <legend className="px-1 text-xs font-bold text-gray-700">Layout</legend>
        <div>
          {lbl('Cards Visible')}
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
          {textField('Card Border Radius', meta.cardBorderRadius, (v) => updateMeta({ cardBorderRadius: v }), '8px')}
          {textField('Card Gap', meta.cardGap, (v) => updateMeta({ cardGap: v }), '16px')}
          {textField('Section Padding', meta.sectionPadding, (v) => updateMeta({ sectionPadding: v }), '40px 0')}
        </div>
      </fieldset>
    </div>
  );
}
