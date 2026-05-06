'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ComplianceTableTabContent,
  DatasheetCTA,
  DocumentsTabContent,
  FAQTabContent,
  OrderTableTabContent,
  ProductTab,
  ProductTabsV2Data,
  ProductTabsV2Meta,
  RichTextTabContent,
  SpecListTabContent,
  TabContent,
  VideoGridTabContent,
} from '@/types/templates';

import { OverviewRenderer } from '@/components/blocks/ProductTabs/renderers/OverviewRenderer';
import { SpecListRenderer } from '@/components/blocks/ProductTabs/renderers/SpecListRenderer';
import { DocumentsRenderer } from '@/components/blocks/ProductTabs/renderers/DocumentsRenderer';
import { OrderTableRenderer } from '@/components/blocks/ProductTabs/renderers/OrderTableRenderer';
import { VideoGridRenderer } from '@/components/blocks/ProductTabs/renderers/VideoGridRenderer';
import { ComplianceTableRenderer } from '@/components/blocks/ProductTabs/renderers/ComplianceTableRenderer';
import { FAQRenderer } from '@/components/blocks/ProductTabs/renderers/FAQRenderer';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — ProductTabsV2Block
// Horizontal tab bar (Overview | Specification | Documents | …) with a green
// underline on the active tab. Reuses the same per-tab renderers as the
// sidebar variant (ProductTabsBlock).
//
// Two-column layout support:
//  When placed inside the GridLayout with, e.g., col_start=1 col_end=31 and a
//  side-column block at col_start=31 col_end=41, the component only occupies
//  its assigned grid columns — no extra wrapper needed. The component itself
//  is always 100% of its container.
// ─────────────────────────────────────────────────────────────────────────────

interface ProductTabsV2BlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: ProductTabsV2Meta = {
  active_color: '#22c55e',
  tabBarBorderColor: '#e5e7eb',
  tabsBgColor: '#ffffff',
  contentBgColor: '#ffffff',
  recaptchaSiteKey: '',
  datasheet_cta: { enabled: true, label: 'Datasheet' },
};

// ── Tab content dispatcher ─────────────────────────────────────────────────
function renderTabContent(
  tab: ProductTab,
  tabData: TabContent | undefined,
  recaptchaSiteKey: string,
  datasheetCta?: DatasheetCTA,
  documentsData?: DocumentsTabContent,
) {
  if (!tabData) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        No content available for this tab.
      </div>
    );
  }

  if (tab.external_url) {
    // External link tabs open in a new window — nothing to render inline
    return null;
  }

  switch (tab.content_type) {
    case 'richtext':
      return (
        <OverviewRenderer
          data={tabData as RichTextTabContent}
          datasheetCta={tab.preset_key === 'overview' ? datasheetCta : undefined}
          documentsData={tab.preset_key === 'overview' ? documentsData : undefined}
          recaptchaSiteKey={recaptchaSiteKey}
        />
      );
    case 'spec_list':
      return <SpecListRenderer data={tabData as SpecListTabContent} />;
    case 'documents':
      return (
        <DocumentsRenderer
          data={tabData as DocumentsTabContent}
          recaptchaSiteKey={recaptchaSiteKey}
        />
      );
    case 'order_table':
      return <OrderTableRenderer data={tabData as OrderTableTabContent} />;
    case 'video_grid':
      return <VideoGridRenderer data={tabData as VideoGridTabContent} />;
    case 'compliance_table':
      return <ComplianceTableRenderer data={tabData as ComplianceTableTabContent} />;
    case 'faq':
      return <FAQRenderer data={tabData as FAQTabContent} />;
    default:
      return null;
  }
}

// ── Spec table renderer (key-value with grouped categories) ───────────────
// Renders the new design's clean two-column spec table for spec_list tabs.
// Falls through to the generic SpecListRenderer otherwise.
function SpecTable({ tabData }: { tabData: SpecListTabContent }) {
  const sections = tabData.sections ?? [];
  if (sections.length === 0) {
    return <SpecListRenderer data={tabData} />;
  }

  return (
    <div className="ptv2-spec-table space-y-6">
      {sections.map((section, si) => (
        <div key={`section-${si}`}>
          <h3 className="mb-3 text-sm font-bold text-gray-900">{section.title}</h3>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {section.items.map((item, ii) => (
                <tr
                  key={`row-${si}-${ii}`}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-2.5 pr-6 align-top text-gray-500 w-2/5 font-normal">
                    {item.label}
                  </td>
                  <td className="py-2.5 align-top text-gray-800 font-normal">
                    {item.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function ProductTabsV2Block({ data }: ProductTabsV2BlockProps) {
  const raw = data as unknown as ProductTabsV2Data;
  const meta: ProductTabsV2Meta = { ...DEFAULT_META, ...(raw.meta ?? {}) };

  const tabs: ProductTab[] = useMemo(
    () =>
      (raw.content?.tabs ?? [])
        .filter((t) => t.enabled)
        .sort((a, b) => a.order - b.order),
    [raw.content?.tabs],
  );

  const tabData = raw.content?.tab_data ?? {};

  // Find documents tab data (used in overview datasheet CTA)
  const documentsTab = tabs.find((t) => t.content_type === 'documents');
  const documentsData = documentsTab
    ? (tabData[documentsTab.tab_id] as DocumentsTabContent | undefined)
    : undefined;

  const [activeId, setActiveId] = useState<string>('');

  // Initialize active tab (prefer URL hash)
  useEffect(() => {
    if (tabs.length === 0) return;
    const hash =
      typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hash) {
      const found = tabs.find(
        (t) =>
          t.tab_id === hash ||
          t.label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') === hash,
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
        const safe = tab.external_url.startsWith('http') ? tab.external_url : '#';
        window.open(safe, '_blank', 'noopener,noreferrer');
        return;
      }
      setActiveId(tab.tab_id);
    },
    [],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTab = tabs.find((t) => t.tab_id === activeId) ?? tabs[0];
  const activeTabData = activeId ? tabData[activeId] : undefined;

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (!scrollRef.current || !activeId) return;
    const btn = scrollRef.current.querySelector<HTMLButtonElement>(
      `[data-tabid="${activeId}"]`,
    );
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeId]);

  if (tabs.length === 0) return null;

  return (
    <section
      className="ptv2-root w-full"
      style={{ backgroundColor: meta.tabsBgColor }}
    >
      <style>{`
        /* Horizontal scrollable tab bar */
        .ptv2-tabbar {
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          border-bottom: 2px solid ${meta.tabBarBorderColor};
          background: ${meta.tabsBgColor};
        }
        .ptv2-tabbar::-webkit-scrollbar {
          display: none;
        }
        .ptv2-tab-btn {
          position: relative;
          z-index: 0;
          white-space: nowrap;
          padding: 12px 20px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.15s;
          flex-shrink: 0;
        }
        .ptv2-tab-btn:hover {
          color: #111827;
        }
        .ptv2-tab-btn.active {
          color: #111827;
          font-weight: 600;
        }
        .ptv2-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: ${meta.active_color};
          border-radius: 2px 2px 0 0;
          z-index: 1;
        }
        .ptv2-content {
          padding: clamp(20px, 3vw, 36px) 0;
          background: ${meta.contentBgColor};
        }
        /* Spec table responsive */
        @media (max-width: 640px) {
          .ptv2-spec-table td {
            display: block;
            width: 100% !important;
            padding-bottom: 0;
          }
          .ptv2-spec-table td:first-child {
            padding-top: 8px;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .ptv2-spec-table tr {
            border-bottom: 1px solid #f3f4f6;
            display: block;
            padding-bottom: 8px;
            margin-bottom: 4px;
          }
        }
      `}</style>

      {/* Tab bar */}
      <div className="ptv2-tabbar" ref={scrollRef} role="tablist" aria-label="Product tabs">
        {tabs.map((tab) => (
          <button
            key={tab.tab_id}
            data-tabid={tab.tab_id}
            role="tab"
            aria-selected={tab.tab_id === activeId}
            aria-controls={`ptv2-panel-${tab.tab_id}`}
            className={`ptv2-tab-btn${tab.tab_id === activeId ? ' active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content panel */}
      {activeTab && (
        <div
          id={`ptv2-panel-${activeTab.tab_id}`}
          role="tabpanel"
          aria-labelledby={`ptv2-tab-${activeTab.tab_id}`}
          className="ptv2-content"
        >
          {/* Spec list gets the new clean table layout */}
          {activeTab.content_type === 'spec_list' ? (
            <SpecTable
              tabData={(activeTabData as SpecListTabContent | undefined) ?? { sections: [] }}
            />
          ) : (
            renderTabContent(
              activeTab,
              activeTabData,
              meta.recaptchaSiteKey,
              meta.datasheet_cta,
              documentsData,
            )
          )}
        </div>
      )}
    </section>
  );
}
