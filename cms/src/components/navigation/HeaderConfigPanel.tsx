import type { HeaderConfig, CountryFlag } from "../../types/navigation";

interface Props {
  value: HeaderConfig;
  onChange: (updated: HeaderConfig) => void;
}

export function HeaderConfigPanel({ value, onChange }: Props) {
  const update = <K extends keyof HeaderConfig>(key: K, val: HeaderConfig[K]) => {
    onChange({ ...value, [key]: val });
  };

  const addFlag = () => {
    const newFlag: CountryFlag = {
      code: "us",
      label: "United States",
      image_url: "https://flagcdn.com/w40/us.png",
      url: "",
      locale_prefix: "",
      is_default: value.country_flags.length === 0,
    };
    update("country_flags", [...value.country_flags, newFlag]);
  };

  const updateFlag = (index: number, flag: CountryFlag) => {
    const flags = [...value.country_flags];
    flags[index] = flag;
    update("country_flags", flags);
  };

  const removeFlag = (index: number) => {
    update("country_flags", value.country_flags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Logo URL</label>
        <input
          type="text"
          value={value.logo_url}
          onChange={(e) => update("logo_url", e.target.value)}
          placeholder="https://example.com/logo.svg"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {value.logo_url && (
          <div className="mt-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.logo_url}
              alt="Logo preview"
              className="h-10 max-w-[200px] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Phone */}
      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-2 text-xs font-semibold text-slate-600">Phone</legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Number</label>
            <input
              type="text"
              value={value.phone.number}
              onChange={(e) => update("phone", { ...value.phone, number: e.target.value })}
              placeholder="+1 408 766 7503"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Label</label>
            <input
              type="text"
              value={value.phone.label}
              onChange={(e) => update("phone", { ...value.phone, label: e.target.value })}
              placeholder="Optional display label"
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={value.phone.visible}
                onChange={(e) => update("phone", { ...value.phone, visible: e.target.checked })}
                className="rounded border-slate-300"
              />
              Visible
            </label>
          </div>
        </div>
      </fieldset>

      {/* Contact link */}
      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-2 text-xs font-semibold text-slate-600">Contact Link</legend>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Label</label>
            <input
              type="text"
              value={value.contact_link.label}
              onChange={(e) => update("contact_link", { ...value.contact_link, label: e.target.value })}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">URL</label>
            <input
              type="text"
              value={value.contact_link.url}
              onChange={(e) => update("contact_link", { ...value.contact_link, url: e.target.value })}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={value.contact_link.visible}
                onChange={(e) => update("contact_link", { ...value.contact_link, visible: e.target.checked })}
                className="rounded border-slate-300"
              />
              Visible
            </label>
          </div>
        </div>
      </fieldset>

      {/* CTA button */}
      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-2 text-xs font-semibold text-slate-600">CTA Button</legend>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Label</label>
            <input
              type="text"
              value={value.cta_button.label}
              onChange={(e) => update("cta_button", { ...value.cta_button, label: e.target.value })}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">URL</label>
            <input
              type="text"
              value={value.cta_button.url}
              onChange={(e) => update("cta_button", { ...value.cta_button, url: e.target.value })}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">BG Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value.cta_button.bg_color}
                onChange={(e) => update("cta_button", { ...value.cta_button, bg_color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border border-slate-300"
              />
              <input
                type="text"
                value={value.cta_button.bg_color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                    update("cta_button", { ...value.cta_button, bg_color: v });
                  }
                }}
                className="w-20 rounded border border-slate-300 px-2 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={value.cta_button.visible}
                onChange={(e) => update("cta_button", { ...value.cta_button, visible: e.target.checked })}
                className="rounded border-slate-300"
              />
              Visible
            </label>
          </div>
        </div>
      </fieldset>

      {/* Country flags */}
      <fieldset className="rounded-md border border-slate-200 p-4">
        <legend className="px-2 text-xs font-semibold text-slate-600">
          Country / Locale Flags
        </legend>
        <p className="mb-3 text-xs text-slate-400">
          The default flag shows on the header. Other flags appear in a dropdown.
          Locale prefix controls the URL: e.g. &quot;jp&quot; → /jp/page-slug, empty = default locale.
        </p>
        <div className="space-y-3">
          {value.country_flags.map((flag, i) => (
            <div
              key={`flag-${i}`}
              className={`rounded-md border p-3 ${flag.is_default ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <input
                    type="radio"
                    name="default-flag"
                    checked={flag.is_default}
                    onChange={() => {
                      const flags = value.country_flags.map((f, j) => ({
                        ...f,
                        is_default: j === i,
                      }));
                      update("country_flags", flags);
                    }}
                    className="border-slate-300"
                  />
                  Default
                </label>
                {flag.is_default && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                    ACTIVE
                  </span>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => removeFlag(i)}
                  className="flex-shrink-0 rounded p-1 text-red-500 hover:bg-red-50"
                  title="Remove flag"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Code</label>
                  <input
                    type="text"
                    value={flag.code}
                    onChange={(e) => updateFlag(i, { ...flag, code: e.target.value })}
                    placeholder="us"
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Label</label>
                  <input
                    type="text"
                    value={flag.label}
                    onChange={(e) => updateFlag(i, { ...flag, label: e.target.value })}
                    placeholder="United States"
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Flag Image URL</label>
                  <input
                    type="text"
                    value={flag.image_url}
                    onChange={(e) => updateFlag(i, { ...flag, image_url: e.target.value })}
                    placeholder="https://flagcdn.com/w40/us.png"
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Locale Prefix</label>
                  <input
                    type="text"
                    value={flag.locale_prefix}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 5);
                      updateFlag(i, { ...flag, locale_prefix: v });
                    }}
                    placeholder="jp, de, kr…"
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  {flag.image_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={flag.image_url}
                      alt={flag.label}
                      className="h-[22px] w-[30px] rounded-sm border border-slate-200 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFlag}
            className="rounded border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600"
          >
            + Add Country
          </button>
        </div>
      </fieldset>

      {/* Toggles */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={value.search_enabled}
            onChange={(e) => update("search_enabled", e.target.checked)}
            className="rounded border-slate-300"
          />
          Search bar
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={value.cart_enabled}
            onChange={(e) => update("cart_enabled", e.target.checked)}
            className="rounded border-slate-300"
          />
          Cart icon
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={value.account_enabled}
            onChange={(e) => update("account_enabled", e.target.checked)}
            className="rounded border-slate-300"
          />
          Account icon
        </label>
      </div>
    </div>
  );
}
