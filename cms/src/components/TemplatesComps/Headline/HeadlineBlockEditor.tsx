import type { HeadlineData, HeadlineMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills actual headline text
// meta{} is shown read-only for context; only content{} is editable here
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: HeadlineMeta = {
  tag: 'h2',
  fontFamily: 'Inter, sans-serif',
  fontSize: '28px',
  fontWeight: '700',
  textColor: '#1a1a2e',
  bgColor: 'transparent',
  align: 'left',
  width: '100%',
  letterSpacing: '0px',
  lineHeight: '1.3',
};

export function HeadlineBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as HeadlineData;
  const meta: HeadlineMeta = { ...DEFAULT_META, ...data.meta };
  const text: string = data.content?.text ?? '';

  function updateText(value: string) {
    onChange({ ...data, content: { text: value } });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Tag:</strong> &lt;{meta.tag}&gt;</span>
        <span><strong>Font:</strong> {meta.fontFamily.split(',')[0]}</span>
        <span><strong>Size:</strong> {meta.fontSize}</span>
        <span><strong>Weight:</strong> {meta.fontWeight}</span>
        <span><strong>Align:</strong> {meta.align}</span>
      </div>

      {/* Text input */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Headline Text *</span>
        <textarea
          className="rounded border border-gray-300 px-3 py-2 text-sm resize-none"
          rows={3}
          value={text}
          placeholder="Enter your headline text…"
          onChange={(e) => updateText(e.target.value)}
        />
      </label>

      {/* Live preview */}
      {text && (
        <div className="rounded border border-gray-200 bg-gray-50 p-3">
          <span className="text-xs font-semibold text-gray-500 mb-2 block">Live Preview</span>
          <div
            className="rounded p-4 overflow-hidden"
            style={{
              backgroundColor: meta.bgColor === 'transparent' ? '#fff' : meta.bgColor,
            }}
          >
            <span
              style={{
                fontFamily: meta.fontFamily,
                fontSize: meta.fontSize,
                fontWeight: Number(meta.fontWeight),
                color: meta.textColor,
                textAlign: meta.align,
                letterSpacing: meta.letterSpacing,
                lineHeight: meta.lineHeight,
                display: 'block',
              }}
            >
              {text}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
