import type {
  RelatedContentData,
  RelatedContentItem,
  RelatedContentMeta,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills item data
// Hints about image_url being optional for Video type (YouTube auto-thumbnail)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: RelatedContentMeta = {
  contentType: 'Blog',
  displayCount: 3,
  sliderMode: false,
  showTitle: true,
  showCTA: true,
  ctaLabel: 'Read More',
  cardStyle: { bgColor: '#ffffff', textColor: '#1a1a1a', borderRadius: '8px' },
  width: '100%',
};

const EMPTY_ITEM: RelatedContentItem = {
  image_url: '',
  image_alt: '',
  title: '',
  link: '',
  cta_text: '',
};

function fi(
  labelText: string,
  value: string,
  onChange: (v: string) => void,
  placeholder?: string,
  hint?: string,
) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-600">{labelText}</span>
      {hint && <span className="text-xs text-blue-500">{hint}</span>}
      <input
        className="rounded border border-gray-300 px-3 py-2 text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function RelatedContentBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as RelatedContentData;
  const meta: RelatedContentMeta = { ...DEFAULT_META, ...data.meta };
  const items: RelatedContentItem[] = data.content?.items ?? [{ ...EMPTY_ITEM }];
  const isVideo = meta.contentType === 'Video';

  function updateItem(index: number, patch: Partial<RelatedContentItem>) {
    const updated = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...data, content: { items: updated } });
  }

  function addItem() {
    onChange({ ...data, content: { items: [...items, { ...EMPTY_ITEM }] } });
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    onChange({ ...data, content: { items: items.filter((_, i) => i !== index) } });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Type:</strong> {meta.contentType}</span>
        <span><strong>Display:</strong> {meta.displayCount} items</span>
        <span><strong>Slider:</strong> {meta.sliderMode ? 'yes' : 'no'}</span>
        {meta.showCTA && <span><strong>CTA label:</strong> {meta.ctaLabel}</span>}
      </div>

      {isVideo && (
        <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-2">
          Video type — if you leave Image URL blank, the YouTube thumbnail will be derived automatically from the Link URL.
        </p>
      )}

      {/* Item editors */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Item {index + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30"
              >
                Remove
              </button>
            </div>

            {fi(
              isVideo ? 'Thumbnail URL (optional for YouTube)' : 'Image URL *',
              item.image_url ?? '',
              (v) => updateItem(index, { image_url: v }),
              'https://… or leave blank for YouTube auto-thumbnail',
            )}
            {fi('Image Alt Text', item.image_alt, (v) => updateItem(index, { image_alt: v }), 'Describe the image')}

            {fi(
              isVideo ? 'YouTube / Video URL *' : 'Link *',
              item.link,
              (v) => updateItem(index, { link: v }),
              'https://…',
            )}

            {meta.showTitle && fi('Title', item.title ?? '', (v) => updateItem(index, { title: v }))}

            {meta.showCTA && fi(
              'CTA Text (overrides default)',
              item.cta_text ?? '',
              (v) => updateItem(index, { cta_text: v }),
              meta.ctaLabel,
            )}

            {/* Thumbnail preview */}
            {item.image_url && (
              <div>
                <span className="text-xs text-gray-500">Preview:</span>
                <img
                  src={item.image_url}
                  alt={item.image_alt}
                  className="mt-1 max-h-24 rounded border object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="w-full rounded border border-dashed border-gray-400 py-2 text-xs text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        + Add Item
      </button>
    </div>
  );
}
