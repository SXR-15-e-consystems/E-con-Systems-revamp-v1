import type {
  TargetApplicationsData,
  TargetApplicationsMeta,
  TargetApplicationsContent,
  TargetApplicationItem,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills heading, application items
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: TargetApplicationsMeta = {
  bgColor: '#ffffff',
  cardBorderRadius: '8px',
  captionColor: '#1f2937',
  columns: 4,
  autoplay: false,
  autoplayInterval: 4000,
  width: '100%',
  layout: 'grid',
  headingAlign: 'center',
  headingColor: '#111827',
  cardAlign: 'center',
};

const DEFAULT_CONTENT: TargetApplicationsContent = {
  heading: '',
  items: [],
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function TargetApplicationsBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as TargetApplicationsData;
  const meta: TargetApplicationsMeta = { ...DEFAULT_META, ...data.meta };
  const content: TargetApplicationsContent = { ...DEFAULT_CONTENT, ...data.content };
  const items: TargetApplicationItem[] = content.items ?? [];

  function updateContent(patch: Partial<TargetApplicationsContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  function updateItem(index: number, patch: Partial<TargetApplicationItem>) {
    const updated = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    updateContent({ items: updated });
  }

  function addItem() {
    updateContent({
      items: [...items, { image_url: '', image_alt: '', caption: '', link: '' }],
    });
  }

  function removeItem(index: number) {
    updateContent({ items: items.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Layout:</strong> {meta.layout === 'slider' ? 'Slider' : 'Grid'}
        </span>
        <span>
          <strong>Columns:</strong> {meta.columns}
        </span>
        <span>
          <strong>Align:</strong> {meta.headingAlign}
        </span>
        <span>
          <strong>Border Radius:</strong> {meta.cardBorderRadius}
        </span>
        <span>
          <strong>Autoplay:</strong> {meta.autoplay ? `${meta.autoplayInterval}ms` : 'Off'}
        </span>
        <span>
          <strong>BG:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.bgColor }}
          />
        </span>
      </div>

      {/* Heading */}
      <div className="border border-gray-200 rounded p-4 space-y-4">
        <label className="flex flex-col gap-1">
          {label('Section Heading *')}
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.heading}
            placeholder='e.g. "Target Applications"'
            onChange={(e) => updateContent({ heading: e.target.value })}
          />
        </label>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {label(`Applications (${items.length})`)}
            <button
              type="button"
              onClick={addItem}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              + Add Application
            </button>
          </div>

          {items.map((item, i) => (
            <fieldset key={i} className="border border-gray-200 rounded p-3 space-y-3">
              <legend className="text-xs font-bold text-gray-700 px-1 flex items-center gap-2">
                Application {i + 1}
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-red-500 hover:text-red-700 text-xs font-normal"
                >
                  Remove
                </button>
              </legend>
              <label className="flex flex-col gap-1">
                {label('Image URL *')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.image_url}
                  placeholder="https://…/application.png"
                  onChange={(e) => updateItem(i, { image_url: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('Image Alt Text')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.image_alt}
                  placeholder="Application image description"
                  onChange={(e) => updateItem(i, { image_alt: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  {label('Caption *')}
                  <input
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                    value={item.caption}
                    placeholder='e.g. "Retail"'
                    onChange={(e) => updateItem(i, { caption: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  {label('Link')}
                  <input
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                    value={item.link}
                    placeholder="https://… or /applications/retail"
                    onChange={(e) => updateItem(i, { link: e.target.value })}
                  />
                </label>
              </div>
            </fieldset>
          ))}

          {items.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded">
              No applications added yet. Click &quot;+ Add Application&quot; above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
