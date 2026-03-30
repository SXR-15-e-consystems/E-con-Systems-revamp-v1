import type { ProductImageSliderData, ProductImageSliderMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — layout & style metadata only, no content values
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ProductImageSliderMeta = {
  width: '100%',
  height: '480px',
  bgColor: '#ffffff',
  thumbnailPosition: 'left',
  thumbnailSize: 72,
  borderColor: '#2563eb',
};

type ThumbnailPosition = ProductImageSliderMeta['thumbnailPosition'];
const THUMB_POSITIONS: { value: ThumbnailPosition; label: string }[] = [
  { value: 'left', label: 'Left sidebar' },
  { value: 'bottom', label: 'Bottom row' },
];

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

function textInput(value: string, onChange: (v: string) => void, placeholder?: string) {
  return (
    <input
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ProductImageSliderTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ProductImageSliderData;
  const meta: ProductImageSliderMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<ProductImageSliderMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; style only. Images are added during page creation.
      </p>

      {/* Dimensions */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Dimensions</legend>
        <div className="grid grid-cols-2 gap-3">
          <label>
            {label('Width')}
            {textInput(meta.width, (v) => updateMeta({ width: v }), '100% or 600px')}
          </label>
          <label>
            {label('Height')}
            {textInput(meta.height, (v) => updateMeta({ height: v }), '480px or 60vh')}
          </label>
        </div>
        <label>
          {label('Background Colour')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.bgColor}
              onChange={(e) => updateMeta({ bgColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.bgColor, (v) => updateMeta({ bgColor: v }))}
          </div>
        </label>
      </fieldset>

      {/* Thumbnails */}
      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Thumbnails</legend>
        <label>
          {label('Thumbnail Position')}
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.thumbnailPosition}
            onChange={(e) => updateMeta({ thumbnailPosition: e.target.value as ThumbnailPosition })}
          >
            {THUMB_POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <label>
          {label('Thumbnail Size (px)')}
          <input
            type="number"
            min={40}
            max={120}
            step={4}
            value={meta.thumbnailSize}
            onChange={(e) => updateMeta({ thumbnailSize: Number(e.target.value) })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label>
          {label('Active Border Colour')}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={meta.borderColor}
              onChange={(e) => updateMeta({ borderColor: e.target.value })}
              className="h-8 w-12 cursor-pointer rounded border"
            />
            {textInput(meta.borderColor, (v) => updateMeta({ borderColor: v }))}
          </div>
        </label>
      </fieldset>
    </div>
  );
}
