import type { ProductHeroNewData, ProductHeroNewMeta } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config Editor — colours & sizing for ProductHeroNew
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ProductHeroNewMeta = {
  bgColor: '#ffffff',
  badgeBgColor: '#1f2937',
  badgeTextColor: '#ffffff',
  titleColor: '#111827',
  highlightsHeadingColor: '#1f2937',
  highlightBulletColor: '#16a34a',
  imageBgColor: '#f8fafc',
  buyNowBgColor: '#16a34a',
  buyNowTextColor: '#ffffff',
  downloadBgColor: '#1f2937',
  downloadTextColor: '#ffffff',
  partnerLogosHeight: '32px',
  priceLabelColor: '#6b7280',
  priceValueColor: '#1f2937',
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

function colorInput(value: string, onChange: (v: string) => void) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border border-gray-300 p-0"
      />
      <input
        className="w-24 rounded border border-gray-300 px-2 py-1 text-xs font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
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

export function ProductHeroNewTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ProductHeroNewData;
  const meta: ProductHeroNewMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<ProductHeroNewMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  return (
    <div className="space-y-5 p-4">
      <h3 className="text-sm font-bold text-gray-700">Product Hero New — Layout</h3>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Background</p>
        <div className="grid grid-cols-2 gap-3">
          <div>{label('Page BG')}{colorInput(meta.bgColor, (v) => updateMeta({ bgColor: v }))}</div>
          <div>{label('Image Area BG')}{colorInput(meta.imageBgColor, (v) => updateMeta({ imageBgColor: v }))}</div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">SKU Badge</p>
        <div className="grid grid-cols-2 gap-3">
          <div>{label('Badge BG')}{colorInput(meta.badgeBgColor, (v) => updateMeta({ badgeBgColor: v }))}</div>
          <div>{label('Badge Text')}{colorInput(meta.badgeTextColor, (v) => updateMeta({ badgeTextColor: v }))}</div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Title & Highlights</p>
        <div className="grid grid-cols-2 gap-3">
          <div>{label('Title Colour')}{colorInput(meta.titleColor, (v) => updateMeta({ titleColor: v }))}</div>
          <div>{label('Highlights Heading')}{colorInput(meta.highlightsHeadingColor, (v) => updateMeta({ highlightsHeadingColor: v }))}</div>
          <div>{label('Bullet Colour')}{colorInput(meta.highlightBulletColor, (v) => updateMeta({ highlightBulletColor: v }))}</div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Prices</p>
        <div className="grid grid-cols-2 gap-3">
          <div>{label('Label Colour')}{colorInput(meta.priceLabelColor, (v) => updateMeta({ priceLabelColor: v }))}</div>
          <div>{label('Value Colour')}{colorInput(meta.priceValueColor, (v) => updateMeta({ priceValueColor: v }))}</div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Buttons</p>
        <div className="grid grid-cols-2 gap-3">
          <div>{label('Buy Now BG')}{colorInput(meta.buyNowBgColor, (v) => updateMeta({ buyNowBgColor: v }))}</div>
          <div>{label('Buy Now Text')}{colorInput(meta.buyNowTextColor, (v) => updateMeta({ buyNowTextColor: v }))}</div>
          <div>{label('Download BG')}{colorInput(meta.downloadBgColor, (v) => updateMeta({ downloadBgColor: v }))}</div>
          <div>{label('Download Text')}{colorInput(meta.downloadTextColor, (v) => updateMeta({ downloadTextColor: v }))}</div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Partner Logos</p>
        <div>
          {label('Logo Height')}
          {textInput(meta.partnerLogosHeight, (v) => updateMeta({ partnerLogosHeight: v }), '32px')}
        </div>
      </section>
    </div>
  );
}
