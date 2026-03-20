import type {
  RelatedContentData,
  RelatedContentMeta,
  RelatedContentType,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config — layout & style only
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

const CONTENT_TYPES: RelatedContentType[] = ['Blog', 'Video', 'Product', 'CaseStudy'];
const DISPLAY_COUNTS = [1, 2, 3, 4] as const;

export function RelatedContentTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as RelatedContentData;
  const meta: RelatedContentMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<RelatedContentMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  function updateCardStyle(patch: Partial<RelatedContentMeta['cardStyle']>) {
    updateMeta({ cardStyle: { ...meta.cardStyle, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only.
      </p>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Content Type</legend>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Type</span>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.contentType}
            onChange={(e) => updateMeta({ contentType: e.target.value as RelatedContentType })}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Items to display</span>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.displayCount}
            onChange={(e) => updateMeta({ displayCount: Number(e.target.value) as 1 | 2 | 3 | 4 })}
          >
            {DISPLAY_COUNTS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Container width</span>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.width}
            onChange={(e) => updateMeta({ width: e.target.value })}
            placeholder="100% or 1200px"
          />
        </label>
      </fieldset>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Visibility</legend>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={meta.sliderMode}
            onChange={(e) => updateMeta({ sliderMode: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm">Slider mode</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={meta.showTitle}
            onChange={(e) => updateMeta({ showTitle: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm">Show title on cards</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={meta.showCTA}
            onChange={(e) => updateMeta({ showCTA: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm">Show CTA button</span>
        </label>
        {meta.showCTA && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Default CTA label</span>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.ctaLabel}
              onChange={(e) => updateMeta({ ctaLabel: e.target.value })}
              placeholder="Read More"
            />
          </label>
        )}
      </fieldset>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Card Style</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Card BG</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={meta.cardStyle.bgColor}
                onChange={(e) => updateCardStyle({ bgColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border"
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-2 text-xs"
                value={meta.cardStyle.bgColor}
                onChange={(e) => updateCardStyle({ bgColor: e.target.value })}
              />
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Text Colour</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={meta.cardStyle.textColor}
                onChange={(e) => updateCardStyle({ textColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border"
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-2 text-xs"
                value={meta.cardStyle.textColor}
                onChange={(e) => updateCardStyle({ textColor: e.target.value })}
              />
            </div>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Border Radius</span>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.cardStyle.borderRadius}
            onChange={(e) => updateCardStyle({ borderRadius: e.target.value })}
            placeholder="8px"
          />
        </label>
      </fieldset>
    </div>
  );
}
