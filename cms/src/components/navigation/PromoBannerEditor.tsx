import type { PromoBanner } from "../../types/navigation";
import { createEmptyPromoBanner } from "../../types/navigation";

interface Props {
  value: PromoBanner | null;
  onChange: (pb: PromoBanner | null) => void;
}

export function PromoBannerEditor({ value, onChange }: Props) {
  const banner = value ?? createEmptyPromoBanner();

  return (
    <fieldset className="rounded-md border border-slate-200 p-4">
      <legend className="px-2 text-xs font-semibold text-slate-600">
        Promo Banner (Right Side)
      </legend>

      <label className="flex items-center gap-2 text-sm text-slate-600 mb-3">
        <input
          type="checkbox"
          checked={banner.enabled}
          onChange={(e) => {
            const updated = { ...banner, enabled: e.target.checked };
            onChange(updated.enabled || value ? updated : null);
          }}
          className="rounded border-slate-300"
        />
        Enable promo banner
      </label>

      {banner.enabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Image URL</label>
            <input
              type="text"
              value={banner.image_url ?? ""}
              onChange={(e) => onChange({ ...banner, image_url: e.target.value || null })}
              placeholder="https://example.com/promo.jpg"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <input
              type="text"
              value={banner.title}
              onChange={(e) => onChange({ ...banner, title: e.target.value })}
              placeholder="Promo title"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <textarea
              value={banner.description}
              onChange={(e) => onChange({ ...banner, description: e.target.value })}
              placeholder="Short promo description"
              rows={2}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">CTA Label</label>
              <input
                type="text"
                value={banner.cta_label}
                onChange={(e) => onChange({ ...banner, cta_label: e.target.value })}
                placeholder="Learn More"
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">CTA URL</label>
              <input
                type="text"
                value={banner.cta_url}
                onChange={(e) => onChange({ ...banner, cta_url: e.target.value })}
                placeholder="/page or https://..."
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">CTA Target</label>
              <select
                value={banner.cta_target}
                onChange={(e) => onChange({ ...banner, cta_target: e.target.value as "_self" | "_blank" })}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="_self">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}
