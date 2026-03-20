import type { FormContent, FormData, FormMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills heading, messages, subheading
// The actual form fields are structural (determined by formType), not editable here
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: FormMeta = {
  formType: 'contact',
  recaptchaSiteKey: '',
  tcLink: '/terms',
  bgColor: '#ffffff',
  width: '600px',
  submitLabel: 'Submit',
};

const DEFAULT_CONTENT: FormContent = {
  heading: '',
  subheading: '',
  successMessage: 'Thank you! We will be in touch shortly.',
  errorMessage: 'Something went wrong. Please try again.',
};

export function FormBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as FormData;
  const meta: FormMeta = { ...DEFAULT_META, ...data.meta };
  const content: FormContent = { ...DEFAULT_CONTENT, ...data.content };

  function updateContent(patch: Partial<FormContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Form type:</strong> {meta.formType}</span>
        <span><strong>Width:</strong> {meta.width}</span>
        <span><strong>Submit label:</strong> {meta.submitLabel}</span>
      </div>

      <div className="border border-gray-200 rounded p-4 space-y-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Heading (optional)</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.heading ?? ''}
            placeholder="e.g. Contact Us"
            onChange={(e) => updateContent({ heading: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Subheading (optional)</span>
          <textarea
            className="rounded border border-gray-300 px-3 py-2 text-sm resize-none"
            rows={2}
            value={content.subheading ?? ''}
            placeholder="Optional supporting text below the heading"
            onChange={(e) => updateContent({ subheading: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Success message *</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.successMessage}
            onChange={(e) => updateContent({ successMessage: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Error message *</span>
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.errorMessage}
            onChange={(e) => updateContent({ errorMessage: e.target.value })}
          />
        </label>
      </div>

      {/* Structural field preview */}
      <div className="rounded bg-gray-50 border border-dashed border-gray-300 px-3 py-3 text-xs text-gray-500">
        <p className="font-semibold text-gray-600 mb-1">Included form fields (structural — not editable here):</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Name</li>
          <li>Email</li>
          <li>Company</li>
          <li>Country</li>
          <li>State</li>
          {meta.formType === 'registration' && <li className="text-blue-600">Event Date &amp; Time</li>}
          {meta.formType === 'get-quote' && <li className="text-blue-600">Quantity (&lt;100 / &lt;500 / &lt;1000 / &gt;1000)</li>}
          <li>Requirement</li>
          <li>reCAPTCHA v3</li>
          <li>Terms &amp; Conditions checkbox</li>
        </ul>
      </div>
    </div>
  );
}
