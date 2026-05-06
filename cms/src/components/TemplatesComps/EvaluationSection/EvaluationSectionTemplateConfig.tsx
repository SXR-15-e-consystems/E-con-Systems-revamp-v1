import type { EvaluationSectionData, EvaluationSectionMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — layout / colours for EvaluationSection
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: EvaluationSectionMeta = {
  bgColor: '#f3f4f6',
  headingColor: '#1f2937',
  nameColor: '#1f2937',
  badgeBgColor: '#16a34a',
  badgeTextColor: '#ffffff',
  cardBgColor: '#f3f4f6',
  cardWidth: '180px',
  cardGap: '24px',
  headingSize: '1.125rem',
  nameSize: '0.875rem',
  imageHeight: '128px',
  sectionPadding: '32px 0',
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

function colorInput(value: string, onChange: (v: string) => void) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border border-gray-300 p-0"
      />
      <input
        className="w-24 rounded border border-gray-300 px-2 py-1 text-xs font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
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

export function EvaluationSectionTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as EvaluationSectionData;
  const meta: EvaluationSectionMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<EvaluationSectionMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-bold text-gray-700">Evaluation Section — Layout</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>{label('Background')}{colorInput(meta.bgColor, (v) => updateMeta({ bgColor: v }))}</div>
        <div>{label('Card Background')}{colorInput(meta.cardBgColor, (v) => updateMeta({ cardBgColor: v }))}</div>
        <div>{label('Heading Colour')}{colorInput(meta.headingColor, (v) => updateMeta({ headingColor: v }))}</div>
        <div>{label('Name Colour')}{colorInput(meta.nameColor, (v) => updateMeta({ nameColor: v }))}</div>
        <div>{label('Badge BG')}{colorInput(meta.badgeBgColor, (v) => updateMeta({ badgeBgColor: v }))}</div>
        <div>{label('Badge Text')}{colorInput(meta.badgeTextColor, (v) => updateMeta({ badgeTextColor: v }))}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          {label('Card Width')}
          {textInput(meta.cardWidth, (v) => updateMeta({ cardWidth: v }), '180px')}
        </div>
        <div>
          {label('Card Gap')}
          {textInput(meta.cardGap, (v) => updateMeta({ cardGap: v }), '24px')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          {label('Heading Size (rem/px)')}
          {textInput(meta.headingSize, (v) => updateMeta({ headingSize: v }), '1.125rem')}
        </div>
        <div>
          {label('Name Size (rem/px)')}
          {textInput(meta.nameSize, (v) => updateMeta({ nameSize: v }), '0.875rem')}
        </div>
        <div>
          {label('Image Height (px)')}
          {textInput(meta.imageHeight, (v) => updateMeta({ imageHeight: v }), '128px')}
        </div>
        <div>
          {label('Section Padding (CSS)')}
          {textInput(meta.sectionPadding, (v) => updateMeta({ sectionPadding: v }), '32px 0')}
          <span className="text-[10px] text-gray-400">e.g. "32px 0" or "32px 48px"</span>
        </div>
      </div>
    </div>
  );
}
