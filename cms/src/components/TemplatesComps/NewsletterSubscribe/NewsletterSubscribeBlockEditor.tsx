import type {
  NewsletterSubscribeData,
  NewsletterSubscribeMeta,
  NewsletterSubscribeContent,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — heading & form action URL for NewsletterSubscribe
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: NewsletterSubscribeMeta = {
  bgColor: '#f0f4f8',
  headingColor: '#1f2937',
  headingFontSize: '22px',
  headingFontWeight: '700',
  inputBorderColor: '#d1d5db',
  inputBgColor: '#ffffff',
  inputTextColor: '#1f2937',
  buttonBgColor: '#1f2937',
  buttonTextColor: '#ffffff',
  buttonLabel: 'SUBSCRIBE',
  placeholderText: 'Email id*',
  successMessage: 'Thank you for subscribing!',
  errorMessage: 'Please enter a valid email address.',
  width: '100%',
};

const DEFAULT_CONTENT: NewsletterSubscribeContent = {
  heading: 'Subscribe for latest updates',
  form_action_url: '',
};

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

export function NewsletterSubscribeBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as NewsletterSubscribeData;
  const meta: NewsletterSubscribeMeta = { ...DEFAULT_META, ...data.meta };
  const content: NewsletterSubscribeContent = { ...DEFAULT_CONTENT, ...data.content };

  function updateContent(patch: Partial<NewsletterSubscribeContent>) {
    onChange({ ...data, meta, content: { ...content, ...patch } });
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-bold text-gray-700">Newsletter Subscribe — Content</h3>

      {/* Meta colour summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Strip BG:</strong> <span className="inline-block h-3 w-3 rounded-sm border align-middle" style={{ background: meta.bgColor }} /></span>
        <span><strong>Button:</strong> <span className="inline-block h-3 w-3 rounded-sm border align-middle" style={{ background: meta.buttonBgColor }} /></span>
        <span><strong>Label:</strong> {meta.buttonLabel}</span>
      </div>

      <div>
        {label('Heading Text')}
        {textInput(
          content.heading,
          (v) => updateContent({ heading: v }),
          'Subscribe for latest updates',
        )}
        <p className="mt-1 text-xs text-gray-400">
          Displayed prominently on the left side of the strip.
        </p>
      </div>

      <div>
        {label('Form Action URL (optional)')}
        {textInput(
          content.form_action_url ?? '',
          (v) => updateContent({ form_action_url: v }),
          'https://your-crm.example.com/subscribe',
        )}
        <p className="mt-1 text-xs text-gray-400">
          If blank, the form submission is handled by JavaScript (no page reload).
        </p>
      </div>

      {/* Preview strip */}
      <div
        className="mt-4 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: meta.bgColor }}
      >
        <span
          className="font-semibold flex-shrink-0"
          style={{
            color: meta.headingColor,
            fontSize: meta.headingFontSize,
            fontWeight: meta.headingFontWeight,
          }}
        >
          {content.heading || 'Subscribe for latest updates'}
        </span>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            readOnly
            value=""
            placeholder={meta.placeholderText}
            className="flex-1 min-w-0 rounded-l border px-3 py-2 text-sm pointer-events-none"
            style={{
              borderColor: meta.inputBorderColor,
              background: meta.inputBgColor,
              color: meta.inputTextColor,
            }}
          />
          <button
            type="button"
            className="rounded-r px-4 py-2 text-sm font-semibold pointer-events-none"
            style={{ background: meta.buttonBgColor, color: meta.buttonTextColor }}
          >
            {meta.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
