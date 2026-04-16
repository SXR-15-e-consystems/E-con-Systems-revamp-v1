import type {
  VideoGalleryData,
  VideoGalleryMeta,
  VideoGalleryContent,
  VideoGalleryItem,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills heading and video items
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: VideoGalleryMeta = {
  bgColor: '#ffffff',
  columns: 3,
  layout: 'grid',
  headingAlign: 'left',
  cardAlign: 'left',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  titleColor: '#1f2937',
  width: '100%',
  headingColor: '#111827',
};

const DEFAULT_CONTENT: VideoGalleryContent = {
  heading: '',
  items: [],
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function VideoGalleryBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as VideoGalleryData;
  const meta: VideoGalleryMeta = { ...DEFAULT_META, ...data.meta };
  const content: VideoGalleryContent = { ...DEFAULT_CONTENT, ...data.content };

  function updateContent(patch: Partial<VideoGalleryContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  function updateItem(index: number, patch: Partial<VideoGalleryItem>) {
    const updated = content.items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    updateContent({ items: updated });
  }

  function addItem() {
    const newItem: VideoGalleryItem = {
      title: '',
      subtitle: '',
      video_url: '',
      thumbnail_url: '',
    };
    updateContent({ items: [...content.items, newItem] });
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
          <strong>Align:</strong> {meta.headingAlign}
        </span>
        <span>
          <strong>Radius:</strong> {meta.cardBorderRadius}
        </span>
        <span>
          <strong>BG:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.bgColor }}
          />
        </span>
        <span>
          <strong>Card BG:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.cardBgColor }}
          />
        </span>
      </div>

      {/* Heading */}
      <div className="border border-gray-200 rounded p-4 space-y-4">
        <label className="flex flex-col gap-1">
          {label('Section Heading')}
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.heading}
            placeholder='e.g. "Videos"'
            onChange={(e) => updateContent({ heading: e.target.value })}
          />
        </label>

        {/* Items */}
        <div className="space-y-3">
          {label(`Videos (${content.items.length})`)}
          {content.items.map((item, index) => (
            <fieldset
              key={index}
              className="border border-gray-200 rounded p-3 space-y-3 relative"
            >
              <legend className="text-xs font-bold text-gray-700 px-1">
                Video {index + 1}
              </legend>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs font-bold"
                aria-label={`Remove video ${index + 1}`}
              >
                ✕
              </button>
              <label className="flex flex-col gap-1">
                {label('Title')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.title}
                  placeholder="Video title"
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('Subtitle')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.subtitle}
                  placeholder="Video subtitle"
                  onChange={(e) => updateItem(index, { subtitle: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('YouTube URL')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.video_url}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={(e) => updateItem(index, { video_url: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('Thumbnail URL (optional)')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.thumbnail_url}
                  placeholder="Leave blank — auto-fetched from YouTube URL"
                  onChange={(e) => updateItem(index, { thumbnail_url: e.target.value })}
                />
                <span className="text-[10px] text-blue-500">
                  YouTube thumbnails are auto-generated from the video URL. Only fill this to override.
                </span>
              </label>
            </fieldset>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full rounded border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            + Add Video
          </button>
        </div>
      </div>
    </div>
  );
}
