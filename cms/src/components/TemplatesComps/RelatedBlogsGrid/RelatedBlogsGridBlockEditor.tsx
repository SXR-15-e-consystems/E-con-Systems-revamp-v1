import type {
  RelatedBlogsGridData,
  RelatedBlogsGridMeta,
  RelatedBlogsGridContent,
  RelatedBlogItem,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills heading & blog items
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: RelatedBlogsGridMeta = {
  bgColor: '#f8fafc',
  cardBgColor: '#ffffff',
  cardBorderRadius: '8px',
  columns: 3,
  titleColor: '#1f2937',
  ctaBgColor: '#2563eb',
  ctaTextColor: '#ffffff',
  width: '100%',
  headingColor: '#111827',
  headingAlign: 'left',
  cardAlign: 'left',
};

const DEFAULT_CONTENT: RelatedBlogsGridContent = {
  heading: '',
  items: [],
};

const EMPTY_ITEM: RelatedBlogItem = {
  image_url: '',
  image_alt: '',
  title: '',
  excerpt: '',
  link: '',
  cta_text: 'Know More',
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function RelatedBlogsGridBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as RelatedBlogsGridData;
  const meta: RelatedBlogsGridMeta = { ...DEFAULT_META, ...data.meta };
  const content: RelatedBlogsGridContent = { ...DEFAULT_CONTENT, ...data.content };

  function updateContent(patch: Partial<RelatedBlogsGridContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  function updateItem(index: number, patch: Partial<RelatedBlogItem>) {
    const items = content.items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    updateContent({ items });
  }

  function addItem() {
    updateContent({ items: [...content.items, { ...EMPTY_ITEM }] });
  }

  function removeItem(index: number) {
    updateContent({ items: content.items.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Columns:</strong> {meta.columns}
        </span>
        <span>
          <strong>Radius:</strong> {meta.cardBorderRadius}
        </span>
        <span>
          <strong>CTA:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.ctaBgColor }}
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
            placeholder='e.g. "Related Blogs"'
            onChange={(e) => updateContent({ heading: e.target.value })}
          />
        </label>
      </div>

      {/* Blog items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Blog Items ({content.items.length})
          </span>
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1.5 rounded text-sm font-medium border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            + Add Blog
          </button>
        </div>

        {content.items.map((item, index) => (
          <fieldset
            key={index}
            className="border border-gray-200 rounded p-3 space-y-3"
          >
            <legend className="text-xs font-bold text-gray-700 px-1 flex items-center gap-2">
              Blog {index + 1}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700 text-[10px] font-medium"
              >
                Remove
              </button>
            </legend>

            <label className="flex flex-col gap-1">
              {label('Image URL *')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={item.image_url}
                placeholder="https://…/blog-image.jpg"
                onChange={(e) => updateItem(index, { image_url: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-1">
              {label('Image Alt Text')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={item.image_alt}
                placeholder="Blog image description"
                onChange={(e) => updateItem(index, { image_alt: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-1">
              {label('Title *')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={item.title}
                placeholder="Blog post title"
                onChange={(e) => updateItem(index, { title: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-1">
              {label('Excerpt')}
              <textarea
                className="rounded border border-gray-300 px-3 py-2 text-sm min-h-[60px]"
                value={item.excerpt}
                placeholder="Short description of the blog post…"
                onChange={(e) => updateItem(index, { excerpt: e.target.value })}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                {label('Link *')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.link}
                  placeholder="https://… or /blog/post-slug"
                  onChange={(e) => updateItem(index, { link: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1">
                {label('CTA Text')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={item.cta_text}
                  placeholder='e.g. "Know More"'
                  onChange={(e) => updateItem(index, { cta_text: e.target.value })}
                />
              </label>
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
