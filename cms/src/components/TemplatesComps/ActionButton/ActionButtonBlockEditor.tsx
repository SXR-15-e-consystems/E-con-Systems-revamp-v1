import type {
  ActionButtonData,
  ActionButtonMeta,
  ActionButtonContent,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';
import { IconPreview } from './ActionButtonTemplateConfig';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills button text, sub-text & URL
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ActionButtonMeta = {
  bgColor: '#2952cc',
  textColor: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  subTextColor: '#1f2937',
  subTextFontSize: '13px',
  borderRadius: '6px',
  paddingX: '28px',
  paddingY: '12px',
  icon: 'cart',
  iconPosition: 'left',
  width: 'auto',
  align: 'left',
};

export function ActionButtonBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ActionButtonData;
  const meta: ActionButtonMeta = { ...DEFAULT_META, ...data.meta };
  const content: ActionButtonContent = {
    buttonText: data.content?.buttonText ?? '',
    subText: data.content?.subText ?? '',
    url: data.content?.url ?? '',
    openInNewTab: data.content?.openInNewTab ?? false,
  };

  function updateContent(patch: Partial<ActionButtonContent>) {
    onChange({ ...data, content: { ...content, ...patch } });
  }

  const iconChar: Record<string, string> = {
    cart: '🛒', download: '⬇', 'arrow-right': '→', phone: '📞', mail: '✉', external: '↗',
  };

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span>
          <strong>Colour:</strong>{' '}
          <span className="inline-block h-3 w-3 rounded-sm border align-middle" style={{ backgroundColor: meta.bgColor }} />
        </span>
        <span><strong>Font:</strong> {meta.fontSize} / {meta.fontWeight}</span>
        <span><strong>Icon:</strong> {meta.icon !== 'none' ? `${iconChar[meta.icon] ?? ''} ${meta.icon}` : 'none'}</span>
        <span><strong>Radius:</strong> {meta.borderRadius}</span>
      </div>

      {/* Button Text */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Button Text *</span>
        <input
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={content.buttonText}
          placeholder="e.g. Contact Us, Documents…"
          onChange={(e) => updateContent({ buttonText: e.target.value })}
        />
      </label>

      {/* Sub-text */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Sub-text</span>
        <input
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={content.subText}
          placeholder="e.g. Contact Us to Buy, Download Documents…"
          onChange={(e) => updateContent({ subText: e.target.value })}
        />
      </label>

      {/* URL */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Link URL</span>
        <input
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={content.url}
          placeholder="https://…"
          onChange={(e) => updateContent({ url: e.target.value })}
        />
      </label>

      {/* Open in new tab */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={content.openInNewTab}
          onChange={(e) => updateContent({ openInNewTab: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <span className="text-xs text-gray-600">Open in new tab</span>
      </label>

      {/* Live preview */}
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <span className="text-xs font-semibold text-gray-500 mb-3 block">Live Preview</span>
        <div style={{ textAlign: meta.align }}>
          <div className="inline-flex flex-col items-center gap-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-2 cursor-default"
              style={{
                backgroundColor: meta.bgColor,
                color: meta.textColor,
                fontSize: meta.fontSize,
                fontWeight: Number(meta.fontWeight),
                borderRadius: meta.borderRadius,
                padding: `${meta.paddingY} ${meta.paddingX}`,
                width: meta.width === 'auto' ? undefined : meta.width,
                border: 'none',
              }}
            >
              {meta.icon !== 'none' && meta.iconPosition === 'left' && (
                <IconPreview icon={meta.icon} color={meta.textColor} />
              )}
              <span>{content.buttonText || 'Button Text'}</span>
              {meta.icon !== 'none' && meta.iconPosition === 'right' && (
                <IconPreview icon={meta.icon} color={meta.textColor} />
              )}
            </button>
            {content.subText && (
              <span style={{ color: meta.subTextColor, fontSize: meta.subTextFontSize }}>
                {content.subText}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
