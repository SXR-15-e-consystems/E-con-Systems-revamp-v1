import type { ImageOnlyData, ImageOnlyMeta, ImageOnlyContent } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — set image URL
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ImageOnlyMeta = {
  bgColor: '#ffffff',
  borderRadius: '0px',
  objectFit: 'cover',
  width: '100%',
  height: '100%',
};

export function ImageOnlyBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ImageOnlyData;
  const meta: ImageOnlyMeta = { ...DEFAULT_META, ...data.meta };
  const content: ImageOnlyContent = {
    image_url: data.content?.image_url ?? '',
    image_alt: data.content?.image_alt ?? '',
  };

  function updateContent(patch: Partial<ImageOnlyContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Fit:</strong> {meta.objectFit}</span>
        <span><strong>Radius:</strong> {meta.borderRadius}</span>
        <span><strong>Size:</strong> {meta.width} × {meta.height}</span>
      </div>

      {/* Image URL */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Image URL *</span>
        <input
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={content.image_url}
          placeholder="https://…"
          onChange={(e) => updateContent({ image_url: e.target.value })}
        />
      </label>

      {/* Alt Text */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Alt Text *</span>
        <input
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={content.image_alt}
          placeholder="Describe the image for accessibility"
          onChange={(e) => updateContent({ image_alt: e.target.value })}
        />
      </label>

      {/* Live Preview */}
      <div className="rounded border border-gray-200 bg-gray-50 p-3">
        <span className="text-xs font-semibold text-gray-500 mb-2 block">Preview</span>
        {content.image_url ? (
          <div
            className="w-full overflow-hidden"
            style={{
              borderRadius: meta.borderRadius,
              backgroundColor: meta.bgColor,
              height: 220,
            }}
          >
            <img
              src={content.image_url}
              alt={content.image_alt || 'Preview'}
              className="w-full h-full"
              style={{ objectFit: meta.objectFit }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-slate-400 bg-slate-100 rounded">
            No image — add URL above
          </div>
        )}
      </div>
    </div>
  );
}
