'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { sanitizeUrl } from '@/lib/security';
import type {
  HeaderConfig,
  NavMenuEntry,
  CountryFlag,
  DropdownChild,
  MegaMenuTab,
  MenuColumn,
  PromoBanner,
  BottomSection,
} from '@/types/navigation';

const BLUE = '#1e4ea2';
const GREEN = '#059f46';

// ─── Icon components ─────────────────────────────────────────────────────────

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1l3 3 3-3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: BLUE }}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c1.21.34 2 .57 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: BLUE }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: BLUE }}>
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: BLUE }}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} width="6" height="10" viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1l4 4-4 4" />
    </svg>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PromoBannerCard({ banner }: { banner: PromoBanner }) {
  if (!banner.enabled) return null;
  return (
    <div className="flex w-[220px] flex-shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-50 p-4">
      {banner.image_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={sanitizeUrl(banner.image_url)}
          alt={banner.title}
          className="mb-3 h-[120px] w-full rounded object-cover"
        />
      )}
      {banner.title && <p className="mb-1 text-sm font-semibold text-slate-800">{banner.title}</p>}
      {banner.description && <p className="mb-3 text-xs text-slate-500 line-clamp-3">{banner.description}</p>}
      {banner.cta_label && banner.cta_url && (
        <Link
          href={sanitizeUrl(banner.cta_url)}
          target={banner.cta_target}
          rel={banner.cta_target === '_blank' ? 'noopener noreferrer' : undefined}
          className="mt-auto text-xs font-semibold hover:underline"
          style={{ color: BLUE }}
        >
          {banner.cta_label} &rarr;
        </Link>
      )}
    </div>
  );
}

function ColumnBlock({ column, variant }: { column: MenuColumn; variant?: 'tabbed' | 'columns' }) {
  const isMarkets = variant === 'columns';

  return (
    <div>
      {/* Column header: icon + title */}
      {column.title && (
        <div className={`flex items-center gap-2 ${isMarkets ? 'mb-3' : 'mb-2.5'}`}>
          {column.icon_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={sanitizeUrl(column.icon_url)}
              alt=""
              className={isMarkets ? 'h-10 w-10' : 'h-5 w-5'}
            />
          )}
          <Link
            href={sanitizeUrl(column.items[0]?.url ?? '#')}
            className={`font-semibold transition-colors hover:text-blue-700 ${
              isMarkets
                ? 'text-sm text-slate-800'
                : 'text-[13px] text-slate-800'
            }`}
          >
            {column.title}
          </Link>
          {!isMarkets && (
            <ChevronRight className="text-slate-400" />
          )}
        </div>
      )}

      {/* Items list */}
      <ul className={isMarkets ? 'space-y-2' : 'space-y-0'}>
        {column.items.map((item, i) => (
          <li key={i}>
            <Link
              href={sanitizeUrl(item.url)}
              target={item.target}
              rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
              className={`flex items-center gap-2 transition-colors hover:text-blue-700 ${
                isMarkets
                  ? 'py-0.5 text-[13px] text-slate-700'
                  : 'border-l-2 border-slate-200 py-1.5 pl-3 text-[13px] text-slate-600'
              }`}
            >
              {isMarkets && (
                <ChevronRight className="flex-shrink-0 text-slate-400" />
              )}
              {item.icon_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={sanitizeUrl(item.icon_url)} alt="" className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BottomSectionBlock({ section }: { section: BottomSection }) {
  if (!section.enabled || section.items.length === 0) return null;
  return (
    <div className="border-t border-slate-200 pt-3 mt-3">
      {section.title && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{section.title}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {section.items.map((item, i) => (
          <Link
            key={i}
            href={sanitizeUrl(item.url)}
            target={item.target}
            rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
            className="text-xs text-slate-600 transition-colors hover:text-blue-700"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Mega Tabbed Menu ────────────────────────────────────────────────────────
// Reference: Menu-camera-product.png
// Horizontal tab bar at top, active tab = bold + blue bottom border
// Content: 4-col grid, column titles with icon + ">", items with left border

function MegaTabbedPanel({ menu }: { menu: NavMenuEntry }) {
  const sortedTabs = [...menu.tabs].sort((a, b) => a.order - b.order);
  const defaultTab = sortedTabs.find((t) => t.is_default) ?? sortedTabs[0];
  const [activeTabId, setActiveTabId] = useState<string>(defaultTab?.tab_id ?? '');

  const activeTab = sortedTabs.find((t) => t.tab_id === activeTabId);

  return (
    <div className="flex flex-col">
      {/* Horizontal tab bar */}
      <div className="flex border-b border-slate-200">
        {sortedTabs.map((tab) => {
          const isActive = tab.tab_id === activeTabId;
          return (
            <button
              key={tab.tab_id}
              type="button"
              onMouseEnter={() => setActiveTabId(tab.tab_id)}
              onClick={() => setActiveTabId(tab.tab_id)}
              className={`relative px-5 py-3 text-[14px] transition-colors ${
                isActive
                  ? 'font-semibold text-slate-900'
                  : 'font-normal text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-5 right-5 h-[3px] rounded-t"
                  style={{ backgroundColor: BLUE }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-6 pb-8">
        {activeTab && (
          <>
            <div
              className="grid gap-x-8 gap-y-8"
              style={{
                gridTemplateColumns: `repeat(${Math.min(activeTab.columns.length, 4)}, 1fr)`,
              }}
            >
              {activeTab.columns.map((col) => (
                <ColumnBlock key={col.col_id} column={col} variant="tabbed" />
              ))}
            </div>
            {activeTab.bottom_section && (
              <BottomSectionBlock section={activeTab.bottom_section} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Mega Columns Menu ───────────────────────────────────────────────────────
// Reference: menu-markets.png
// 4 equal columns with large icon, bold title, items with ">" prefix
// Green bottom border

function MegaColumnsPanel({ menu }: { menu: NavMenuEntry }) {
  return (
    <div className="flex flex-col">
      <div
        className="grid gap-x-6 p-6 pb-8"
        style={{
          gridTemplateColumns: `repeat(${Math.min(menu.columns.length, 4)}, 1fr)`,
        }}
      >
        {menu.columns.map((col) => (
          <div key={col.col_id} className="border-l border-slate-200 pl-5 first:border-l-0 first:pl-0">
            <ColumnBlock column={col} variant="columns" />
          </div>
        ))}
      </div>

      {/* Green bottom border */}
      <div className="h-[3px] w-full" style={{ backgroundColor: GREEN }} />
    </div>
  );
}

// ─── Dropdown / Nested Menu ──────────────────────────────────────────────────

function DropdownItem({ child }: { child: DropdownChild }) {
  const hasChildren = child.children.length > 0;
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = () => {
    clearTimeout(timerRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <li
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href={sanitizeUrl(child.url)}
        target={child.target}
        rel={child.target === '_blank' ? 'noopener noreferrer' : undefined}
        className="flex items-center justify-between gap-2 px-4 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700"
      >
        <span className="flex items-center gap-2">
          {child.icon_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={sanitizeUrl(child.icon_url)} alt="" className="h-4 w-4" />
          )}
          {child.label}
        </span>
        {hasChildren && <ChevronRight className="text-slate-400" />}
      </Link>

      {hasChildren && open && (
        <ul className="absolute left-full top-0 z-50 min-w-[200px] rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {child.children.map((sub) => (
            <DropdownItem key={sub.item_id} child={sub} />
          ))}
        </ul>
      )}
    </li>
  );
}

function DropdownPanel({ menu }: { menu: NavMenuEntry }) {
  return (
    <ul className="py-1">
      {menu.children.map((child) => (
        <DropdownItem key={child.item_id} child={child} />
      ))}
    </ul>
  );
}

// ─── Nav item wrapper (hover trigger) ────────────────────────────────────────

function NavItemDesktop({ menu }: { menu: NavMenuEntry }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [megaLeft, setMegaLeft] = useState<number>(0);
  const isLink = menu.menu_type === 'link';
  const hasMega = menu.menu_type === 'mega_tabbed' || menu.menu_type === 'mega_columns';
  const hasDrop = menu.menu_type === 'dropdown' || menu.menu_type === 'nested';

  const PANEL_WIDTH = 980;
  const VIEWPORT_PAD = 16;

  const handleEnter = () => {
    clearTimeout(timerRef.current);
    if (!isLink) {
      // Calculate safe left offset so the panel stays within the viewport
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const triggerCenter = rect.left + rect.width / 2;
        let idealLeft = triggerCenter - PANEL_WIDTH / 2;
        // Clamp: don't overflow left
        if (idealLeft < VIEWPORT_PAD) idealLeft = VIEWPORT_PAD;
        // Clamp: don't overflow right
        const maxLeft = window.innerWidth - PANEL_WIDTH - VIEWPORT_PAD;
        if (idealLeft > maxLeft) idealLeft = Math.max(VIEWPORT_PAD, maxLeft);
        // Convert to offset relative to the trigger element
        setMegaLeft(idealLeft - rect.left);
      }
      setOpen(true);
    }
  };
  const handleLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 200);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div ref={triggerRef} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {isLink && menu.url ? (
        <Link
          href={sanitizeUrl(menu.url)}
          target={menu.target}
          rel={menu.target === '_blank' ? 'noopener noreferrer' : undefined}
          className="flex items-center gap-1 px-3 py-2 text-[13px] font-medium text-gray-800 transition-colors hover:text-blue-700"
        >
          {menu.label}
        </Link>
      ) : (
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-2 text-[13px] font-medium text-gray-800 transition-colors hover:text-blue-700"
          onClick={() => setOpen((o) => !o)}
        >
          {menu.label}
          <ChevronDown className="text-gray-500" />
        </button>
      )}

      {open && hasMega && (
        <div
          className="absolute top-full z-50 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
          style={{ width: `${PANEL_WIDTH}px`, maxWidth: '90vw', left: `${megaLeft}px` }}
        >
          {menu.menu_type === 'mega_tabbed' ? (
            <MegaTabbedPanel menu={menu} />
          ) : (
            <MegaColumnsPanel menu={menu} />
          )}
        </div>
      )}

      {open && hasDrop && (
        <div className="absolute left-0 top-full z-50 min-w-[220px] rounded-md border border-slate-200 bg-white py-0 shadow-lg">
          <DropdownPanel menu={menu} />
        </div>
      )}
    </div>
  );
}

// ─── Mobile accordion ────────────────────────────────────────────────────────

function MobileMenuColumn({ column }: { column: MenuColumn }) {
  return (
    <div className="pl-4 pb-2">
      {column.title && (
        <p className="mb-1 text-[12px] font-semibold text-slate-700">{column.title}</p>
      )}
      <ul className="space-y-1">
        {column.items.map((item, i) => (
          <li key={i}>
            <Link
              href={sanitizeUrl(item.url)}
              target={item.target}
              rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
              className="block py-1 text-xs text-slate-600 hover:text-blue-700"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileTabContent({ tab }: { tab: MegaMenuTab }) {
  return (
    <div className="space-y-2">
      {tab.columns.map((col) => (
        <MobileMenuColumn key={col.col_id} column={col} />
      ))}
    </div>
  );
}

function MobileDropdownChildren({ children, depth }: { children: DropdownChild[]; depth: number }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <ul className={depth > 0 ? 'pl-4' : ''}>
      {children.map((child) => {
        const hasKids = child.children.length > 0;
        const isOpen = openId === child.item_id;
        return (
          <li key={child.item_id}>
            <div className="flex items-center gap-1">
              <Link
                href={sanitizeUrl(child.url)}
                target={child.target}
                rel={child.target === '_blank' ? 'noopener noreferrer' : undefined}
                className="flex-1 py-2 text-[13px] text-slate-700 hover:text-blue-700"
              >
                {child.label}
              </Link>
              {hasKids && (
                <button
                  type="button"
                  className="p-1"
                  onClick={() => setOpenId(isOpen ? null : child.item_id)}
                  aria-label={isOpen ? 'Collapse' : 'Expand'}
                >
                  <ChevronDown className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            {hasKids && isOpen && (
              <MobileDropdownChildren children={child.children} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MobileMenuItem({ menu, onClose }: { menu: NavMenuEntry; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isLink = menu.menu_type === 'link';
  const sortedTabs = [...menu.tabs].sort((a, b) => a.order - b.order);
  const [activeTabId, setActiveTabId] = useState<string>(
    (sortedTabs.find((t) => t.is_default) ?? sortedTabs[0])?.tab_id ?? '',
  );

  if (isLink && menu.url) {
    return (
      <Link
        href={sanitizeUrl(menu.url)}
        target={menu.target}
        rel={menu.target === '_blank' ? 'noopener noreferrer' : undefined}
        className="block border-b border-slate-100 px-4 py-3 text-[14px] font-medium text-slate-800 hover:bg-slate-50"
        onClick={onClose}
      >
        {menu.label}
      </Link>
    );
  }

  return (
    <div className="border-b border-slate-100">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-medium text-slate-800 hover:bg-slate-50"
        onClick={() => setExpanded((e) => !e)}
      >
        {menu.label}
        <ChevronDown className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-3">
          {menu.menu_type === 'mega_tabbed' && sortedTabs.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {sortedTabs.map((tab) => (
                  <button
                    key={tab.tab_id}
                    type="button"
                    onClick={() => setActiveTabId(tab.tab_id)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                      tab.tab_id === activeTabId
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {(() => {
                const tab = sortedTabs.find((t) => t.tab_id === activeTabId);
                return tab ? <MobileTabContent tab={tab} /> : null;
              })()}
            </>
          )}

          {menu.menu_type === 'mega_columns' &&
            menu.columns.map((col) => (
              <MobileMenuColumn key={col.col_id} column={col} />
            ))}

          {(menu.menu_type === 'dropdown' || menu.menu_type === 'nested') &&
            menu.children.length > 0 && (
              <MobileDropdownChildren children={menu.children} depth={0} />
            )}
        </div>
      )}
    </div>
  );
}

// ─── Flag locale dropdown ────────────────────────────────────────────────────

function getActiveLocale(pathname: string, flags: CountryFlag[]): string {
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? '';
  const match = flags.find((f) => f.locale_prefix && f.locale_prefix === firstSegment);
  return match ? match.locale_prefix : '';
}

function buildLocalePath(pathname: string, currentLocale: string, targetLocale: string): string {
  let stripped = pathname;
  if (currentLocale) {
    const prefix = `/${currentLocale}`;
    if (stripped === prefix || stripped.startsWith(`${prefix}/`)) {
      stripped = stripped.slice(prefix.length) || '/';
    }
  }
  if (targetLocale) {
    return `/${targetLocale}${stripped === '/' ? '' : stripped}`;
  }
  return stripped || '/';
}

function FlagDropdown({ flags }: { flags: CountryFlag[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLocale = getActiveLocale(pathname, flags);
  const activeFlag = flags.find((f) => f.locale_prefix === activeLocale)
    ?? flags.find((f) => f.is_default)
    ?? flags[0];
  const otherFlags = flags.filter((f) => f !== activeFlag);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSelect = (flag: CountryFlag) => {
    setOpen(false);
    const newPath = buildLocalePath(pathname, activeLocale, flag.locale_prefix);
    router.push(newPath);
  };

  if (!activeFlag) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-sm border border-gray-300 px-1 py-0.5 transition-colors hover:border-gray-400"
        aria-label={`${activeFlag.label} — change locale`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sanitizeUrl(activeFlag.image_url)}
          alt={activeFlag.label}
          width={28}
          height={20}
          className="h-[20px] w-[28px] object-cover"
        />
        <ChevronDown className="text-gray-400" />
      </button>

      {open && otherFlags.length > 0 && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {otherFlags.map((flag) => (
            <button
              key={flag.code}
              type="button"
              onClick={() => handleSelect(flag)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sanitizeUrl(flag.image_url)}
                alt={flag.label}
                width={24}
                height={16}
                className="h-[16px] w-[24px] rounded-sm border border-slate-200 object-cover"
              />
              <span>{flag.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileFlagSelector({ flags, onSelect }: { flags: CountryFlag[]; onSelect: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeLocale = getActiveLocale(pathname, flags);
  const activeFlag = flags.find((f) => f.locale_prefix === activeLocale)
    ?? flags.find((f) => f.is_default)
    ?? flags[0];

  const handleChange = (localePrefix: string) => {
    onSelect();
    const newPath = buildLocalePath(pathname, activeLocale, localePrefix);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      {activeFlag && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={sanitizeUrl(activeFlag.image_url)}
          alt={activeFlag.label}
          className="h-[18px] w-[26px] rounded-sm border border-slate-200 object-cover"
        />
      )}
      <select
        value={activeLocale}
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      >
        {flags.map((flag) => (
          <option key={flag.code} value={flag.locale_prefix}>
            {flag.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main client header ──────────────────────────────────────────────────────

interface HeaderClientProps {
  header: HeaderConfig;
  menus: NavMenuEntry[];
}

export function HeaderClient({ header, menus }: HeaderClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileOpen]);

  return (
    <header
      className="w-full bg-white"
      style={{
        borderTop: `5px solid ${BLUE}`,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-stretch px-4">
        {/* ── Logo ── */}
        <Link href="/" className="flex flex-shrink-0 items-center pr-5 py-2">
          {header.logo_url ? (
            <Image
              src={sanitizeUrl(header.logo_url)}
              alt="e-con Systems"
              width={140}
              height={40}
              priority
              className="w-auto"
              style={{ height: '50px' }}
            />
          ) : (
            <Image
              src="https://d2u56hfpsewfc3.cloudfront.net/images/e-con-twenty-plus-years-logo-register.svg"
              alt="e-con Systems"
              width={140}
              height={40}
              priority
              className="w-auto"
              style={{ height: '50px' }}
            />
          )}
        </Link>

        {/* ── Desktop 2-row section ── */}
        <div className="hidden lg:flex flex-1 flex-col min-w-0">
          {/* Row 1 */}
          <div className="flex items-center gap-4 py-2">
            {/* Search  */}
            {header.search_enabled && (
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search"
                  className="h-[28px] w-[280px] bg-white px-2.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none"
                  style={{
                    border: `1px solid ${BLUE}`,
                    borderRight: 'none',
                    borderRadius: '3px 0 0 3px',
                  }}
                  readOnly
                />
                <button
                  type="button"
                  className="flex h-[28px] w-[30px] flex-shrink-0 items-center justify-center text-white"
                  style={{ backgroundColor: BLUE, borderRadius: '0 3px 3px 0' }}
                  aria-label="Search"
                >
                  <SearchIcon />
                </button>
              </div>
            )}

            <div className="flex-1" />

            {/* Phone */}
            {header.phone.visible && header.phone.number && (
              <a
                href={`tel:${header.phone.number}`}
                className="flex items-center gap-1.5 whitespace-nowrap text-gray-700 transition-colors hover:opacity-80"
              >
                <PhoneIcon />
                <span className="text-[13px] font-medium">{header.phone.label || header.phone.number}</span>
              </a>
            )}

            {header.phone.visible && header.contact_link.visible && (
              <span className="h-4 w-px bg-gray-300" />
            )}

            {/* Contact link */}
            {header.contact_link.visible && (
              <Link
                href={sanitizeUrl(header.contact_link.url)}
                className="flex items-center gap-1.5 whitespace-nowrap text-gray-700 transition-colors hover:opacity-80"
              >
                <MailIcon />
                <span className="text-[13px]">{header.contact_link.label}</span>
              </Link>
            )}

            {header.country_flags.length > 0 && (
              <>
                <span className="h-4 w-px bg-gray-300" />
                <FlagDropdown flags={header.country_flags} />
              </>
            )}
          </div>

          {/* Row 2: Nav items (left) | Cart + User + CTA (right) */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center -ml-3">
              {menus.map((menu) => (
                <NavItemDesktop key={menu.menu_id} menu={menu} />
              ))}
            </nav>

            <div className="flex items-center gap-1 pb-1">
              {header.cart_enabled && (
                <button type="button" className="p-2 transition-colors hover:opacity-80" aria-label="Cart">
                  <CartIcon />
                </button>
              )}
              {header.account_enabled && (
                <button type="button" className="p-2 transition-colors hover:opacity-80" aria-label="Account">
                  <UserIcon />
                </button>
              )}
              {header.cta_button.visible && (
                <Link
                  href={sanitizeUrl(header.cta_button.url)}
                  className="ml-1.5 flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: header.cta_button.bg_color || GREEN,
                    borderRadius: '5px',
                  }}
                >
                  {header.cta_button.icon_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={sanitizeUrl(header.cta_button.icon_url)} alt="" className="h-3.5 w-3.5" />
                  ) : (
                    <DocIcon />
                  )}
                  {header.cta_button.label}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile hamburger (lg:hidden) ── */}
        <div className="flex flex-1 items-center justify-end lg:hidden">
          <button
            type="button"
            className="p-2"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            style={{ color: BLUE }}
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* ── Mobile slide-in ── */}
      {mobileOpen && (
        <div className="fixed inset-0 top-[66px] z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeMobile}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="relative z-10 h-full w-full max-w-sm overflow-y-auto bg-white shadow-xl">
            {/* Top row shortcuts */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              {header.search_enabled && (
                <div className="flex flex-1 items-center">
                  <input
                    type="text"
                    placeholder="Search"
                    className="h-[32px] w-full bg-white px-2.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none"
                    style={{
                      border: `1px solid ${BLUE}`,
                      borderRight: 'none',
                      borderRadius: '3px 0 0 3px',
                    }}
                    readOnly
                  />
                  <button
                    type="button"
                    className="flex h-[32px] w-[34px] flex-shrink-0 items-center justify-center text-white"
                    style={{ backgroundColor: BLUE, borderRadius: '0 3px 3px 0' }}
                    aria-label="Search"
                  >
                    <SearchIcon />
                  </button>
                </div>
              )}
            </div>

            {/* Menu entries (accordion) */}
            <div>
              {menus.map((menu) => (
                <MobileMenuItem key={menu.menu_id} menu={menu} onClose={closeMobile} />
              ))}
            </div>

            {/* Bottom actions */}
            <div className="border-t border-slate-200 p-4 space-y-3">
              {header.country_flags.length > 1 && (
                <MobileFlagSelector flags={header.country_flags} onSelect={closeMobile} />
              )}
              {header.phone.visible && header.phone.number && (
                <a
                  href={`tel:${header.phone.number}`}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <PhoneIcon />
                  {header.phone.label || header.phone.number}
                </a>
              )}
              {header.contact_link.visible && (
                <Link
                  href={sanitizeUrl(header.contact_link.url)}
                  className="flex items-center gap-2 text-sm text-slate-700"
                  onClick={closeMobile}
                >
                  <MailIcon />
                  {header.contact_link.label}
                </Link>
              )}
              {header.cta_button.visible && (
                <Link
                  href={sanitizeUrl(header.cta_button.url)}
                  className="flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: header.cta_button.bg_color || GREEN }}
                  onClick={closeMobile}
                >
                  {header.cta_button.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
