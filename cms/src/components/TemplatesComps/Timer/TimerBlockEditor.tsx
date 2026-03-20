import type { TimerContent, TimerData, TimerMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills timer content fields
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: TimerMeta = {
  layout: 'bar',
  position: 'bottom',
  visible: true,
  bgColor: '#1a1a1a',
  textColor: '#ffffff',
  width: '380px',
};

const DEFAULT_CONTENT: TimerContent = {
  image_url: '',
  title: '',
  description: '',
  cta_text: '',
  cta_link: '',
  expiry_iso: '',
};

function fi(
  labelText: string,
  value: string,
  onChange: (v: string) => void,
  type = 'text',
  placeholder?: string,
) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-600">{labelText}</span>
      <input
        type={type}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function TimerBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as TimerData;
  const meta: TimerMeta = { ...DEFAULT_META, ...data.meta };
  const content: TimerContent = { ...DEFAULT_CONTENT, ...data.content };

  function updateContent(patch: Partial<TimerContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Layout:</strong> {meta.layout}</span>
        <span><strong>Position:</strong> {meta.position}</span>
        <span><strong>Visible:</strong> {meta.visible ? 'yes' : 'no'}</span>
      </div>

      <div className="border border-gray-200 rounded p-4 space-y-3">
        {fi('Title *', content.title, (v) => updateContent({ title: v }), 'text', 'e.g. Offer ends soon!')}

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Description</span>
          <textarea
            className="rounded border border-gray-300 px-3 py-2 text-sm resize-none"
            rows={3}
            value={content.description ?? ''}
            placeholder="Optional supporting text"
            onChange={(e) => updateContent({ description: e.target.value })}
          />
        </label>

        {fi('Expiry Date & Time *', content.expiry_iso, (v) => updateContent({ expiry_iso: v }), 'datetime-local')}

        {content.expiry_iso && (
          <p className="text-xs text-gray-400">
            Stored as: <code className="bg-gray-100 px-1 rounded">{new Date(content.expiry_iso).toISOString()}</code>
          </p>
        )}

        {fi('Image URL (optional)', content.image_url ?? '', (v) => updateContent({ image_url: v }), 'text', 'https://…')}

        {content.image_url && (
          <img
            src={content.image_url}
            alt="timer"
            className="max-h-24 rounded border object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {fi('CTA Button Text', content.cta_text ?? '', (v) => updateContent({ cta_text: v }), 'text', 'Register Now')}
        {fi('CTA Button Link', content.cta_link ?? '', (v) => updateContent({ cta_link: v }), 'text', 'https://…')}
      </div>
    </div>
  );
}
