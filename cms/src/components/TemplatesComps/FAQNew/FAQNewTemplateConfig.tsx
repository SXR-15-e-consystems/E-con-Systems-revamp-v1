import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import type { FAQNewMeta } from '../../../types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config — FAQNewTemplateConfig
// Controls all design tokens: colours, sizes, border-radius, padding.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: FAQNewMeta = {
  bgColor: '#f3f4f6',
  headingColor: '#111827',
  headingSize: '1.875rem',
  headingAlign: 'center',
  cardCollapsedBg: '#f3f4f6',
  cardExpandedBg: '#ffffff',
  cardBorderRadius: '12px',
  questionColor: '#111827',
  questionFontSize: '1rem',
  answerColor: '#4b5563',
  answerFontSize: '0.9375rem',
  linkColor: '#2563eb',
  btnBgColor: '#ffffff',
  btnIconColor: '#374151',
  sectionPadding: '60px 0',
};

export function FAQNewTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as { meta?: Partial<FAQNewMeta>; content?: unknown };
  const meta: FAQNewMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(updates: Partial<FAQNewMeta>) {
    onChange({ ...block.data, meta: { ...meta, ...updates } });
  }

  const row = 'flex flex-col gap-1';
  const lbl = 'text-xs text-slate-500 font-medium';
  const inp = 'rounded border border-slate-200 px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400';
  const colorRow = (label: string, key: keyof FAQNewMeta) => (
    <div className={row}>
      <label className={lbl}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={meta[key] as string}
          onChange={(e) => updateMeta({ [key]: e.target.value } as Partial<FAQNewMeta>)}
          className="h-8 w-10 rounded cursor-pointer border border-slate-200 p-0.5"
        />
        <input
          type="text"
          value={meta[key] as string}
          onChange={(e) => updateMeta({ [key]: e.target.value } as Partial<FAQNewMeta>)}
          className={inp}
          style={{ width: '120px', flex: 'none' }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
        FAQ (New) — Design
      </h3>

      {/* Section */}
      <fieldset className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3">
        <legend className="text-xs font-semibold text-slate-500 px-1">Section</legend>
        {colorRow('Background Colour', 'bgColor')}
        <div className={row}>
          <label className={lbl}>Section Padding</label>
          <input
            type="text"
            value={meta.sectionPadding}
            onChange={(e) => updateMeta({ sectionPadding: e.target.value })}
            className={inp}
            placeholder="60px 0"
          />
        </div>
      </fieldset>

      {/* Heading */}
      <fieldset className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3">
        <legend className="text-xs font-semibold text-slate-500 px-1">Heading</legend>
        {colorRow('Heading Colour', 'headingColor')}
        <div className={row}>
          <label className={lbl}>Font Size</label>
          <input
            type="text"
            value={meta.headingSize}
            onChange={(e) => updateMeta({ headingSize: e.target.value })}
            className={inp}
            placeholder="1.875rem"
          />
        </div>
        <div className={row}>
          <label className={lbl}>Alignment</label>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                onClick={() => updateMeta({ headingAlign: a })}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  meta.headingAlign === a
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Cards */}
      <fieldset className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3">
        <legend className="text-xs font-semibold text-slate-500 px-1">Cards</legend>
        {colorRow('Collapsed Card Background', 'cardCollapsedBg')}
        {colorRow('Expanded Card Background', 'cardExpandedBg')}
        <div className={row}>
          <label className={lbl}>Border Radius</label>
          <input
            type="text"
            value={meta.cardBorderRadius}
            onChange={(e) => updateMeta({ cardBorderRadius: e.target.value })}
            className={inp}
            placeholder="12px"
          />
        </div>
      </fieldset>

      {/* Question */}
      <fieldset className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3">
        <legend className="text-xs font-semibold text-slate-500 px-1">Question Text</legend>
        {colorRow('Question Colour', 'questionColor')}
        <div className={row}>
          <label className={lbl}>Font Size</label>
          <input
            type="text"
            value={meta.questionFontSize}
            onChange={(e) => updateMeta({ questionFontSize: e.target.value })}
            className={inp}
            placeholder="1rem"
          />
        </div>
      </fieldset>

      {/* Answer */}
      <fieldset className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3">
        <legend className="text-xs font-semibold text-slate-500 px-1">Answer Text</legend>
        {colorRow('Answer Colour', 'answerColor')}
        <div className={row}>
          <label className={lbl}>Font Size</label>
          <input
            type="text"
            value={meta.answerFontSize}
            onChange={(e) => updateMeta({ answerFontSize: e.target.value })}
            className={inp}
            placeholder="0.9375rem"
          />
        </div>
        {colorRow('Link Colour (in-answer + CTA)', 'linkColor')}
      </fieldset>

      {/* Toggle button */}
      <fieldset className="border border-slate-200 rounded-lg p-3 flex flex-col gap-3">
        <legend className="text-xs font-semibold text-slate-500 px-1">+/× Toggle Button</legend>
        {colorRow('Button Background', 'btnBgColor')}
        {colorRow('Icon Colour', 'btnIconColor')}
      </fieldset>
    </div>
  );
}
