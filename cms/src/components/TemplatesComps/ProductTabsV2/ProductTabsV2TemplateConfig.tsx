import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import type { ProductTabsV2Data, ProductTabsV2Meta } from '../../../types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — colours & reCAPTCHA only, no tab content
// Used for the ProductTabsV2 block (horizontal top tab bar).
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ProductTabsV2Meta = {
  active_color: '#22c55e',
  tabBarBorderColor: '#e5e7eb',
  tabsBgColor: '#ffffff',
  contentBgColor: '#ffffff',
  recaptchaSiteKey: '',
  datasheet_cta: { enabled: true, label: 'Datasheet' },
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

function ColorRow({
  label: labelText,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label>
      {label(labelText)}
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-8 w-8 rounded border border-gray-300 cursor-pointer flex-shrink-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  );
}

export function ProductTabsV2TemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ProductTabsV2Data;
  const meta: ProductTabsV2Meta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<ProductTabsV2Meta>) {
    onChange({ ...data, meta: { ...meta, ...patch } } as unknown as Record<string, unknown>);
  }

  const dsCta = meta.datasheet_cta ?? { enabled: true, label: 'Datasheet' };

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure colours &amp; integrations only. Tab content is
        filled during page creation.
      </p>

      {/* ── Colours ─────────────────────────────────────────────── */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Colours</legend>
        <div className="grid grid-cols-2 gap-3">
          <ColorRow
            label="Active Tab Underline"
            value={meta.active_color}
            onChange={(v) => updateMeta({ active_color: v })}
          />
          <ColorRow
            label="Tab Bar Border"
            value={meta.tabBarBorderColor}
            onChange={(v) => updateMeta({ tabBarBorderColor: v })}
          />
          <ColorRow
            label="Tab Bar Background"
            value={meta.tabsBgColor}
            onChange={(v) => updateMeta({ tabsBgColor: v })}
          />
          <ColorRow
            label="Content Area Background"
            value={meta.contentBgColor}
            onChange={(v) => updateMeta({ contentBgColor: v })}
          />
        </div>
      </fieldset>

      {/* ── reCAPTCHA ───────────────────────────────────────────── */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Order Form (reCAPTCHA)</legend>
        <label>
          {label('reCAPTCHA v2 Site Key')}
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            value={meta.recaptchaSiteKey}
            onChange={(e) => updateMeta({ recaptchaSiteKey: e.target.value })}
            placeholder="6Lc…"
          />
        </label>
      </fieldset>

      {/* ── Datasheet CTA ───────────────────────────────────────── */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">
          Datasheet CTA (shown in Overview tab)
        </legend>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={dsCta.enabled}
            onChange={(e) =>
              updateMeta({ datasheet_cta: { ...dsCta, enabled: e.target.checked } })
            }
          />
          <span className="text-sm text-gray-700">Show Datasheet button</span>
        </label>
        {dsCta.enabled && (
          <label>
            {label('Button Label')}
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={dsCta.label}
              onChange={(e) =>
                updateMeta({ datasheet_cta: { ...dsCta, label: e.target.value } })
              }
            />
          </label>
        )}
      </fieldset>
    </div>
  );
}
