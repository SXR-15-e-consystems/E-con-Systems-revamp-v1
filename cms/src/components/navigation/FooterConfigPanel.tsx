import { useState } from "react";
import type {
  FooterConfig,
  FooterColumn,
  FooterLinkItem,
  FooterSocialLink,
  FooterBadge,
} from "../../types/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function newColumn(): FooterColumn {
  return { col_id: crypto.randomUUID(), title: "", items: [] };
}
function newLinkItem(): FooterLinkItem {
  return { label: "", url: "", target: "_self" };
}
function newSocialLink(): FooterSocialLink {
  return { platform: "twitter", url: "", label: "" };
}
function newBadge(): FooterBadge {
  return { badge_id: crypto.randomUUID(), image_url: "", alt_text: "", link_url: "" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-editors
// ─────────────────────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const smallBtnCls =
  "rounded px-3 py-1.5 text-xs font-semibold transition-colors ";

// ─── Column editor ───────────────────────────────────────────────────────────

interface ColEditorProps {
  col: FooterColumn;
  onChange: (updated: FooterColumn) => void;
  onDelete: () => void;
}

function ColumnEditor({ col, onChange, onDelete }: ColEditorProps) {
  const [open, setOpen] = useState(true);

  const updateItem = (idx: number, item: FooterLinkItem) => {
    const items = [...col.items];
    items[idx] = item;
    onChange({ ...col, items });
  };
  const addItem = () => onChange({ ...col, items: [...col.items, newLinkItem()] });
  const removeItem = (idx: number) =>
    onChange({ ...col, items: col.items.filter((_, i) => i !== idx) });
  const moveItem = (from: number, to: number) => {
    const items = [...col.items];
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    onChange({ ...col, items });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-t-lg border-b border-slate-200">
        <button
          type="button"
          className="flex-1 text-left text-sm font-semibold text-slate-800 hover:text-blue-600"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "▾" : "▸"} {col.title || "(untitled column)"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={smallBtnCls + "bg-red-50 text-red-600 hover:bg-red-100"}
          title="Delete column"
        >
          Delete
        </button>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          <FieldRow label="Column Title">
            <input
              className={inputCls}
              value={col.title}
              onChange={(e) => onChange({ ...col, title: e.target.value })}
              placeholder="e.g. Camera Products"
            />
          </FieldRow>

          {/* Link items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Links ({col.items.length})
              </span>
              <button
                type="button"
                onClick={addItem}
                className={smallBtnCls + "bg-blue-50 text-blue-700 hover:bg-blue-100"}
              >
                + Add Link
              </button>
            </div>
            <div className="space-y-2">
              {col.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
                >
                  <div className="flex flex-col gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => idx > 0 && moveItem(idx, idx - 1)}
                      disabled={idx === 0}
                      className="text-xs leading-tight disabled:opacity-30 hover:text-blue-500"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => idx < col.items.length - 1 && moveItem(idx, idx + 1)}
                      disabled={idx === col.items.length - 1}
                      className="text-xs leading-tight disabled:opacity-30 hover:text-blue-500"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <input
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    value={item.label}
                    onChange={(e) => updateItem(idx, { ...item, label: e.target.value })}
                    placeholder="Label"
                  />
                  <input
                    className="flex-[2] rounded border border-slate-300 px-2 py-1 text-sm font-mono focus:border-blue-500 focus:outline-none"
                    value={item.url}
                    onChange={(e) => updateItem(idx, { ...item, url: e.target.value })}
                    placeholder="/url-or-https://..."
                  />
                  <select
                    className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    value={item.target}
                    onChange={(e) =>
                      updateItem(idx, { ...item, target: e.target.value as "_self" | "_blank" })
                    }
                  >
                    <option value="_self">Self</option>
                    <option value="_blank">New tab</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-400 hover:text-red-600 text-sm font-bold px-1"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Social links editor ──────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = ["twitter", "linkedin", "youtube", "facebook", "instagram"];

function SocialLinksEditor({
  links,
  onChange,
}: {
  links: FooterSocialLink[];
  onChange: (v: FooterSocialLink[]) => void;
}) {
  const update = (idx: number, s: FooterSocialLink) => {
    const arr = [...links];
    arr[idx] = s;
    onChange(arr);
  };
  const remove = (idx: number) => onChange(links.filter((_, i) => i !== idx));
  const add = () => onChange([...links, newSocialLink()]);

  return (
    <div className="space-y-2">
      {links.map((s, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
        >
          <select
            className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            value={s.platform}
            onChange={(e) => update(idx, { ...s, platform: e.target.value })}
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
          <input
            className="flex-[2] rounded border border-slate-300 px-2 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none"
            value={s.url}
            onChange={(e) => update(idx, { ...s, url: e.target.value })}
            placeholder="https://twitter.com/..."
          />
          <input
            className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            value={s.label}
            onChange={(e) => update(idx, { ...s, label: e.target.value })}
            placeholder="Aria label"
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="text-red-400 hover:text-red-600 font-bold px-1"
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className={smallBtnCls + "bg-blue-50 text-blue-700 hover:bg-blue-100"}
      >
        + Add Social Link
      </button>
    </div>
  );
}

// ─── Badges editor ────────────────────────────────────────────────────────────

function BadgesEditor({
  badges,
  onChange,
}: {
  badges: FooterBadge[];
  onChange: (v: FooterBadge[]) => void;
}) {
  const update = (idx: number, b: FooterBadge) => {
    const arr = [...badges];
    arr[idx] = b;
    onChange(arr);
  };
  const remove = (idx: number) => onChange(badges.filter((_, i) => i !== idx));
  const add = () => onChange([...badges, newBadge()]);

  return (
    <div className="space-y-3">
      {badges.map((b, idx) => (
        <div
          key={b.badge_id}
          className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2"
        >
          <div className="flex items-start gap-3">
            {b.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.image_url}
                alt={b.alt_text}
                className="h-14 w-14 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className="text-xs text-slate-500 mb-0.5 block">Image URL</label>
                <input
                  className={inputCls}
                  value={b.image_url}
                  onChange={(e) => update(idx, { ...b, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-0.5 block">Alt Text</label>
                <input
                  className={inputCls}
                  value={b.alt_text}
                  onChange={(e) => update(idx, { ...b, alt_text: e.target.value })}
                  placeholder="ISO 9001:2015 Certified"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-0.5 block">Link URL (optional)</label>
                <input
                  className={inputCls}
                  value={b.link_url}
                  onChange={(e) => update(idx, { ...b, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="text-red-400 hover:text-red-600 font-bold text-lg leading-none"
              title="Remove badge"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className={smallBtnCls + "bg-blue-50 text-blue-700 hover:bg-blue-100"}
      >
        + Add Badge
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  value: FooterConfig;
  onChange: (updated: FooterConfig) => void;
}

type Section = "general" | "columns" | "social" | "badges" | "subscribe";

export function FooterConfigPanel({ value, onChange }: Props) {
  const [activeSection, setActiveSection] = useState<Section>("general");

  const update = <K extends keyof FooterConfig>(key: K, val: FooterConfig[K]) => {
    onChange({ ...value, [key]: val });
  };

  const sections: { id: Section; label: string }[] = [
    { id: "general", label: "General" },
    { id: "subscribe", label: "Subscribe Bar" },
    { id: "columns", label: `Link Columns (${value.columns.length})` },
    { id: "social", label: `Social Links (${value.social_links.length})` },
    { id: "badges", label: `Badges (${value.badges.length})` },
  ];

  const addColumn = () => update("columns", [...value.columns, newColumn()]);
  const updateColumn = (idx: number, col: FooterColumn) => {
    const cols = [...value.columns];
    cols[idx] = col;
    update("columns", cols);
  };
  const deleteColumn = (idx: number) =>
    update("columns", value.columns.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeSection === s.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {activeSection === "general" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldRow label="Logo URL">
                <input
                  className={inputCls}
                  value={value.logo_url}
                  onChange={(e) => update("logo_url", e.target.value)}
                  placeholder="https://example.com/logo.svg"
                />
              </FieldRow>
              {value.logo_url && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={value.logo_url}
                    alt="Logo preview"
                    className="h-12 max-w-[200px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <FieldRow label="Logo Alt Text">
              <input
                className={inputCls}
                value={value.logo_alt}
                onChange={(e) => update("logo_alt", e.target.value)}
                placeholder="e-con Systems"
              />
            </FieldRow>
            <FieldRow label="Logo Link URL">
              <input
                className={inputCls}
                value={value.logo_link}
                onChange={(e) => update("logo_link", e.target.value)}
                placeholder="/"
              />
            </FieldRow>
            <div className="col-span-2">
              <FieldRow label="Tagline">
                <input
                  className={inputCls}
                  value={value.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  placeholder="Think Vision. Think e-con."
                />
              </FieldRow>
            </div>
            <FieldRow label="Copyright Text">
              <input
                className={inputCls}
                value={value.copyright_text}
                onChange={(e) => update("copyright_text", e.target.value)}
                placeholder="Copyright © {year} e-con Systems®"
              />
              <span className="text-[11px] text-slate-400">Use {"{year}"} for dynamic year</span>
            </FieldRow>
            <FieldRow label="Top Border Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.border_color || "#006786"}
                  onChange={(e) => update("border_color", e.target.value)}
                  className="h-9 w-12 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  className={inputCls + " font-mono"}
                  value={value.border_color}
                  onChange={(e) => update("border_color", e.target.value)}
                  placeholder="#006786"
                />
              </div>
            </FieldRow>
            <FieldRow label="Sitemap Link URL">
              <input
                className={inputCls}
                value={value.sitemap_link}
                onChange={(e) => update("sitemap_link", e.target.value)}
                placeholder="/sitemap"
              />
            </FieldRow>
            <FieldRow label="Sitemap Link Label">
              <input
                className={inputCls}
                value={value.sitemap_label}
                onChange={(e) => update("sitemap_label", e.target.value)}
                placeholder="Site Map"
              />
            </FieldRow>
          </div>
        </div>
      )}

      {/* ── Subscribe Bar ── */}
      {activeSection === "subscribe" && (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <label className="text-sm font-semibold text-slate-700">Enable Subscribe Bar</label>
            <button
              type="button"
              role="switch"
              aria-checked={value.subscribe.enabled}
              onClick={() =>
                update("subscribe", {
                  ...value.subscribe,
                  enabled: !value.subscribe.enabled,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                value.subscribe.enabled ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  value.subscribe.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldRow label="Heading Text">
                <input
                  className={inputCls}
                  value={value.subscribe.heading}
                  onChange={(e) =>
                    update("subscribe", { ...value.subscribe, heading: e.target.value })
                  }
                  placeholder="Subscribe for latest updates"
                />
              </FieldRow>
            </div>
            <FieldRow label="Email Placeholder">
              <input
                className={inputCls}
                value={value.subscribe.placeholder}
                onChange={(e) =>
                  update("subscribe", { ...value.subscribe, placeholder: e.target.value })
                }
                placeholder="Email id*"
              />
            </FieldRow>
            <FieldRow label="Button Label">
              <input
                className={inputCls}
                value={value.subscribe.button_label}
                onChange={(e) =>
                  update("subscribe", { ...value.subscribe, button_label: e.target.value })
                }
                placeholder="SUBSCRIBE"
              />
            </FieldRow>
            <div className="col-span-2">
              <FieldRow label="Notification Email (receives copies)">
                <input
                  type="email"
                  className={inputCls}
                  value={value.subscribe.notification_email}
                  onChange={(e) =>
                    update("subscribe", {
                      ...value.subscribe,
                      notification_email: e.target.value,
                    })
                  }
                  placeholder="marketing@e-consystems.com"
                />
              </FieldRow>
            </div>
          </div>
        </div>
      )}

      {/* ── Link Columns ── */}
      {activeSection === "columns" && (
        <div className="space-y-3">
          {value.columns.map((col, idx) => (
            <ColumnEditor
              key={col.col_id}
              col={col}
              onChange={(updated) => updateColumn(idx, updated)}
              onDelete={() => deleteColumn(idx)}
            />
          ))}
          <button
            type="button"
            onClick={addColumn}
            className="w-full rounded-lg border-2 border-dashed border-blue-300 py-3 text-sm font-semibold text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            + Add Column
          </button>
        </div>
      )}

      {/* ── Social Links ── */}
      {activeSection === "social" && (
        <SocialLinksEditor
          links={value.social_links}
          onChange={(v) => update("social_links", v)}
        />
      )}

      {/* ── Badges ── */}
      {activeSection === "badges" && (
        <BadgesEditor
          badges={value.badges}
          onChange={(v) => update("badges", v)}
        />
      )}
    </div>
  );
}
