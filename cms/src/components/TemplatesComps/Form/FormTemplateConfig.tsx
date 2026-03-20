import type { FormData, FormMeta, FormType } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config — form type, keys, styling only
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: FormMeta = {
  formType: 'contact',
  recaptchaSiteKey: '',
  tcLink: '/terms',
  bgColor: '#ffffff',
  width: '600px',
  submitLabel: 'Submit',
};

const FORM_TYPES: { value: FormType; label: string }[] = [
  { value: 'contact', label: 'Contact Form' },
  { value: 'registration', label: 'Registration Form (with date/time)' },
  { value: 'get-quote', label: 'Get Quote Form (with quantity)' },
];

const SUBMIT_LABELS: Record<FormType, string> = {
  contact: 'Send Message',
  registration: 'Register Now',
  'get-quote': 'Get a Quote',
};

export function FormTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as FormData;
  const meta: FormMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<FormMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure form type &amp; keys only.
      </p>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Form Type</legend>
        <div className="space-y-2">
          {FORM_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="formType"
                value={value}
                checked={meta.formType === value}
                onChange={() =>
                  updateMeta({ formType: value, submitLabel: SUBMIT_LABELS[value] })
                }
                className="h-4 w-4"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        {/* Field preview */}
        <div className="mt-3 rounded bg-gray-50 px-3 py-2 border border-gray-100 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-600">Fields included:</p>
          <p>Name, Email, Company, Country, State, Requirement, reCAPTCHA v3, T&amp;C</p>
          {meta.formType === 'registration' && <p className="text-blue-600">+ Event Date &amp; Time</p>}
          {meta.formType === 'get-quote' && <p className="text-blue-600">+ Quantity selector (&lt;100 / &lt;500 / &lt;1000 / &gt;1000)</p>}
        </div>
      </fieldset>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Configuration</legend>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">reCAPTCHA v3 Site Key</span>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            value={meta.recaptchaSiteKey}
            onChange={(e) => updateMeta({ recaptchaSiteKey: e.target.value })}
            placeholder="6Le…"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Terms &amp; Conditions URL</span>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.tcLink}
            onChange={(e) => updateMeta({ tcLink: e.target.value })}
            placeholder="/terms"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Submit button label</span>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.submitLabel}
            onChange={(e) => updateMeta({ submitLabel: e.target.value })}
          />
        </label>
      </fieldset>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Form width</span>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.width}
            onChange={(e) => updateMeta({ width: e.target.value })}
            placeholder="600px or 100%"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Background colour</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.bgColor}
              onChange={(e) => updateMeta({ bgColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            <input
              className="flex-1 rounded border border-gray-300 px-2 py-2 text-xs"
              value={meta.bgColor}
              onChange={(e) => updateMeta({ bgColor: e.target.value })}
            />
          </div>
        </label>
      </fieldset>
    </div>
  );
}
