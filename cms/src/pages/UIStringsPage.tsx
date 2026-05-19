import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNavigation,
  updateNavigation,
  publishNavigation,
} from "../api/navigationEndpoints";
import type { NavigationConfig } from "../types/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// UI Strings page — manage site-wide static label translations
// Stored in navigation.locales under ui_* keys (no new backend endpoint needed)
// ─────────────────────────────────────────────────────────────────────────────

const LOCALE_TABS = [
  { code: "en", label: "EN", name: "English" },
  { code: "jp", label: "JP", name: "Japanese" },
  { code: "ko", label: "KO", name: "Korean" },
  { code: "de", label: "DE", name: "German" },
] as const;
type LocaleCode = "en" | "jp" | "ko" | "de";

const UI_STRING_GROUPS = [
  {
    title: "General",
    fields: [
      { key: "ui_sample_price", label: "Sample Price label", hint: "Sample Price" },
      { key: "ui_volume_price", label: "Volume Price label", hint: "Volume Price" },
      { key: "ui_no_tab_content", label: "Empty tab message", hint: "No content available for this tab." },
      { key: "ui_know_more", label: "Know More (blog CTA)", hint: "Know More" },
    ],
  },
  {
    title: "Document Download",
    fields: [
      { key: "ui_select_all", label: "Select All", hint: "Select All" },
      { key: "ui_deselect_all", label: "Deselect All", hint: "Deselect All" },
    ],
  },
  {
    title: "Variants Table",
    fields: [
      { key: "ui_no_variants", label: "No variants message", hint: "No variants available." },
      { key: "ui_actions", label: "Actions column header", hint: "Actions" },
    ],
  },
  {
    title: "Form",
    fields: [
      { key: "ui_required", label: "Required (validation)", hint: "Required" },
      { key: "ui_invalid_email", label: "Invalid email (validation)", hint: "Invalid email address" },
      { key: "ui_form_success", label: "Form success message", hint: "Thank you! We will be in touch shortly." },
      { key: "ui_form_error", label: "Form error message", hint: "Something went wrong. Please try again." },
    ],
  },
  {
    title: "Countdown Timer",
    fields: [
      { key: "ui_timer_days", label: "Days label", hint: "DD" },
      { key: "ui_timer_hours", label: "Hours label", hint: "HH" },
      { key: "ui_timer_minutes", label: "Minutes label", hint: "MM" },
      { key: "ui_timer_seconds", label: "Seconds label", hint: "SS" },
    ],
  },
] as const;

// All ui_* keys across all groups
const ALL_UI_KEYS = UI_STRING_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

/** Extract only ui_* keys from a flat locale record */
function extractUiKeys(flat: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(flat).filter(([k]) => k.startsWith("ui_"))
  );
}

export function UIStringsPage() {
  const queryClient = useQueryClient();
  const [activeLocale, setActiveLocale] = useState<LocaleCode>("en");

  // Local ui_* edits per locale: Record<locale, Record<ui_key, value>>
  const [uiData, setUiData] = useState<Record<string, Record<string, string>>>({
    en: {}, jp: {}, ko: {}, de: {},
  });
  const [uiDataHydrated, setUiDataHydrated] = useState(false);

  const { data: nav, isLoading, error } = useQuery<NavigationConfig>({
    queryKey: ["navigation"],
    queryFn: fetchNavigation,
  });

  // Hydrate only ui_* keys from server on first load
  if (nav && !uiDataHydrated) {
    setUiDataHydrated(true);
    setUiData({
      en: extractUiKeys(nav.locales?.en ?? {}),
      jp: extractUiKeys(nav.locales?.jp ?? {}),
      ko: extractUiKeys(nav.locales?.ko ?? {}),
      de: extractUiKeys(nav.locales?.de ?? {}),
    });
  }

  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => {
      // Merge ui_* edits back into the full locales (preserving nav keys like m_*, t_*, etc.)
      const mergedLocales: Record<string, Record<string, string>> = {};
      for (const lc of LOCALE_TABS.map((l) => l.code)) {
        const existing = nav?.locales?.[lc] ?? {};
        // Remove stale ui_* from existing, then merge fresh ui_* edits
        const withoutUi = Object.fromEntries(
          Object.entries(existing).filter(([k]) => !k.startsWith("ui_"))
        );
        mergedLocales[lc] = { ...withoutUi, ...uiData[lc] };
      }
      return updateNavigation({ locales: mergedLocales });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["navigation"], updated);
      setIsDirty(false);
      setSaveError(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: Error) => {
      setSaveError(err.message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishNavigation,
    onSuccess: (updated) => {
      queryClient.setQueryData(["navigation"], updated);
      setPublishError(null);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    },
    onError: (err: Error) => {
      setPublishError(err.message);
    },
  });

  function handleFieldChange(key: string, value: string) {
    setUiData((prev) => ({
      ...prev,
      [activeLocale]: { ...prev[activeLocale], [key]: value },
    }));
    setIsDirty(true);
  }

  // Count filled fields for this locale
  const filledCount = ALL_UI_KEYS.filter(
    (k) => (uiData[activeLocale]?.[k] ?? "").trim() !== ""
  ).length;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">
        Loading UI strings…
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-red-500">
        Failed to load: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">UI Strings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Translate site-wide labels that appear across all product pages.
            Leave a field blank to use the built-in English default.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-medium text-green-600">Draft saved ✓</span>
          )}
          {saveError && (
            <span className="text-xs font-medium text-red-600">{saveError}</span>
          )}
          <button
            type="button"
            disabled={!isDirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="rounded border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveMutation.isPending ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={isDirty || publishMutation.isPending}
            onClick={() => publishMutation.mutate()}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {publishMutation.isPending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {publishSuccess && (
        <div className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">
          Published successfully. Changes are now live for all visitors.
        </div>
      )}
      {publishError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          Publish failed: {publishError}
        </div>
      )}

      {/* Locale tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {LOCALE_TABS.map((tab) => {
          const localeFilled = ALL_UI_KEYS.filter(
            (k) => (uiData[tab.code]?.[k] ?? "").trim() !== ""
          ).length;
          return (
            <button
              key={tab.code}
              type="button"
              onClick={() => setActiveLocale(tab.code)}
              className={`flex items-center gap-1.5 rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors -mb-px ${
                activeLocale === tab.code
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.name}
              {localeFilled > 0 && (
                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                  {localeFilled}/{ALL_UI_KEYS.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status note */}
      <p className="mb-5 text-xs text-slate-400">
        {filledCount === 0
          ? `No ${LOCALE_TABS.find((l) => l.code === activeLocale)?.name} translations set — built-in English defaults will show on the site.`
          : `${filledCount} of ${ALL_UI_KEYS.length} labels translated into ${LOCALE_TABS.find((l) => l.code === activeLocale)?.name}.`}
      </p>

      {/* Field groups */}
      <div className="space-y-6">
        {UI_STRING_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700">{group.title}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              {group.fields.map(({ key, label, hint }) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600">{label}</span>
                  <input
                    type="text"
                    value={uiData[activeLocale]?.[key] ?? ""}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    placeholder={hint}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-slate-400">
        Changes are stored in the Navigation draft. Click <strong>Save Draft</strong> then{" "}
        <strong>Publish</strong> to make them live for visitors.
      </p>
    </div>
  );
}
