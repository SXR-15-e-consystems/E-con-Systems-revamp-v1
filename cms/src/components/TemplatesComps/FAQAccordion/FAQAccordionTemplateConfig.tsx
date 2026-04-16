import type { FAQAccordionData, FAQAccordionMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — style metadata only, no content
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: FAQAccordionMeta = {
  bgColor: '#ffffff',
  headingColor: '#1f2937',
  headingAlign: 'left',
  questionColor: '#1f2937',
  questionFontSize: '16px',
  answerColor: '#4b5563',
  answerFontSize: '14px',
  borderColor: '#e5e7eb',
  numbered: true,
  width: '100%',
};

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

export function FAQAccordionTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as FAQAccordionData;
  const meta: FAQAccordionMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<FAQAccordionMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Questions &amp; answers are
        filled during page creation.
      </p>

      {/* Layout */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <label>
          {label('Section Width')}
          {textInput(meta.width, (v) => updateMeta({ width: v }), '100%')}
        </label>
        {colorField('Background Colour', meta.bgColor, (v) => updateMeta({ bgColor: v }))}
        {colorField('Border Colour', meta.borderColor, (v) => updateMeta({ borderColor: v }))}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={meta.numbered}
            onChange={(e) => updateMeta({ numbered: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-xs font-semibold text-gray-600">Numbered items</span>
        </label>
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

      {/* Question style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Question Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Font Size')}
            {textInput(meta.questionFontSize, (v) => updateMeta({ questionFontSize: v }), '16px')}
          </label>
          {colorField('Colour', meta.questionColor, (v) => updateMeta({ questionColor: v }))}
        </div>
      </fieldset>

      {/* Answer style */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Answer Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Font Size')}
            {textInput(meta.answerFontSize, (v) => updateMeta({ answerFontSize: v }), '14px')}
          </label>
          {colorField('Colour', meta.answerColor, (v) => updateMeta({ answerColor: v }))}
        </div>
      </fieldset>

      {/* Live preview */}
      <div>
        <span className="text-xs text-gray-500">Preview:</span>
        <div
          className="mt-2 rounded border overflow-hidden"
          style={{ backgroundColor: meta.bgColor }}
        >
          <div className="p-4 space-y-0">
            <div className="text-sm font-bold mb-3" style={{ color: meta.questionColor }}>
              Frequently Asked Questions
            </div>
            {[
              { q: 'What resolution does the camera support?', a: 'Up to 20MP with the AR2020 sensor.' },
              { q: 'Is the camera compatible with Linux?', a: 'Yes, full Linux support is included.' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="py-2"
                style={{ borderTop: `1px solid ${meta.borderColor}` }}
              >
                <div
                  className="flex items-center gap-2 font-medium"
                  style={{ color: meta.questionColor, fontSize: '11px' }}
                >
                  {meta.numbered && (
                    <span className="text-gray-400 font-semibold">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                  )}
                  {item.q}
                </div>
                <div
                  className="mt-1 pl-6"
                  style={{ color: meta.answerColor, fontSize: '10px' }}
                >
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
