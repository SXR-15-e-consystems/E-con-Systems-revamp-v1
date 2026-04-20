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
} from "../types/navigation";
import { createEmptyMenuEntry, createDefaultHeader } from "../types/navigation";
import { HeaderConfigPanel } from "../components/navigation/HeaderConfigPanel";
import { MenuList } from "../components/navigation/MenuList";
import { MenuEditor } from "../components/navigation/MenuEditor";

export function NavigationPage() {
  const queryClient = useQueryClient();
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [headerOpen, setHeaderOpen] = useState(false);

  // Local draft state
  const [localHeader, setLocalHeader] = useState<HeaderConfig | null>(null);
  const [localMenus, setLocalMenus] = useState<NavMenuEntry[] | null>(null);

  const { data: nav, isLoading, error } = useQuery<NavigationConfig>({
    queryKey: ["navigation"],
    queryFn: fetchNavigation,
    // Seed local state on first load
  });

  // Seed local state from server on first load
  const header = localHeader ?? nav?.header ?? createDefaultHeader();
  const menus = localMenus ?? nav?.menus ?? [];
  const isDirty = localHeader !== null || localMenus !== null;

  const selectedMenu = menus.find((m) => m.menu_id === selectedMenuId) ?? null;

  const saveMutation = useMutation({
    mutationFn: () =>
      updateNavigation({
        header: localHeader ?? undefined,
        menus: localMenus ?? undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["navigation"], updated);
      setLocalHeader(null);
      setLocalMenus(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishNavigation,
    onSuccess: (updated) => {
      queryClient.setQueryData(["navigation"], updated);
      setLocalHeader(null);
      setLocalMenus(null);
    },
  });

  const handleSave = useCallback(() => saveMutation.mutate(), [saveMutation]);
  const handlePublish = useCallback(async () => {
    // Save first, then publish
    if (isDirty) {
      await updateNavigation({
        header: localHeader ?? undefined,
        menus: localMenus ?? undefined,
      });
    }
    publishMutation.mutate();
  }, [isDirty, localHeader, localMenus, publishMutation]);

  const handleHeaderChange = useCallback((h: HeaderConfig) => {
    setLocalHeader(h);
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
      <div className="mb-6 flex items-center justify-between">
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
            <HeaderConfigPanel value={header} onChange={handleHeaderChange} />
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
            <MenuEditor menu={selectedMenu} onChange={handleMenuUpdate} />
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
