import { useState } from 'react';
import type {
  ProductHeroNewData,
  ProductHeroNewMeta,
  ProductHeroNewContent,
  ProductHeroNewPartnerLogo,
  ProductHighlightIcon,
  ProductHeroAdItem,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills all content values for ProductHeroNew
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

const DEFAULT_CONTENT: ProductHeroNewContent = {
  sku_badge: '',
  title: '',
  images: [],
  partner_logos: [],
  highlights: [],
  highlight_icons: [],
  show_highlight_icons: false,
  variant_options: [],
  variant_product_codes: {},
  product_codes: '',
  sample_price: '',
  sample_currency: 'USD',
  volume_price: '',
  volume_currency: 'USD',
  buy_now_url: '',
  download_url: '',
  download_label: 'DOWNLOAD',
  download_sub_label: '( Technical documents )',
  tags: [],
  hide_ad: false,
};

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

function textInput(
  value: string,
  onChange: (v: string) => void,
  placeholder?: string,
  type = 'text',
) {
  return (
    <input
      type={type}
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function sectionHeader(text: string) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 border-b border-gray-100 pb-1">
      {text}
    </p>
  );
}

// ── Images list ──────────────────────────────────────────────────────────────
function ImagesEditor({
  images,
  onChange,
}: {
  images: { image_url: string; image_alt: string }[];
  onChange: (v: { image_url: string; image_alt: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      {images.map((img, i) => (
        <div key={i} className="flex gap-2 items-start rounded border border-gray-200 p-2 bg-gray-50">
          <div className="flex-1 space-y-1">
            {textInput(img.image_url, (v) => {
              const next = [...images];
              next[i] = { ...img, image_url: v };
              onChange(next);
            }, 'Image URL')}
            {textInput(img.image_alt, (v) => {
              const next = [...images];
              next[i] = { ...img, image_alt: v };
              onChange(next);
            }, 'Alt text')}
          </div>
          <button
            type="button"
            onClick={() => onChange(images.filter((_, idx) => idx !== i))}
            className="text-red-500 hover:text-red-700 text-lg leading-none mt-1"
            title="Remove"
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...images, { image_url: '', image_alt: '' }])}
        className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500"
      >
        + Add Image
      </button>
    </div>
  );
}

// ── Partner logos list ───────────────────────────────────────────────────────
function LogosEditor({
  logos,
  onChange,
}: {
  logos: ProductHeroNewPartnerLogo[];
  onChange: (v: ProductHeroNewPartnerLogo[]) => void;
}) {
  return (
    <div className="space-y-2">
      {logos.map((logo, i) => (
        <div key={i} className="flex gap-2 items-start rounded border border-gray-200 p-2 bg-gray-50">
          <div className="flex-1 space-y-1">
            {textInput(logo.image_url, (v) => {
              const next = [...logos];
              next[i] = { ...logo, image_url: v };
              onChange(next);
            }, 'Logo image URL')}
            {textInput(logo.image_alt, (v) => {
              const next = [...logos];
              next[i] = { ...logo, image_alt: v };
              onChange(next);
            }, 'Alt text')}
            {textInput(logo.href ?? '', (v) => {
              const next = [...logos];
              next[i] = { ...logo, href: v };
              onChange(next);
            }, 'Link URL (optional)')}
          </div>
          <button
            type="button"
            onClick={() => onChange(logos.filter((_, idx) => idx !== i))}
            className="text-red-500 hover:text-red-700 text-lg leading-none mt-1"
            title="Remove"
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...logos, { image_url: '', image_alt: '', href: '' }])}
        className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500"
      >
        + Add Logo
      </button>
    </div>
  );
}

// ── Highlights bullet list ───────────────────────────────────────────────────
function ListEditor({
  items,
  placeholder,
  onChange,
  addLabel,
}: {
  items: string[];
  placeholder: string;
  onChange: (v: string[]) => void;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="text-red-500 hover:text-red-700 text-lg leading-none"
            title="Remove"
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500"
      >
        {addLabel}
      </button>
    </div>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────
export function ProductHeroNewBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ProductHeroNewData;
  const meta: ProductHeroNewMeta = { ...DEFAULT_META, ...data.meta };
  const content: ProductHeroNewContent = { ...DEFAULT_CONTENT, ...data.content };

  const [openSection, setOpenSection] = useState<string | null>('basic');

  function updateContent(patch: Partial<ProductHeroNewContent>) {
    onChange({ ...data, meta, content: { ...content, ...patch } });
  }

  function toggle(key: string) {
    setOpenSection((prev) => (prev === key ? null : key));
  }

  function accordion(key: string, title: string, body: React.ReactNode) {
    const open = openSection === key;
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggle(key)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700"
        >
          <span>{title}</span>
          <span className="text-gray-400">{open ? '▲' : '▼'}</span>
        </button>
        {open && <div className="p-3 space-y-3">{body}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <h3 className="text-sm font-bold text-gray-700">Product Hero New — Content</h3>

      {/* Meta colour summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>BG:</strong> <span className="inline-block h-3 w-3 rounded-sm border align-middle" style={{ background: meta.bgColor }} /></span>
        <span><strong>Buy Now:</strong> <span className="inline-block h-3 w-3 rounded-sm border align-middle" style={{ background: meta.buyNowBgColor }} /></span>
        <span><strong>Download:</strong> <span className="inline-block h-3 w-3 rounded-sm border align-middle" style={{ background: meta.downloadBgColor }} /></span>
      </div>

      {accordion('basic', '① SKU & Title', (
        <>
          <div>
            {label('SKU Badge (e.g. DepthVista_Helix_USB_IRD)')}
            {textInput(content.sku_badge, (v) => updateContent({ sku_badge: v }), 'DepthVista_Helix_USB_IRD')}
          </div>
          <div>
            {label('Product Title')}
            {textInput(content.title, (v) => updateContent({ title: v }), '1.2MP 3D Depth USB 3.2 Camera')}
          </div>
        </>
      ))}

      {accordion('images', '② Product Images', (
        <ImagesEditor
          images={content.images}
          onChange={(v) => updateContent({ images: v })}
        />
      ))}

      {accordion('logos', '③ Partner Logos', (
        <LogosEditor
          logos={content.partner_logos}
          onChange={(v) => updateContent({ partner_logos: v })}
        />
      ))}

      {accordion('highlights', '④ Highlights', (
        <ListEditor
          items={content.highlights}
          placeholder="e.g. Global Shutter Technology"
          onChange={(v) => updateContent({ highlights: v })}
          addLabel="+ Add Highlight"
        />
      ))}

      {accordion('variants', '⑤ Variant Options', (
        <>
          <ListEditor
            items={content.variant_options}
            placeholder="e.g. Monochrome, Color"
            onChange={(v) => {
              // When variant list changes, also clean up stale keys in variant_product_codes
              const kept = new Set(v);
              const existing = content.variant_product_codes ?? {};
              const cleaned = Object.fromEntries(
                Object.entries(existing).filter(([k]) => kept.has(k))
              );
              updateContent({ variant_options: v, variant_product_codes: cleaned });
            }}
            addLabel="+ Add Variant"
          />
          {content.variant_options.length > 0 && (
            <>
              {sectionHeader('NopCommerce Product IDs (for live pricing)')}
              <p className="text-[11px] text-gray-400 mb-2">
                Enter the NopProductId from the econ database for each variant.
                Leave blank to use static fallback price.
              </p>
              <div className="flex flex-col gap-2">
                {content.variant_options.map((variant) => (
                  <div key={variant} className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-xs text-gray-700 truncate" title={variant}>{variant}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      placeholder="Product ID (e.g. 281)"
                      value={(content.variant_product_codes ?? {})[variant] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        const updated = { ...(content.variant_product_codes ?? {}), [variant]: val };
                        if (!val) delete updated[variant];
                        // Rebuild product_codes from all entered IDs
                        const allCodes = content.variant_options
                          .map((opt) => updated[opt])
                          .filter(Boolean)
                          .join(',');
                        updateContent({ variant_product_codes: updated, product_codes: allCodes });
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ))}

      {accordion('pricing', '⑥ Pricing', (
        <>
          {sectionHeader('Sample Price')}
          <div className="grid grid-cols-2 gap-2">
            <div>
              {label('Currency')}
              {textInput(content.sample_currency, (v) => updateContent({ sample_currency: v }), 'USD')}
            </div>
            <div>
              {label('Price')}
              {textInput(content.sample_price, (v) => updateContent({ sample_price: v }), '599')}
            </div>
          </div>
          {sectionHeader('Volume Price (optional)')}
          <div className="grid grid-cols-2 gap-2">
            <div>
              {label('Currency')}
              {textInput(content.volume_currency ?? '', (v) => updateContent({ volume_currency: v }), 'USD')}
            </div>
            <div>
              {label('Price')}
              {textInput(content.volume_price ?? '', (v) => updateContent({ volume_price: v }), '149')}
            </div>
          </div>
        </>
      ))}

      {accordion('cta', '⑦ Buttons', (
        <>
          <div>
            {label('Buy Now URL')}
            {textInput(content.buy_now_url ?? '', (v) => updateContent({ buy_now_url: v }), 'https://')}
          </div>
          <div>
            {label('Download URL')}
            {textInput(content.download_url ?? '', (v) => updateContent({ download_url: v }), 'https://')}
          </div>
          <div>
            {label('Download Button Label')}
            {textInput(content.download_label, (v) => updateContent({ download_label: v }), 'DOWNLOAD')}
          </div>
          <div>
            {label('Download Sub-label (optional)')}
            {textInput(content.download_sub_label ?? '', (v) => updateContent({ download_sub_label: v }), '( Technical documents )')}
          </div>
        </>
      ))}

      {accordion('icons', '⑧ Highlight Icons (beside image)', (
        <>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              id="phn-show-icons"
              checked={content.show_highlight_icons ?? false}
              onChange={(e) => updateContent({ show_highlight_icons: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="phn-show-icons" className="text-xs font-medium text-gray-600">
              Show icon strip beside product image
            </label>
          </div>
          <HighlightIconsEditor
            icons={content.highlight_icons ?? []}
            onChange={(v) => updateContent({ highlight_icons: v })}
          />
        </>
      ))}

      {accordion('tags', '⑨ Tags', (
        <TagsEditor
          tags={content.tags ?? []}
          onChange={(v) => updateContent({ tags: v })}
        />
      ))}

      {accordion('ad', '⑩ Advertisement / Notification', (
        <>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="phn-hide-ad"
              checked={content.hide_ad ?? false}
              onChange={(e) => updateContent({ hide_ad: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="phn-hide-ad" className="text-xs font-medium text-gray-600">
              Hide advertisement on this page (overrides template-level ad)
            </label>
          </div>
          {!content.hide_ad && (
            <AdEditor
              ad={content.ad}
              onChange={(v) => updateContent({ ad: v })}
              adLabel="Page-level Ad (overrides template ad)"
            />
          )}
          <div className="mt-3 pt-3 border-t border-gray-200">
            {sectionHeader('Template-level Global Ad (applies to all pages using this template)')}
            <AdEditor
              ad={content.template_ad}
              onChange={(v) => updateContent({ template_ad: v })}
              adLabel="Global Ad"
            />
          </div>
        </>
      ))}
    </div>
  );
}

// ── Highlight icons list editor ─────────────────────────────────────────────
function HighlightIconsEditor({
  icons,
  onChange,
}: {
  icons: ProductHighlightIcon[];
  onChange: (v: ProductHighlightIcon[]) => void;
}) {
  return (
    <div className="space-y-2">
      {icons.map((icon, i) => (
        <div key={i} className="flex gap-2 items-start rounded border border-gray-200 p-2 bg-gray-50">
          <div className="flex-1 space-y-1">
            <input
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              value={icon.icon_url}
              placeholder="Icon image URL"
              onChange={(e) => {
                const next = [...icons];
                next[i] = { ...icon, icon_url: e.target.value };
                onChange(next);
              }}
            />
            <input
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              value={icon.icon_label}
              placeholder="Hover label (e.g. Global Shutter)"
              onChange={(e) => {
                const next = [...icons];
                next[i] = { ...icon, icon_label: e.target.value };
                onChange(next);
              }}
            />
            <input
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              value={icon.icon_alt ?? ''}
              placeholder="Alt text (optional, defaults to label)"
              onChange={(e) => {
                const next = [...icons];
                next[i] = { ...icon, icon_alt: e.target.value };
                onChange(next);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(icons.filter((_, idx) => idx !== i))}
            className="text-red-500 hover:text-red-700 text-lg leading-none mt-1"
            title="Remove"
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...icons, { icon_url: '', icon_label: '' }])}
        className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500"
      >
        + Add Icon
      </button>
    </div>
  );
}

// ── Tags editor ─────────────────────────────────────────────────────────────
function TagsEditor({
  tags,
  onChange,
}: {
  tags: { label: string; href?: string }[];
  onChange: (v: { label: string; href?: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      {tags.map((tag, i) => (
        <div key={i} className="flex gap-2 items-start rounded border border-gray-200 p-2 bg-gray-50">
          <div className="flex-1 space-y-1">
            <input
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              value={tag.label}
              placeholder="Tag label (e.g. Global Shutter Cameras)"
              onChange={(e) => {
                const next = [...tags];
                next[i] = { ...tag, label: e.target.value };
                onChange(next);
              }}
            />
            <input
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              value={tag.href ?? ''}
              placeholder="Link URL (optional)"
              onChange={(e) => {
                const next = [...tags];
                next[i] = { ...tag, href: e.target.value };
                onChange(next);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
            className="text-red-500 hover:text-red-700 text-lg leading-none mt-1"
            title="Remove"
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...tags, { label: '', href: '' }])}
        className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500"
      >
        + Add Tag
      </button>
    </div>
  );
}

// ── Ad / Notification editor ────────────────────────────────────────────────
function AdEditor({
  ad,
  onChange,
  adLabel,
}: {
  ad?: ProductHeroAdItem;
  onChange: (v: ProductHeroAdItem | undefined) => void;
  adLabel: string;
}) {
  const empty: ProductHeroAdItem = { image_url: '', image_alt: '' };
  const current = ad ?? empty;
  const isSet = ad !== undefined;

  if (!isSet) {
    return (
      <button
        type="button"
        onClick={() => onChange(empty)}
        className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500"
      >
        + Configure {adLabel}
      </button>
    );
  }

  function update(patch: Partial<ProductHeroAdItem>) {
    onChange({ ...current, ...patch });
  }

  return (
    <div className="space-y-2 rounded border border-gray-200 p-3 bg-gray-50">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-600">{adLabel}</span>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Ad Image URL *</label>
        <input
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          value={current.image_url}
          placeholder="https://... (banner image or full ad design)"
          onChange={(e) => update({ image_url: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Alt Text *</label>
        <input
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          value={current.image_alt}
          placeholder="Ad image description"
          onChange={(e) => update({ image_alt: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Click URL (optional)</label>
        <input
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          value={current.cta_link ?? ''}
          placeholder="https://..."
          onChange={(e) => update({ cta_link: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Title (for accessibility)</label>
        <input
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
          value={current.title ?? ''}
          placeholder="e.g. Launching Darsi Pro"
          onChange={(e) => update({ title: e.target.value })}
        />
      </div>
    </div>
  );
}
