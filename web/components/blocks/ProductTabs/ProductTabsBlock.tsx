'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  ComplianceTableTabContent,
  DocumentsTabContent,
  FAQTabContent,
  OrderTableTabContent,
  ProductTab,
  ProductTabsData,
  ProductTabsMeta,
  RichTextTabContent,
  SpecListTabContent,
  TabContent,
  VideoGridTabContent,
} from '@/types/templates';

import { OverviewRenderer } from './renderers/OverviewRenderer';
import { SpecListRenderer } from './renderers/SpecListRenderer';
import { DocumentsRenderer } from './renderers/DocumentsRenderer';
import { OrderTableRenderer } from './renderers/OrderTableRenderer';
import { VideoGridRenderer } from './renderers/VideoGridRenderer';
import { ComplianceTableRenderer } from './renderers/ComplianceTableRenderer';
import { FAQRenderer } from './renderers/FAQRenderer';

interface ProductTabsBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: ProductTabsMeta = {
  sidebar_width: '160px',
  active_color: '#2563eb',
  mobile_layout: 'horizontal_scroll',
  max_custom_tabs: 2,
};

function renderTabContent(tab: ProductTab, data: TabContent | undefined) {
  if (!data) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No content available for this tab.
      </div>
    );
  }

  switch (tab.content_type) {
    case 'richtext':
      return <OverviewRenderer data={data as RichTextTabContent} />;
    case 'spec_list':
      return <SpecListRenderer data={data as SpecListTabContent} />;
    case 'documents':
      return <DocumentsRenderer data={data as DocumentsTabContent} />;
    case 'order_table':
      return <OrderTableRenderer data={data as OrderTableTabContent} />;
    case 'video_grid':
      return <VideoGridRenderer data={data as VideoGridTabContent} />;
    case 'compliance_table':
      return <ComplianceTableRenderer data={data as ComplianceTableTabContent} />;
    case 'faq':
      return <FAQRenderer data={data as FAQTabContent} />;
    default:
      return null;
  }
}

export function ProductTabsBlock({ data }: ProductTabsBlockProps) {
  const raw = data as unknown as ProductTabsData;
  const meta: ProductTabsMeta = { ...DEFAULT_META, ...raw.meta };

  const tabs: ProductTab[] = useMemo(
    () =>
      (raw.content?.tabs ?? [])
        .filter((t) => t.enabled)
        .sort((a, b) => a.order - b.order),
    [raw.content?.tabs],
  );

  const tabData = raw.content?.tab_data ?? {};

  const [activeId, setActiveId] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize active tab
  useEffect(() => {
    if (tabs.length === 0) return;

    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hash) {
      const found = tabs.find(
        (t) =>
          t.tab_id === hash ||
          t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === hash,
      );
      if (found) {
        setActiveId(found.tab_id);
        return;
      }
    }
    setActiveId(tabs[0].tab_id);
  }, [tabs]);

  const handleTabClick = useCallback(
    (tab: ProductTab) => {
      if (tab.external_url) {
        window.open(tab.external_url, '_blank', 'noopener,noreferrer');
        return;
      }
      setActiveId(tab.tab_id);
      setMobileOpen(false);
      const slug = tab.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      window.history.replaceState(null, '', `#${slug}`);
    },
    [],
  );

  const activeTab = tabs.find((t) => t.tab_id === activeId);

  if (tabs.length === 0) return null;

  const ExternalIcon = () => (
    <svg
      className="inline-block ml-1 w-3 h-3 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );

  return (
    <section className="w-full bg-white">
      {/* ═══ Mobile: Horizontal scroll tabs ═══ */}
      {meta.mobile_layout === 'horizontal_scroll' ? (
        <div className="md:hidden overflow-x-auto border-b border-slate-200">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const isActive = activeId === tab.tab_id;
              return (
                <button
                  key={tab.tab_id}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                  style={isActive ? { color: meta.active_color, borderColor: meta.active_color } : undefined}
                >
                  {tab.label}
                  {tab.external_url ? <ExternalIcon /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ═══ Mobile: Dropdown ═══ */
        <div className="md:hidden relative border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700"
          >
            {activeTab?.label ?? 'Select tab'}
            <svg
              className={`w-4 h-4 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {mobileOpen && (
            <div className="absolute z-20 left-0 right-0 bg-white border border-slate-200 shadow-lg rounded-b-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.tab_id}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${
                    activeId === tab.tab_id
                      ? 'font-semibold bg-blue-50'
                      : 'text-slate-700'
                  }`}
                  style={activeId === tab.tab_id ? { color: meta.active_color } : undefined}
                >
                  {tab.label}
                  {tab.external_url ? ' ↗' : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Desktop: Sidebar + Content ═══ */}
      <div className="hidden md:flex">
        {/* Left Sidebar */}
        <nav
          className="flex-shrink-0 border-r border-slate-200"
          style={{ width: meta.sidebar_width, minWidth: meta.sidebar_width }}
        >
          <ul className="py-2">
            {tabs.map((tab) => {
              const isActive = activeId === tab.tab_id;
              return (
                <li key={tab.tab_id}>
                  <button
                    type="button"
                    onClick={() => handleTabClick(tab)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] leading-snug transition-colors border-l-2 ${
                      isActive
                        ? 'font-semibold'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    style={
                      isActive
                        ? { borderColor: meta.active_color, color: meta.active_color }
                        : undefined
                    }
                  >
                    {tab.label}
                    {tab.external_url ? (
                      <svg
                        className="inline-block ml-1 w-3 h-3 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 min-w-0 px-6 py-4">
          {activeTab && !activeTab.external_url && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-4">{activeTab.label}</h2>
              {renderTabContent(activeTab, tabData[activeTab.tab_id])}
            </>
          )}
        </div>
      </div>

      {/* ═══ Mobile: Content area ═══ */}
      <div className="md:hidden px-4 py-4">
        {activeTab && !activeTab.external_url && (
          <>
            <h2 className="text-base font-bold text-slate-900 mb-3">{activeTab.label}</h2>
            {renderTabContent(activeTab, tabData[activeTab.tab_id])}
          </>
        )}
      </div>
    </section>
  );
}
