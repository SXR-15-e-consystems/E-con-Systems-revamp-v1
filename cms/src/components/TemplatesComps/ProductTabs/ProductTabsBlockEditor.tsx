import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import type {
  ComplianceCategory,
  ComplianceTableTabContent,
  DocumentGroup,
  DocumentsTabContent,
  FAQTabContent,
  OrderSampleRow,
  OrderTableTabContent,
  ProductTab,
  ProductTabsContent,
  ProductTabsData,
  ProductTabsMeta,
  RichTextTabContent,
  SpecListTabContent,
  SpecSection,
  TabContent,
  TabContentType,
  VideoGridTabContent,
  VideoItem,
} from '../../../types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PRESET_TABS: Omit<ProductTab, 'tab_id'>[] = [
  { label: 'Overview', content_type: 'richtext', preset_key: 'overview', order: 0, enabled: true },
  { label: 'Specifications', content_type: 'spec_list', preset_key: 'specifications', order: 1, enabled: true },
  { label: 'Software', content_type: 'richtext', preset_key: 'software', order: 2, enabled: true },
  { label: 'Standards & Compliance', content_type: 'compliance_table', preset_key: 'standards_compliance', order: 3, enabled: true },
  { label: 'Documents', content_type: 'documents', preset_key: 'documents', order: 4, enabled: true },
  { label: 'Order Samples', content_type: 'order_table', preset_key: 'order_samples', order: 5, enabled: true },
  { label: 'Videos', content_type: 'video_grid', preset_key: 'videos', order: 6, enabled: true },
  { label: 'Customization', content_type: 'richtext', preset_key: 'customization', order: 7, enabled: true },
  { label: 'FAQs', content_type: 'faq', preset_key: 'faqs', order: 8, enabled: true },
];

const CONTENT_TYPE_LABELS: Record<TabContentType, string> = {
  richtext: 'Rich Text',
  spec_list: 'Specification List',
  documents: 'Documents',
  order_table: 'Order Table',
  video_grid: 'Video Grid',
  compliance_table: 'Compliance Table',
  faq: 'FAQ',
};

const DEFAULT_META: ProductTabsMeta = {
  sidebar_width: '160px',
  active_color: '#2563eb',
  mobile_layout: 'horizontal_scroll',
  max_custom_tabs: 2,
};

function emptyContent(type: TabContentType): TabContent {
  switch (type) {
    case 'richtext':
      return { html: '', links: [] } satisfies RichTextTabContent;
    case 'spec_list':
      return { sections: [] } satisfies SpecListTabContent;
    case 'documents':
      return { groups: [] } satisfies DocumentsTabContent;
    case 'order_table':
      return { rows: [] } satisfies OrderTableTabContent;
    case 'video_grid':
      return { items: [] } satisfies VideoGridTabContent;
    case 'compliance_table':
      return { categories: [] } satisfies ComplianceTableTabContent;
    case 'faq':
      return { items: [] } satisfies FAQTabContent;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-editors for each content type
// ─────────────────────────────────────────────────────────────────────────────

function RichTextTabEditor({
  content,
  onChange,
}: {
  content: RichTextTabContent;
  onChange: (c: RichTextTabContent) => void;
}) {
  const links = content.links ?? [];

  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">HTML Content</span>
        <textarea
          className="rounded border border-gray-300 px-3 py-2 text-sm font-mono resize-y min-h-[120px]"
          value={content.html}
          onChange={(e) => onChange({ ...content, html: e.target.value })}
        />
      </label>
      <div>
        <span className="text-xs font-semibold text-gray-600 block mb-1">Links</span>
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="Label"
              value={link.label}
              onChange={(e) => {
                const updated = [...links];
                updated[i] = { ...link, label: e.target.value };
                onChange({ ...content, links: updated });
              }}
            />
            <input
              className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="URL"
              value={link.url}
              onChange={(e) => {
                const updated = [...links];
                updated[i] = { ...link, url: e.target.value };
                onChange({ ...content, links: updated });
              }}
            />
            <button
              type="button"
              onClick={() => onChange({ ...content, links: links.filter((_, j) => j !== i) })}
              className="text-red-500 hover:text-red-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...content, links: [...links, { label: '', url: '' }] })}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add Link
        </button>
      </div>
    </div>
  );
}

function SpecListTabEditor({
  content,
  onChange,
}: {
  content: SpecListTabContent;
  onChange: (c: SpecListTabContent) => void;
}) {
  const sections = content.sections ?? [];

  function updateSection(si: number, patch: Partial<SpecSection>) {
    const updated = sections.map((s, i) => (i === si ? { ...s, ...patch } : s));
    onChange({ ...content, sections: updated });
  }

  function addItem(si: number) {
    const section = sections[si];
    updateSection(si, { items: [...section.items, { label: '', value: '' }] });
  }

  return (
    <div className="space-y-4">
      {sections.map((section, si) => (
        <div key={si} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <input
              className="font-semibold text-sm rounded border border-gray-300 px-2 py-1 flex-1 mr-2"
              value={section.title}
              placeholder="Section title (e.g., Sensor features)"
              onChange={(e) => updateSection(si, { title: e.target.value })}
            />
            <button
              type="button"
              onClick={() =>
                onChange({ ...content, sections: sections.filter((_, i) => i !== si) })
              }
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Remove
            </button>
          </div>
          {section.items.map((item, ii) => (
            <div key={ii} className="flex items-center gap-2">
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Label (optional)"
                value={item.label}
                onChange={(e) => {
                  const items = [...section.items];
                  items[ii] = { ...item, label: e.target.value };
                  updateSection(si, { items });
                }}
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Value"
                value={item.value}
                onChange={(e) => {
                  const items = [...section.items];
                  items[ii] = { ...item, value: e.target.value };
                  updateSection(si, { items });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  updateSection(si, { items: section.items.filter((_, j) => j !== ii) })
                }
                className="text-red-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addItem(si)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Add Item
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({ ...content, sections: [...sections, { title: '', items: [] }] })
        }
        className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-300 rounded px-3 py-1.5"
      >
        + Add Section
      </button>
    </div>
  );
}

function DocumentsTabEditor({
  content,
  onChange,
}: {
  content: DocumentsTabContent;
  onChange: (c: DocumentsTabContent) => void;
}) {
  const groups = content.groups ?? [];

  function updateGroup(gi: number, patch: Partial<DocumentGroup>) {
    const updated = groups.map((g, i) => (i === gi ? { ...g, ...patch } : g));
    onChange({ ...content, groups: updated });
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <input
              className="font-semibold text-sm rounded border border-gray-300 px-2 py-1 flex-1 mr-2"
              value={group.title}
              placeholder="Group title (e.g., Documents, Compliance)"
              onChange={(e) => updateGroup(gi, { title: e.target.value })}
            />
            <button
              type="button"
              onClick={() => onChange({ ...content, groups: groups.filter((_, i) => i !== gi) })}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Remove
            </button>
          </div>
          {group.items.map((item, ii) => (
            <div key={ii} className="flex items-center gap-2">
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Document name"
                value={item.name}
                onChange={(e) => {
                  const items = [...group.items];
                  items[ii] = { ...item, name: e.target.value };
                  updateGroup(gi, { items });
                }}
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Download URL"
                value={item.url}
                onChange={(e) => {
                  const items = [...group.items];
                  items[ii] = { ...item, url: e.target.value };
                  updateGroup(gi, { items });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  updateGroup(gi, { items: group.items.filter((_, j) => j !== ii) })
                }
                className="text-red-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              updateGroup(gi, { items: [...group.items, { name: '', url: '' }] })
            }
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Add Document
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({ ...content, groups: [...groups, { title: '', items: [] }] })
        }
        className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-300 rounded px-3 py-1.5"
      >
        + Add Group
      </button>
    </div>
  );
}

function OrderTableTabEditor({
  content,
  onChange,
}: {
  content: OrderTableTabContent;
  onChange: (c: OrderTableTabContent) => void;
}) {
  const rows = content.rows ?? [];

  function updateRow(ri: number, patch: Partial<OrderSampleRow>) {
    const updated = rows.map((r, i) => (i === ri ? { ...r, ...patch } : r));
    onChange({ ...content, rows: updated });
  }

  return (
    <div className="space-y-4">
      {rows.map((row, ri) => (
        <div key={ri} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Row {ri + 1}</span>
            <button
              type="button"
              onClick={() => onChange({ ...content, rows: rows.filter((_, i) => i !== ri) })}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="Part No"
              value={row.part_no}
              onChange={(e) => updateRow(ri, { part_no: e.target.value })}
            />
            <input
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="Price (e.g., USD 549)"
              value={row.price}
              onChange={(e) => updateRow(ri, { price: e.target.value })}
            />
          </div>
          <input
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="Contact URL"
            value={row.contact_url}
            onChange={(e) => updateRow(ri, { contact_url: e.target.value })}
          />
          <div>
            <span className="text-xs text-gray-500 block mb-1">Kit Contents</span>
            {row.kit_contents.map((item, ki) => (
              <div key={ki} className="flex items-center gap-2 mb-1">
                <input
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  value={item}
                  onChange={(e) => {
                    const kit = [...row.kit_contents];
                    kit[ki] = e.target.value;
                    updateRow(ri, { kit_contents: kit });
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateRow(ri, {
                      kit_contents: row.kit_contents.filter((_, j) => j !== ki),
                    })
                  }
                  className="text-red-500 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateRow(ri, { kit_contents: [...row.kit_contents, ''] })
              }
              className="text-xs text-blue-600"
            >
              + Add Item
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...content,
            rows: [...rows, { part_no: '', kit_contents: [], price: '', contact_url: '' }],
          })
        }
        className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-300 rounded px-3 py-1.5"
      >
        + Add Row
      </button>
    </div>
  );
}

function VideoGridTabEditor({
  content,
  onChange,
}: {
  content: VideoGridTabContent;
  onChange: (c: VideoGridTabContent) => void;
}) {
  const items = content.items ?? [];

  function updateItem(i: number, patch: Partial<VideoItem>) {
    const updated = items.map((item, idx) => (idx === i ? { ...item, ...patch } : item));
    onChange({ ...content, items: updated });
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Video {i + 1}</span>
            <button
              type="button"
              onClick={() =>
                onChange({ ...content, items: items.filter((_, j) => j !== i) })
              }
              className="text-red-500 text-xs"
            >
              Remove
            </button>
          </div>
          <input
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="Video title"
            value={item.title}
            onChange={(e) => updateItem(i, { title: e.target.value })}
          />
          <input
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="Video URL (YouTube)"
            value={item.video_url}
            onChange={(e) => updateItem(i, { video_url: e.target.value })}
          />
          <input
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="Thumbnail URL"
            value={item.thumbnail_url}
            onChange={(e) => updateItem(i, { thumbnail_url: e.target.value })}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...content,
            items: [...items, { title: '', video_url: '', thumbnail_url: '' }],
          })
        }
        className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-300 rounded px-3 py-1.5"
      >
        + Add Video
      </button>
    </div>
  );
}

function ComplianceTabEditor({
  content,
  onChange,
}: {
  content: ComplianceTableTabContent;
  onChange: (c: ComplianceTableTabContent) => void;
}) {
  const categories = content.categories ?? [];

  function updateCategory(ci: number, patch: Partial<ComplianceCategory>) {
    const updated = categories.map((c, i) => (i === ci ? { ...c, ...patch } : c));
    onChange({ ...content, categories: updated });
  }

  return (
    <div className="space-y-4">
      {categories.map((cat, ci) => (
        <div key={ci} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <input
              className="font-semibold text-sm rounded border border-gray-300 px-2 py-1 flex-1 mr-2"
              value={cat.title}
              placeholder="Category (e.g., Immunity standards)"
              onChange={(e) => updateCategory(ci, { title: e.target.value })}
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...content,
                  categories: categories.filter((_, i) => i !== ci),
                })
              }
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Remove
            </button>
          </div>
          {cat.rows.map((row, ri) => (
            <div key={ri} className="flex items-center gap-2">
              <input
                className="w-12 rounded border border-gray-300 px-2 py-1 text-sm text-center"
                placeholder="#"
                type="number"
                value={row.sno}
                onChange={(e) => {
                  const rows = [...cat.rows];
                  rows[ri] = { ...row, sno: parseInt(e.target.value, 10) || 0 };
                  updateCategory(ci, { rows });
                }}
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Certification"
                value={row.certification}
                onChange={(e) => {
                  const rows = [...cat.rows];
                  rows[ri] = { ...row, certification: e.target.value };
                  updateCategory(ci, { rows });
                }}
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Test Specifications"
                value={row.test_spec}
                onChange={(e) => {
                  const rows = [...cat.rows];
                  rows[ri] = { ...row, test_spec: e.target.value };
                  updateCategory(ci, { rows });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  updateCategory(ci, { rows: cat.rows.filter((_, j) => j !== ri) })
                }
                className="text-red-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              updateCategory(ci, {
                rows: [
                  ...cat.rows,
                  { sno: cat.rows.length + 1, certification: '', test_spec: '' },
                ],
              })
            }
            className="text-xs text-blue-600"
          >
            + Add Row
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...content,
            categories: [...categories, { title: '', rows: [] }],
          })
        }
        className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-300 rounded px-3 py-1.5"
      >
        + Add Category
      </button>
    </div>
  );
}

function FAQTabEditor({
  content,
  onChange,
}: {
  content: FAQTabContent;
  onChange: (c: FAQTabContent) => void;
}) {
  const items = content.items ?? [];

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Q{i + 1}</span>
            <button
              type="button"
              onClick={() =>
                onChange({ ...content, items: items.filter((_, j) => j !== i) })
              }
              className="text-red-500 text-xs"
            >
              Remove
            </button>
          </div>
          <input
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="Question"
            value={item.question}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = { ...item, question: e.target.value };
              onChange({ ...content, items: updated });
            }}
          />
          <textarea
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm resize-y min-h-[60px]"
            placeholder="Answer (HTML supported)"
            value={item.answer}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = { ...item, answer: e.target.value };
              onChange({ ...content, items: updated });
            }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...content,
            items: [...items, { question: '', answer: '' }],
          })
        }
        className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-300 rounded px-3 py-1.5"
      >
        + Add FAQ
      </button>
    </div>
  );
}

function getSubEditor(
  type: TabContentType,
  content: TabContent,
  onChange: (c: TabContent) => void,
) {
  switch (type) {
    case 'richtext':
      return (
        <RichTextTabEditor
          content={content as RichTextTabContent}
          onChange={onChange}
        />
      );
    case 'spec_list':
      return (
        <SpecListTabEditor
          content={content as SpecListTabContent}
          onChange={onChange}
        />
      );
    case 'documents':
      return (
        <DocumentsTabEditor
          content={content as DocumentsTabContent}
          onChange={onChange}
        />
      );
    case 'order_table':
      return (
        <OrderTableTabEditor
          content={content as OrderTableTabContent}
          onChange={onChange}
        />
      );
    case 'video_grid':
      return (
        <VideoGridTabEditor
          content={content as VideoGridTabContent}
          onChange={onChange}
        />
      );
    case 'compliance_table':
      return (
        <ComplianceTabEditor
          content={content as ComplianceTableTabContent}
          onChange={onChange}
        />
      );
    case 'faq':
      return (
        <FAQTabEditor content={content as FAQTabContent} onChange={onChange} />
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — manage tab list + edit each tab's content
// ─────────────────────────────────────────────────────────────────────────────

export function ProductTabsBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ProductTabsData;
  const meta: ProductTabsMeta = { ...DEFAULT_META, ...data.meta };

  // Initialize defaults if content is missing
  const hasContent = data.content && Array.isArray(data.content.tabs) && data.content.tabs.length > 0;

  const initTabs = (): ProductTabsContent => {
    if (hasContent) {
      return data.content;
    }
    const defaultTabs = DEFAULT_PRESET_TABS.map((t) => ({ ...t, tab_id: uuidv4() }));
    const defaultData: Record<string, TabContent> = {};
    defaultTabs.forEach((t) => {
      defaultData[t.tab_id] = emptyContent(t.content_type);
    });
    return { tabs: defaultTabs, tab_data: defaultData };
  };

  const contentData: ProductTabsContent = initTabs();
  const tabs = contentData.tabs;
  const tabData = contentData.tab_data;

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [newTabType, setNewTabType] = useState<TabContentType>('richtext');

  const presetTabs = tabs.filter((t) => t.preset_key);
  const customTabs = tabs.filter((t) => !t.preset_key);
  const maxCustom = meta.max_custom_tabs;

  function updateContent(patch: Partial<ProductTabsContent>) {
    onChange({
      ...data,
      meta,
      content: { ...contentData, ...patch },
    } as unknown as Record<string, unknown>);
  }

  function toggleTab(tabId: string) {
    const updated = tabs.map((t) =>
      t.tab_id === tabId ? { ...t, enabled: !t.enabled } : t,
    );
    updateContent({ tabs: updated });
  }

  function moveTab(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= tabs.length) return;
    const updated = [...tabs];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    updateContent({ tabs: updated.map((t, i) => ({ ...t, order: i })) });
  }

  function addCustomTab() {
    if (!newTabName.trim() || customTabs.length >= maxCustom) return;
    const tab: ProductTab = {
      tab_id: uuidv4(),
      label: newTabName.trim(),
      content_type: newTabType,
      order: tabs.length,
      enabled: true,
    };
    updateContent({
      tabs: [...tabs, tab],
      tab_data: { ...tabData, [tab.tab_id]: emptyContent(newTabType) },
    });
    setNewTabName('');
  }

  function removeCustomTab(tabId: string) {
    const updated = tabs.filter((t) => t.tab_id !== tabId);
    const newData = { ...tabData };
    delete newData[tabId];
    updateContent({
      tabs: updated.map((t, i) => ({ ...t, order: i })),
      tab_data: newData,
    });
    if (editingTabId === tabId) setEditingTabId(null);
  }

  function updateTabData(tabId: string, content: TabContent) {
    updateContent({ tab_data: { ...tabData, [tabId]: content } });
  }

  function updateTabExternalUrl(tabId: string, url: string) {
    const updated = tabs.map((t) =>
      t.tab_id === tabId ? { ...t, external_url: url || undefined } : t,
    );
    updateContent({ tabs: updated });
  }

  const editingTab = editingTabId ? tabs.find((t) => t.tab_id === editingTabId) : null;

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Sidebar:</strong> {meta.sidebar_width}
        </span>
        <span>
          <strong>Mobile:</strong> {meta.mobile_layout}
        </span>
        <span>
          <strong>Custom slots:</strong> {customTabs.length}/{maxCustom}
        </span>
      </div>

      {/* ══ Default Tabs ══ */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Default Tabs
        </h3>
        <div className="space-y-1">
          {presetTabs.map((tab) => {
            const globalIndex = tabs.indexOf(tab);
            return (
              <div
                key={tab.tab_id}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm border transition-colors ${
                  editingTabId === tab.tab_id
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={tab.enabled}
                  onChange={() => toggleTab(tab.tab_id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEditingTabId(editingTabId === tab.tab_id ? null : tab.tab_id)
                  }
                  className="flex-1 text-left font-medium text-gray-700 truncate"
                >
                  {tab.label}
                </button>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {CONTENT_TYPE_LABELS[tab.content_type]}
                </span>
                <button
                  type="button"
                  onClick={() => moveTab(globalIndex, -1)}
                  disabled={globalIndex === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveTab(globalIndex, 1)}
                  disabled={globalIndex === tabs.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                >
                  ↓
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ Custom Tabs ══ */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Custom Tabs ({customTabs.length}/{maxCustom})
        </h3>
        <div className="space-y-1 mb-3">
          {customTabs.map((tab) => {
            const globalIndex = tabs.indexOf(tab);
            return (
              <div
                key={tab.tab_id}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm border transition-colors ${
                  editingTabId === tab.tab_id
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={tab.enabled}
                  onChange={() => toggleTab(tab.tab_id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEditingTabId(editingTabId === tab.tab_id ? null : tab.tab_id)
                  }
                  className="flex-1 text-left font-medium text-gray-700 truncate"
                >
                  {tab.label}
                </button>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {CONTENT_TYPE_LABELS[tab.content_type]}
                </span>
                <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded font-medium">
                  custom
                </span>
                <button
                  type="button"
                  onClick={() => moveTab(globalIndex, -1)}
                  disabled={globalIndex === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveTab(globalIndex, 1)}
                  disabled={globalIndex === tabs.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeCustomTab(tab.tab_id)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {customTabs.length < maxCustom && (
          <div className="flex items-end gap-2 border border-dashed border-gray-300 rounded p-3">
            <label className="flex-1">
              <span className="text-xs font-semibold text-gray-600 block mb-1">Tab Name</span>
              <input
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="e.g., Accessories"
              />
            </label>
            <label>
              <span className="text-xs font-semibold text-gray-600 block mb-1">Type</span>
              <select
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                value={newTabType}
                onChange={(e) => setNewTabType(e.target.value as TabContentType)}
              >
                {(Object.keys(CONTENT_TYPE_LABELS) as TabContentType[]).map((key) => (
                  <option key={key} value={key}>
                    {CONTENT_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={addCustomTab}
              disabled={!newTabName.trim()}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              + Add
            </button>
          </div>
        )}
      </div>

      {/* ══ Tab Content Editor ══ */}
      {editingTab && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">
              Edit: {editingTab.label}
            </h3>
            <button
              type="button"
              onClick={() => setEditingTabId(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          {/* External URL option */}
          <label className="flex flex-col gap-1 mb-3">
            <span className="text-xs font-semibold text-gray-600">
              External URL (opens in new tab instead of showing content)
            </span>
            <input
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="https://... (leave empty for inline content)"
              value={editingTab.external_url ?? ''}
              onChange={(e) => updateTabExternalUrl(editingTab.tab_id, e.target.value)}
            />
          </label>

          {!editingTab.external_url &&
            getSubEditor(
              editingTab.content_type,
              tabData[editingTab.tab_id] ?? emptyContent(editingTab.content_type),
              (c) => updateTabData(editingTab.tab_id, c),
            )}
        </div>
      )}
    </div>
  );
}
