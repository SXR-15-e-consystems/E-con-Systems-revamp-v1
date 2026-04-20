import type { NavMenuEntry, MenuType, MegaMenuTab, MenuColumn, DropdownChild, PromoBanner } from "../../types/navigation";
import { MENU_TYPE_LABELS } from "../../types/navigation";
import { MegaTabEditor } from "./MegaTabEditor";
import { MegaColumnEditor } from "./MegaColumnEditor";
import { DropdownEditor } from "./DropdownEditor";
import { PromoBannerEditor } from "./PromoBannerEditor";

interface Props {
  menu: NavMenuEntry;
  onChange: (updated: NavMenuEntry) => void;
}

export function MenuEditor({ menu, onChange }: Props) {
  const update = <K extends keyof NavMenuEntry>(key: K, val: NavMenuEntry[K]) => {
    onChange({ ...menu, [key]: val });
  };

  const menuTypes: MenuType[] = [
    "mega_tabbed",
    "mega_columns",
    "dropdown",
    "nested",
    "link",
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Menu Label
            </label>
            <input
              type="text"
              value={menu.label}
              onChange={(e) => update("label", e.target.value)}
              placeholder="Menu label"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Menu Type
            </label>
            <select
              value={menu.menu_type}
              onChange={(e) => update("menu_type", e.target.value as MenuType)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {menuTypes.map((t) => (
                <option key={t} value={t}>
                  {MENU_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3 pb-0.5">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={menu.visible}
                onChange={(e) => update("visible", e.target.checked)}
                className="rounded border-slate-300"
              />
              Visible
            </label>
          </div>
        </div>

        {/* URL + target (shown for link type, and as fallback href for others) */}
        {(menu.menu_type === "link" || menu.url) && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">URL</label>
              <input
                type="text"
                value={menu.url ?? ""}
                onChange={(e) => update("url", e.target.value || null)}
                placeholder="/page-slug or https://..."
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs text-slate-500 mb-1">Target</label>
              <select
                value={menu.target}
                onChange={(e) => update("target", e.target.value as "_self" | "_blank")}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="_self">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Type-specific editor */}
      <div className="flex-1 overflow-auto p-5">
        {menu.menu_type === "mega_tabbed" && (
          <MegaTabEditor
            tabs={menu.tabs}
            onChange={(tabs: MegaMenuTab[]) => update("tabs", tabs)}
            promoBanner={menu.promo_banner}
            onPromoBannerChange={(pb: PromoBanner | null) => update("promo_banner", pb)}
          />
        )}

        {menu.menu_type === "mega_columns" && (
          <MegaColumnEditor
            columns={menu.columns}
            onChange={(cols: MenuColumn[]) => update("columns", cols)}
            promoBanner={menu.promo_banner}
            onPromoBannerChange={(pb: PromoBanner | null) => update("promo_banner", pb)}
          />
        )}

        {(menu.menu_type === "dropdown" || menu.menu_type === "nested") && (
          <DropdownEditor
            children={menu.children}
            onChange={(kids: DropdownChild[]) => update("children", kids)}
            allowNesting={menu.menu_type === "nested"}
          />
        )}

        {menu.menu_type === "link" && (
          <div className="text-sm text-slate-500">
            This menu item links directly to the URL above. No sub-menu needed.
          </div>
        )}

        {/* Promo banner for mega menu types (shown inline in their editors) */}
      </div>
    </div>
  );
}
