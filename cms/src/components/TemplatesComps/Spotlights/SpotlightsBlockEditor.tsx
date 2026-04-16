import type {
  SpotlightsData,
  SpotlightsMeta,
  SpotlightsContent,
  SpotlightItem,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills heading, icons & descriptions
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: SpotlightsMeta = {
  bgColor: '#ffffff',
  iconSize: '48px',
  titleColor: '#1f2937',
  titleFontSize: '18px',
  descriptionColor: '#6b7280',
  descriptionFontSize: '14px',
  columns: 3,
  width: '100%',
  headingColor: '#111827',
  headingAlign: 'center',
  layout: 'grid',
  cardAlign: 'left',
};

const DEFAULT_CONTENT: SpotlightsContent = {
  heading: '',
  items: [],
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function SpotlightsBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as SpotlightsData;
  const meta: SpotlightsMeta = { ...DEFAULT_META, ...data.meta };
  const content: SpotlightsContent = { ...DEFAULT_CONTENT, ...data.content };

  function updateContent(patch: Partial<SpotlightsContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  function updateItem(index: number, patch: Partial<SpotlightItem>) {
    const items = content.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    updateContent({ items });
  }

  function addItem() {
    updateContent({
      items: [...content.items, { icon_url: '', icon_alt: '', title: '', description: '' }],
    });
  }

  function removeItem(index: number) {
    updateContent({ items: content.items.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Layout:</strong> {meta.layout}
        </span>
        <span>
          <strong>Columns:</strong> {meta.columns}
        </span>
        <span>
          <strong>Align:</strong> {meta.cardAlign}
        </span>
        <span>
          <strong>Icon:</strong> {meta.iconSize}
        </span>
        <span>
          <strong>Title:</strong> {meta.titleFontSize}
        </span>
        <span>
          <strong>Desc:</strong> {meta.descriptionFontSize}
        </span>
      </div>

      {/* Heading */}
      <div className="border border-gray-200 rounded p-4 space-y-4">
        <label className="flex flex-col gap-1">
          {label('Section Heading')}
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.heading}
            placeholder='e.g. "Why Choose Our Cameras"'
            onChange={(e) => updateContent({ heading: e.target.value })}
          />
        </label>

        {/* Items */}
        <fieldset className="border border-gray-200 rounded p-3 space-y-3">
          <legend className="text-xs font-bold text-gray-700 px-1">Spotlight Items</legend>

          {content.items.map((item, idx) => (
            <div key={idx} className="border border-gray-100 rounded p-3 space-y-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Item {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
              <label className="flex flex-col gap-1">
                {label('Icon URL')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.icon_url}
                  placeholder="https://…/icon.svg"
                  onChange={(e) => updateItem(idx, { icon_url: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('Icon Alt Text')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.icon_alt}
                  placeholder="Icon description"
                  onChange={(e) => updateItem(idx, { icon_alt: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('Title')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.title}
                  placeholder="Feature title"
                  onChange={(e) => updateItem(idx, { title: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('Description')}
                <textarea
                  className="rounded border border-gray-300 px-3 py-2 text-sm min-h-[60px]"
                  value={item.description}
                  placeholder="Brief description of this feature…"
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                />
              </label>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full rounded border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            + Add Spotlight
          </button>
        </fieldset>
      </div>
    </div>
  );
}
