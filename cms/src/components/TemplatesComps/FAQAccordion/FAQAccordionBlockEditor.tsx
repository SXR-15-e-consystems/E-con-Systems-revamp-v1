import type {
  FAQAccordionData,
  FAQAccordionMeta,
  FAQAccordionContent,
  FAQAccordionItem,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills heading, FAQ items, know-more link
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: FAQAccordionMeta = {
  bgColor: '#ffffff',
  questionColor: '#1f2937',
  questionFontSize: '16px',
  answerColor: '#4b5563',
  answerFontSize: '14px',
  borderColor: '#e5e7eb',
  numbered: true,
  width: '100%',
  headingColor: '#111827',
  headingAlign: 'left',
};

const DEFAULT_CONTENT: FAQAccordionContent = {
  heading: '',
  items: [],
  know_more_link: '',
  know_more_text: '',
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function FAQAccordionBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as FAQAccordionData;
  const meta: FAQAccordionMeta = { ...DEFAULT_META, ...data.meta };
  const content: FAQAccordionContent = { ...DEFAULT_CONTENT, ...data.content };

  function updateContent(patch: Partial<FAQAccordionContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  function updateItem(index: number, patch: Partial<FAQAccordionItem>) {
    const updated = content.items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    updateContent({ items: updated });
  }

  function addItem() {
    updateContent({ items: [...content.items, { question: '', answer: '' }] });
  }

  function removeItem(index: number) {
    updateContent({ items: content.items.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Numbered:</strong> {meta.numbered ? 'Yes' : 'No'}
        </span>
        <span>
          <strong>Question:</strong> {meta.questionFontSize}
        </span>
        <span>
          <strong>Answer:</strong> {meta.answerFontSize}
        </span>
        <span>
          <strong>BG:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.bgColor }}
          />
        </span>
      </div>

      {/* Heading */}
      <div className="border border-gray-200 rounded p-4 space-y-4">
        <label className="flex flex-col gap-1">
          {label('Section Heading *')}
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.heading}
            placeholder='e.g. "Frequently Asked Questions"'
            onChange={(e) => updateContent({ heading: e.target.value })}
          />
        </label>

        {/* FAQ Items */}
        <fieldset className="border border-gray-200 rounded p-3 space-y-3">
          <legend className="text-xs font-bold text-gray-700 px-1">
            FAQ Items ({content.items.length})
          </legend>

          {content.items.map((item, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded p-3 space-y-2 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
              <label className="flex flex-col gap-1">
                {label('Question')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.question}
                  placeholder="Enter question…"
                  onChange={(e) => updateItem(idx, { question: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('Answer (HTML)')}
                <textarea
                  className="rounded border border-gray-300 px-3 py-2 text-sm font-mono min-h-[80px]"
                  value={item.answer}
                  placeholder="<p>Answer text…</p>"
                  onChange={(e) => updateItem(idx, { answer: e.target.value })}
                />
                <span className="text-[10px] text-gray-400">
                  Supports HTML tags: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;, &lt;ul&gt;,
                  &lt;li&gt;, &lt;a&gt;
                </span>
              </label>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            + Add FAQ
          </button>
        </fieldset>

        {/* Know More */}
        <fieldset className="border border-gray-200 rounded p-3 space-y-3">
          <legend className="text-xs font-bold text-gray-700 px-1">Know More Link (optional)</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              {label('Link Text')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={content.know_more_text}
                placeholder='e.g. "Know more"'
                onChange={(e) => updateContent({ know_more_text: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1">
              {label('Link URL')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={content.know_more_link}
                placeholder="https://… or /faq"
                onChange={(e) => updateContent({ know_more_link: e.target.value })}
              />
            </label>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
