import { useState } from 'react';
import type {
  HubHeroData,
  HubHeroMeta,
  HubHeroContent,
  HubHeroSlide,
  HubHeroDocument,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills title, description, images, CTA
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: HubHeroMeta = {
  bgColor: '#ffffff',
  titleColor: '#1a1a2e',
  titleFontSize: '32px',
  descriptionColor: '#374151',
  descriptionFontSize: '15px',
  imagePosition: 'right',
  contentWidth: '50%',
  mediaWidth: '50%',
  mediaMode: 'single',
  width: '100%',
  ctaBgColor: '#2563eb',
  ctaTextColor: '#ffffff',
  titleAlign: 'left',
  brandBadgePosition: 'below-image',
  brandBadgeWidth: '120px',
  brandBadgeHeight: '40px',
};

const DEFAULT_CONTENT: HubHeroContent = {
  title: '',
  description: '',
  image_url: '',
  image_alt: '',
  images: [],
  brand_badge_url: '',
  brand_badge_alt: '',
  cta_text: '',
  cta_link: '',
  cta_type: 'link',
  cta_contact_title: '',
  cta_documents: [],
};

const CTA_TYPES: { value: HubHeroContent['cta_type']; label: string }[] = [
  { value: 'link', label: 'Link (Navigate)' },
  { value: 'contact', label: 'Contact Us Popup' },
  { value: 'download', label: 'Download Popup' },
];

function label(text: string) {
  return <span className="block text-xs font-semibold text-gray-600 mb-1">{text}</span>;
}

export function HubHeroBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as HubHeroData;
  const meta: HubHeroMeta = { ...DEFAULT_META, ...data.meta };
  const content: HubHeroContent = { ...DEFAULT_CONTENT, ...data.content };
  const images: HubHeroSlide[] = content.images ?? [];
  const documents: HubHeroDocument[] = content.cta_documents ?? [];

  const [activeSlide, setActiveSlide] = useState(0);

  function updateContent(patch: Partial<HubHeroContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  // ── Slide helpers ──
  function addSlide() {
    const next = [...images, { image_url: '', image_alt: '' }];
    updateContent({ images: next });
    setActiveSlide(next.length - 1);
  }

  function removeSlide(idx: number) {
    const next = images.filter((_, i) => i !== idx);
    updateContent({ images: next });
    if (activeSlide >= next.length) setActiveSlide(Math.max(0, next.length - 1));
  }

  function updateSlide(idx: number, patch: Partial<HubHeroSlide>) {
    const next = images.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    updateContent({ images: next });
  }

  function moveSlide(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateContent({ images: next });
    setActiveSlide(target);
  }

  // ── Document helpers ──
  function addDocument() {
    updateContent({ cta_documents: [...documents, { name: '', url: '', file_type: '' }] });
  }

  function removeDocument(idx: number) {
    updateContent({ cta_documents: documents.filter((_, i) => i !== idx) });
  }

  function updateDocument(idx: number, patch: Partial<HubHeroDocument>) {
    const next = documents.map((d, i) => (i === idx ? { ...d, ...patch } : d));
    updateContent({ cta_documents: next });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Layout:</strong> image {meta.imagePosition}
        </span>
        <span>
          <strong>Ratio:</strong> {meta.contentWidth} / {meta.mediaWidth}
        </span>
        <span>
          <strong>Media:</strong> {meta.mediaMode}
        </span>
        <span>
          <strong>Title:</strong> {meta.titleFontSize}
        </span>
        <span>
          <strong>CTA:</strong>{' '}
          <span
            className="inline-block w-3 h-3 rounded-sm align-middle"
            style={{ backgroundColor: meta.ctaBgColor }}
          />
        </span>
      </div>

      {/* Title */}
      <div className="border border-gray-200 rounded p-4 space-y-4">
        <label className="flex flex-col gap-1">
          {label('Title *')}
          <input
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            value={content.title}
            placeholder='e.g. "20MP AR2020 High Resolution Camera"'
            onChange={(e) => updateContent({ title: e.target.value })}
          />
        </label>

        {/* Description (rich text HTML) */}
        <label className="flex flex-col gap-1">
          {label('Description (HTML)')}
          <textarea
            className="rounded border border-gray-300 px-3 py-2 text-sm font-mono min-h-[120px]"
            value={content.description}
            placeholder="<p>First paragraph describing the product…</p><p>Second paragraph…</p>"
            onChange={(e) => updateContent({ description: e.target.value })}
          />
          <span className="text-[10px] text-gray-400">
            Supports HTML tags: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;, &lt;ul&gt;,
            &lt;li&gt;, &lt;a&gt;
          </span>
        </label>

        {/* ── Media: single image or slider ── */}
        {meta.mediaMode === 'slider' ? (
          <fieldset className="border border-gray-200 rounded p-3 space-y-3">
            <legend className="text-xs font-bold text-gray-700 px-1">
              Image Slider ({images.length} slide{images.length !== 1 ? 's' : ''})
            </legend>

            {/* Slide tabs */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                      activeSlide === idx
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    Slide {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Active slide editor */}
            {images.length > 0 && images[activeSlide] && (
              <div className="space-y-2 border border-gray-100 rounded p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">
                    Slide {activeSlide + 1}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={activeSlide === 0}
                      onClick={() => moveSlide(activeSlide, -1)}
                      className="px-2 py-0.5 text-xs border rounded disabled:opacity-30 hover:bg-gray-100"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      disabled={activeSlide === images.length - 1}
                      onClick={() => moveSlide(activeSlide, 1)}
                      className="px-2 py-0.5 text-xs border rounded disabled:opacity-30 hover:bg-gray-100"
                    >
                      ▶
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(activeSlide)}
                      className="px-2 py-0.5 text-xs border rounded text-red-600 hover:bg-red-50"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>

                <label className="flex flex-col gap-1">
                  {label('Image URL *')}
                  <input
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                    value={images[activeSlide].image_url}
                    placeholder="https://…/slide-image.png"
                    onChange={(e) => updateSlide(activeSlide, { image_url: e.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  {label('Image Alt Text')}
                  <input
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                    value={images[activeSlide].image_alt}
                    placeholder="Slide image description"
                    onChange={(e) => updateSlide(activeSlide, { image_alt: e.target.value })}
                  />
                </label>

                {/* Thumbnail preview */}
                {images[activeSlide].image_url && (
                  <div className="flex justify-center p-2 bg-white rounded border">
                    <img
                      src={images[activeSlide].image_url}
                      alt={images[activeSlide].image_alt || 'Preview'}
                      className="max-h-32 object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={addSlide}
              className="w-full rounded border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add Slide
            </button>
          </fieldset>
        ) : (
          <fieldset className="border border-gray-200 rounded p-3 space-y-3">
            <legend className="text-xs font-bold text-gray-700 px-1">Product Image</legend>
            <label className="flex flex-col gap-1">
              {label('Image URL *')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={content.image_url}
                placeholder="https://…/product-hero.png"
                onChange={(e) => updateContent({ image_url: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1">
              {label('Image Alt Text')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={content.image_alt}
                placeholder="Product image description"
                onChange={(e) => updateContent({ image_alt: e.target.value })}
              />
            </label>
          </fieldset>
        )}

        {/* Brand badge */}
        <fieldset className="border border-gray-200 rounded p-3 space-y-3">
          <legend className="text-xs font-bold text-gray-700 px-1">Brand Badge (optional)</legend>
          <label className="flex flex-col gap-1">
            {label('Badge Image URL')}
            <input
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              value={content.brand_badge_url}
              placeholder="https://…/pregius-logo.png"
              onChange={(e) => updateContent({ brand_badge_url: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            {label('Badge Alt Text')}
            <input
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              value={content.brand_badge_alt}
              placeholder='e.g. "Pregius S"'
              onChange={(e) => updateContent({ brand_badge_alt: e.target.value })}
            />
          </label>
        </fieldset>

        {/* ── CTA ── */}
        <fieldset className="border border-gray-200 rounded p-3 space-y-3">
          <legend className="text-xs font-bold text-gray-700 px-1">CTA Button</legend>

          {/* CTA Type selector */}
          <div>
            {label('CTA Type')}
            <div className="flex gap-2">
              {CTA_TYPES.map(({ value, label: lbl }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateContent({ cta_type: value })}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    content.cta_type === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Button text — always shown */}
          <label className="flex flex-col gap-1">
            {label('Button Text')}
            <input
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              value={content.cta_text}
              placeholder={
                content.cta_type === 'contact'
                  ? 'e.g. "CONTACT US"'
                  : content.cta_type === 'download'
                    ? 'e.g. "DOWNLOAD"'
                    : 'e.g. "BUY NOW"'
              }
              onChange={(e) => updateContent({ cta_text: e.target.value })}
            />
          </label>

          {/* Link fields — only for link type */}
          {content.cta_type === 'link' && (
            <label className="flex flex-col gap-1">
              {label('Button Link')}
              <input
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                value={content.cta_link}
                placeholder="https://… or /contact"
                onChange={(e) => updateContent({ cta_link: e.target.value })}
              />
            </label>
          )}

          {/* Contact popup fields */}
          {content.cta_type === 'contact' && (
            <div className="space-y-2 border-t border-gray-200 pt-3 mt-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                Contact Form Popup Settings
              </span>
              <label className="flex flex-col gap-1">
                {label('Form Title')}
                <input
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                  value={content.cta_contact_title}
                  placeholder='e.g. "Request a Quote for AR2020"'
                  onChange={(e) => updateContent({ cta_contact_title: e.target.value })}
                />
                <span className="text-[10px] text-gray-400">
                  Custom heading displayed at the top of the contact popup form
                </span>
              </label>
            </div>
          )}

          {/* Download popup fields */}
          {content.cta_type === 'download' && (
            <div className="space-y-3 border-t border-gray-200 pt-3 mt-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                Download Documents ({documents.length})
              </span>

              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="border border-gray-100 rounded p-3 bg-gray-50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      Document {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDocument(idx)}
                      className="px-2 py-0.5 text-xs border rounded text-red-600 hover:bg-red-50"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <label className="flex flex-col gap-1">
                    {label('Document Name *')}
                    <input
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                      value={doc.name}
                      placeholder='e.g. "AR2020 Datasheet"'
                      onChange={(e) => updateDocument(idx, { name: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    {label('Document URL *')}
                    <input
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                      value={doc.url}
                      placeholder="https://…/datasheet.pdf"
                      onChange={(e) => updateDocument(idx, { url: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    {label('File Type')}
                    <input
                      className="rounded border border-gray-300 px-3 py-2 text-sm"
                      value={doc.file_type}
                      placeholder='e.g. "PDF", "ZIP", "DXF"'
                      onChange={(e) => updateDocument(idx, { file_type: e.target.value })}
                    />
                  </label>
                </div>
              ))}

              <button
                type="button"
                onClick={addDocument}
                className="w-full rounded border-2 border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add Document
              </button>
            </div>
          )}
        </fieldset>
      </div>
    </div>
  );
}
