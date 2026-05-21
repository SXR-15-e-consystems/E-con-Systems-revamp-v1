import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNavigation,
  updateNavigation,
  publishNavigation,
} from "../api/navigationEndpoints";
import type {
  NavigationConfig,
  NavMenuEntry,
  HeaderConfig,
  FooterConfig,
} from "../types/navigation";
import { createEmptyMenuEntry, createDefaultHeader, createDefaultFooter } from "../types/navigation";
import { HeaderConfigPanel } from "../components/navigation/HeaderConfigPanel";
import { FooterConfigPanel } from "../components/navigation/FooterConfigPanel";
import { MenuList } from "../components/navigation/MenuList";
import { MenuEditor } from "../components/navigation/MenuEditor";

const LOCALE_TABS = [
  { code: "en", label: "EN", name: "English" },
  { code: "jp", label: "JP", name: "Japanese" },
  { code: "ko", label: "KO", name: "Korean" },
  { code: "de", label: "DE", name: "German" },
] as const;
type LocaleCode = "en" | "jp" | "ko" | "de";

/** Build the flat translation keys from the current menu tree */
function buildTranslationKeys(menus: NavMenuEntry[]): { key: string; label: string; hint: string }[] {
  const keys: { key: string; label: string; hint: string }[] = [];
  for (const menu of menus) {
    keys.push({ key: `m_${menu.menu_id}`, label: `Menu: "${menu.label}"`, hint: "Top-level nav label" });
    if (menu.promo_banner?.enabled) {
      keys.push({ key: `pb_${menu.menu_id}_title`, label: `  Promo title`, hint: menu.promo_banner.title });
      keys.push({ key: `pb_${menu.menu_id}_desc`, label: `  Promo description`, hint: menu.promo_banner.description });
      keys.push({ key: `pb_${menu.menu_id}_cta`, label: `  Promo CTA label`, hint: menu.promo_banner.cta_label });
    }
    for (const tab of menu.tabs) {
      keys.push({ key: `t_${tab.tab_id}`, label: `  Tab: "${tab.label}"`, hint: "" });
      if (tab.bottom_section?.enabled) {
        keys.push({ key: `bs_${tab.tab_id}`, label: `    Bottom section title`, hint: tab.bottom_section.title });
      }
      for (const col of tab.columns) {
        keys.push({ key: `c_${col.col_id}`, label: `    Column: "${col.title || "(untitled)"}"`, hint: "" });
        col.items.forEach((item, idx) =>
          keys.push({ key: `ci_${col.col_id}_${idx}`, label: `      Item: "${item.label}"`, hint: item.url })
        );
      }
    }
    for (const col of menu.columns) {
      keys.push({ key: `c_${col.col_id}`, label: `  Column: "${col.title || "(untitled)"}"`, hint: "" });
      col.items.forEach((item, idx) =>
        keys.push({ key: `ci_${col.col_id}_${idx}`, label: `    Item: "${item.label}"`, hint: item.url })
      );
    }
    for (const child of menu.children) {
      keys.push({ key: `d_${child.item_id}`, label: `  Dropdown: "${child.label}"`, hint: child.url });
    }
  }
  return keys;
}

export function NavigationPage() {
  const queryClient = useQueryClient();
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [activeLocale, setActiveLocale] = useState<LocaleCode>("en");
  const [translationsOpen, setTranslationsOpen] = useState(false);
  // localeData: Record<locale, Record<flatKey, value>>
  const [localeData, setLocaleData] = useState<Record<string, Record<string, string>>>({    en: {}, jp: {}, ko: {}, de: {},
  });

  // Local draft state
  const [localHeader, setLocalHeader] = useState<HeaderConfig | null>(null);
  const [localMenus, setLocalMenus] = useState<NavMenuEntry[] | null>(null);
  const [localFooter, setLocalFooter] = useState<FooterConfig | null>(null);

  const { data: nav, isLoading, error } = useQuery<NavigationConfig>({
    queryKey: ["navigation"],
    queryFn: fetchNavigation,
    // Seed local state on first load
  });

  // Seed local state from server on first load; also hydrate localeData
  const header = localHeader ?? nav?.header ?? createDefaultHeader();
  const menus = localMenus ?? nav?.menus ?? [];
  const footer = localFooter ?? nav?.footer ?? createDefaultFooter();
  const isDirty = localHeader !== null || localMenus !== null || localFooter !== null;

  // Hydrate localeData from server on first load
  const [localeDataHydrated, setLocaleDataHydrated] = useState(false);
  if (nav && !localeDataHydrated) {
    setLocaleDataHydrated(true);
    setLocaleData({
      en: { ...(nav.locales?.en ?? {}) },
      jp: { ...(nav.locales?.jp ?? {}) },
      ko: { ...(nav.locales?.ko ?? {}) },
      de: { ...(nav.locales?.de ?? {}) },
    });
  }

  const selectedMenu = menus.find((m) => m.menu_id === selectedMenuId) ?? null;

  const saveMutation = useMutation({
    mutationFn: () =>
      updateNavigation({
        header: localHeader ?? undefined,
        menus: localMenus ?? undefined,
        footer: localFooter ?? undefined,
        locales: localeData,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["navigation"], updated);
      setLocalHeader(null);
      setLocalMenus(null);
      setLocalFooter(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishNavigation,
    onSuccess: (updated) => {
      queryClient.setQueryData(["navigation"], updated);
      setLocalHeader(null);
      setLocalMenus(null);
      setLocalFooter(null);
    },
  });

  const handleSave = useCallback(() => saveMutation.mutate(), [saveMutation]);
  const handlePublish = useCallback(async () => {
    // Save first, then publish
    if (isDirty) {
      await updateNavigation({
        header: localHeader ?? undefined,
        menus: localMenus ?? undefined,
        footer: localFooter ?? undefined,
        locales: localeData,
      });
    }
    publishMutation.mutate();
  }, [isDirty, localHeader, localMenus, localFooter, localeData, publishMutation]);

  const handleHeaderChange = useCallback((h: HeaderConfig) => {
    setLocalHeader(h);
  }, []);

  const handleFooterChange = useCallback((f: FooterConfig) => {
    setLocalFooter(f);
  }, []);

  const handleMenusChange = useCallback((updated: NavMenuEntry[]) => {
    setLocalMenus(updated);
  }, []);

  const handleAddMenu = useCallback(() => {
    const newEntry = createEmptyMenuEntry();
    newEntry.order = menus.length;
    const updated = [...menus, newEntry];
    setLocalMenus(updated);
    setSelectedMenuId(newEntry.menu_id);
  }, [menus]);

  const handleDeleteMenu = useCallback(
    (menuId: string) => {
      const updated = menus.filter((m) => m.menu_id !== menuId);
      setLocalMenus(updated);
      if (selectedMenuId === menuId) {
        setSelectedMenuId(updated.length > 0 ? updated[0].menu_id : null);
      }
    },
    [menus, selectedMenuId],
  );

  const handleMenuUpdate = useCallback(
    (updated: NavMenuEntry) => {
      const newMenus = menus.map((m) =>
        m.menu_id === updated.menu_id ? updated : m,
      );
      setLocalMenus(newMenus);
    },
    [menus],
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const arr = [...menus];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      // Re-index order
      const reordered = arr.map((m, i) => ({ ...m, order: i }));
      setLocalMenus(reordered);
    },
    [menus],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading navigation…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          Failed to load navigation config. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Navigation Menu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure the site header, menus, and mega menus.
            {nav?.status === "published" && !isDirty && (
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                Published
              </span>
            )}
            {isDirty && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Unsaved changes
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            {LOCALE_TABS.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => setActiveLocale(loc.code)}
                title={loc.name}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  activeLocale === loc.code
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm"
          >
            {saveMutation.isPending ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {publishMutation.isPending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {/* Translations panel — visible when non-EN locale is active */}
      {activeLocale !== "en" && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 shadow-sm overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-blue-100 text-left"
            onClick={() => setTranslationsOpen((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-800">
                🌐 {LOCALE_TABS.find(l => l.code === activeLocale)?.name} Translations
              </span>
              <span className="text-xs text-blue-600">Fields left blank fall back to English</span>
            </div>
            <span className="text-blue-400">{translationsOpen ? "▲" : "▼"}</span>
          </button>
          {translationsOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-blue-200 bg-white">
              {/* Header labels */}
              <div className="pt-4">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {([
                    { key: "h_phone", label: "Phone label", hint: header.phone.label },
                    { key: "h_contact", label: "Contact Us label", hint: header.contact_link.label },
                    { key: "h_cta", label: "CTA button label", hint: header.cta_button.label },
                  ] as const).map(({ key, label, hint }) => (
                    <label key={key} className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-600">{label}</span>
                      <input
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={localeData[activeLocale]?.[key] ?? ""}
                        onChange={(e) => setLocaleData(prev => ({
                          ...prev,
                          [activeLocale]: { ...prev[activeLocale], [key]: e.target.value },
                        }))}
                        placeholder={hint || `EN: ${key}`}
                      />
                    </label>
                  ))}
                </div>
              </div>
              {/* Menu labels — derived from current menu tree */}
              {buildTranslationKeys(menus).length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Menus &amp; Items</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {buildTranslationKeys(menus).map(({ key, label, hint }) => (
                      <label key={key} className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-500 font-medium whitespace-pre">{label}</span>
                        <input
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={localeData[activeLocale]?.[key] ?? ""}
                          onChange={(e) => setLocaleData(prev => ({
                            ...prev,
                            [activeLocale]: { ...prev[activeLocale], [key]: e.target.value },
                          }))}
                          placeholder={hint || "Leave blank for EN"}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-blue-600">
                Click <strong>Save Draft</strong> above to persist translations, then <strong>Publish</strong> to apply to all {LOCALE_TABS.find(l => l.code === activeLocale)?.name} visitors.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Header config toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setHeaderOpen(!headerOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-3 text-left shadow-sm hover:bg-slate-50"
        >
          <span className="text-sm font-semibold text-slate-800">
            Header Configuration
          </span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${headerOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {headerOpen && (
          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <HeaderConfigPanel
              value={header}
              onChange={handleHeaderChange}
              activeLocale={activeLocale}
              localeFlat={localeData[activeLocale] ?? {}}
              onLocaleChange={(key, val) =>
                setLocaleData(prev => ({
                  ...prev,
                  [activeLocale]: { ...prev[activeLocale], [key]: val },
                }))
              }
            />
          </div>
        )}
      </div>

      {/* Footer config toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setFooterOpen(!footerOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-3 text-left shadow-sm hover:bg-slate-50"
        >
          <span className="text-sm font-semibold text-slate-800">
            Footer Configuration
          </span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${footerOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {footerOpen && (
          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <FooterConfigPanel value={footer} onChange={handleFooterChange} />
          </div>
        )}
      </div>

      {/* Main content: menu list + editor */}
      <div className="flex gap-4" style={{ minHeight: "60vh" }}>
        {/* Left: menu list */}
        <div className="w-72 flex-shrink-0">
          <MenuList
            menus={menus}
            selectedId={selectedMenuId}
            onSelect={setSelectedMenuId}
            onAdd={handleAddMenu}
            onDelete={handleDeleteMenu}
            onReorder={handleReorder}
          />
        </div>

        {/* Right: editor */}
        <div className="flex-1 rounded-lg border border-slate-200 bg-white shadow-sm">
          {selectedMenu ? (
            <MenuEditor
              menu={selectedMenu}
              onChange={handleMenuUpdate}
              activeLocale={activeLocale}
              localeFlat={localeData[activeLocale] ?? {}}
              onLocaleChange={(key, val) =>
                setLocaleData(prev => ({
                  ...prev,
                  [activeLocale]: { ...prev[activeLocale], [key]: val },
                }))
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Select a menu item to edit, or add a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
