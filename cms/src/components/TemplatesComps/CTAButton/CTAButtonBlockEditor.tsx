import type { CTAButtonContent, CTAButtonData, CTAButtonMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills button label (the only content field)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: CTAButtonMeta = {
  formType: 'contact',
  width: 'auto',
  position: 'inline',
  style: {
    bgColor: '#e63329',
    textColor: '#ffffff',
    borderRadius: '4px',
    fontSize: '16px',
    padding: '12px 24px',
  },
};

const DEFAULT_CONTENT: CTAButtonContent = { label: '' };

export function CTAButtonBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as CTAButtonData;
  const meta: CTAButtonMeta = { ...DEFAULT_META, ...data.meta };
  const content: CTAButtonContent = { ...DEFAULT_CONTENT, ...data.content };

  function updateContent(patch: Partial<CTAButtonContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Opens:</strong> {meta.formType} form</span>
        <span><strong>Position:</strong> {meta.position}</span>
      </div>

      <div className="border border-gray-200 rounded p-4 space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Button Label *</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.label}
            placeholder='e.g. "Contact Us" or "Register Now"'
            onChange={(e) => updateContent({ label: e.target.value })}
          />
        </label>

        {/* Live preview */}
        <div>
          <span className="text-xs text-gray-500">Preview:</span>
          <div className="mt-2 p-4 bg-gray-100 rounded flex items-center justify-center">
            <button
              type="button"
              style={{
                backgroundColor: meta.style.bgColor,
                color: meta.style.textColor,
                borderRadius: meta.style.borderRadius,
                fontSize: meta.style.fontSize,
                padding: meta.style.padding,
              }}
              className="font-medium"
            >
              {content.label || 'Button Label'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
