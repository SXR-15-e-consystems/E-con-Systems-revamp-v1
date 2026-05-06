import type { NewsletterSubscribeData, NewsletterSubscribeMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — colours & sizing for NewsletterSubscribe
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

export function NewsletterSubscribeTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as NewsletterSubscribeData;
  const meta: NewsletterSubscribeMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<NewsletterSubscribeMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <h3 className="text-sm font-bold text-gray-700">Newsletter Subscribe — Layout</h3>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Strip</p>
        <div className="grid grid-cols-2 gap-3">
          <div>{label('Background')}{colorInput(meta.bgColor, (v) => updateMeta({ bgColor: v }))}</div>
          <div>{label('Max Width')}{textInput(meta.width, (v) => updateMeta({ width: v }), '100%')}</div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Heading</p>
        <div className="grid grid-cols-2 gap-3">
          <div>{label('Colour')}{colorInput(meta.headingColor, (v) => updateMeta({ headingColor: v }))}</div>
          <div>{label('Font Size')}{textInput(meta.headingFontSize, (v) => updateMeta({ headingFontSize: v }), '22px')}</div>
          <div>
            {label('Font Weight')}
            <select
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.headingFontWeight}
              onChange={(e) => updateMeta({ headingFontWeight: e.target.value })}
            >
              {['400', '500', '600', '700', '800'].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Input Field</p>
        <div className="grid grid-cols-2 gap-3">
          <div>{label('Background')}{colorInput(meta.inputBgColor, (v) => updateMeta({ inputBgColor: v }))}</div>
          <div>{label('Border')}{colorInput(meta.inputBorderColor, (v) => updateMeta({ inputBorderColor: v }))}</div>
          <div>{label('Text Colour')}{colorInput(meta.inputTextColor, (v) => updateMeta({ inputTextColor: v }))}</div>
          <div>{label('Placeholder')}{textInput(meta.placeholderText, (v) => updateMeta({ placeholderText: v }), 'Email id*')}</div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Subscribe Button</p>
        <div className="grid grid-cols-2 gap-3">
          <div>{label('BG Colour')}{colorInput(meta.buttonBgColor, (v) => updateMeta({ buttonBgColor: v }))}</div>
          <div>{label('Text Colour')}{colorInput(meta.buttonTextColor, (v) => updateMeta({ buttonTextColor: v }))}</div>
          <div>{label('Button Label')}{textInput(meta.buttonLabel, (v) => updateMeta({ buttonLabel: v }), 'SUBSCRIBE')}</div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Messages</p>
        <div className="space-y-2">
          <div>{label('Success message')}{textInput(meta.successMessage, (v) => updateMeta({ successMessage: v }))}</div>
          <div>{label('Error message')}{textInput(meta.errorMessage, (v) => updateMeta({ errorMessage: v }))}</div>
        </div>
      </section>
    </div>
  );
}
