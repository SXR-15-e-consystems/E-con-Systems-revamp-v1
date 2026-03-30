import { useState } from 'react';
import type {
  ProductDescriptionData,
  ProductDescriptionMeta,
  ProductDescriptionBullet,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills title + bullet points
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: ProductDescriptionMeta = {
  bgColor: '#ffffff',
  titleColor: '#1a1a2e',
  titleFontSize: '18px',
  titleFontWeight: '700',
  textColor: '#374151',
  textFontSize: '15px',
  bulletStyle: 'disc',
  bulletColor: '#374151',
  lineSpacing: '1.7',
  width: '100%',
};

const BULLET_CHAR: Record<string, string> = {
  disc: '•',
  circle: '◦',
  square: '▪',
  dash: '–',
  check: '✓',
};

export function ProductDescriptionBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as ProductDescriptionData;
  const meta: ProductDescriptionMeta = { ...DEFAULT_META, ...data.meta };
  const title: string = data.content?.title ?? '';
  const bullets: ProductDescriptionBullet[] = data.content?.bullets ?? [];
  const [newBullet, setNewBullet] = useState('');

  function updateContent(patch: Partial<ProductDescriptionData['content']>) {
    onChange({ ...data, content: { ...data.content, title, bullets, ...patch } });
  }

  function addBullet() {
    const trimmed = newBullet.trim();
    if (!trimmed) return;
    updateContent({ bullets: [...bullets, { text: trimmed }] });
    setNewBullet('');
  }

  function removeBullet(index: number) {
    updateContent({ bullets: bullets.filter((_, i) => i !== index) });
  }

  function updateBullet(index: number, text: string) {
    const updated = bullets.map((b, i) => (i === index ? { text } : b));
    updateContent({ bullets: updated });
  }

  function moveBullet(from: number, to: number) {
    if (to < 0 || to >= bullets.length) return;
    const updated = [...bullets];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    updateContent({ bullets: updated });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBullet();
    }
  }

  const bulletChar = BULLET_CHAR[meta.bulletStyle] ?? '•';

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Title:</strong> {meta.titleFontSize} / {meta.titleFontWeight}</span>
        <span><strong>Text:</strong> {meta.textFontSize}</span>
        <span><strong>Bullet:</strong> {bulletChar} ({meta.bulletStyle})</span>
      </div>

      {/* Title input */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Section Title *</span>
        <input
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={title}
          placeholder="e.g. Highlights, Features, Key Specifications…"
          onChange={(e) => updateContent({ title: e.target.value })}
        />
      </label>

      {/* Add bullet input */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Add Bullet Point</span>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            value={newBullet}
            placeholder="Type bullet text and press Enter or click Add"
            onChange={(e) => setNewBullet(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={addBullet}
            disabled={!newBullet.trim()}
            className="px-4 py-2 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Bullet list */}
      <div className="border border-gray-200 rounded p-3 space-y-2">
        <span className="text-xs font-semibold text-gray-600">
          Bullet Points ({bullets.length})
        </span>

        {bullets.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2">No bullet points added yet.</p>
        )}

        <div className="space-y-1.5">
          {bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-2 group">
              {/* Bullet icon */}
              <span
                className="flex-shrink-0 mt-2 text-sm leading-none"
                style={{ color: meta.bulletColor }}
              >
                {bulletChar}
              </span>

              {/* Text input */}
              <textarea
                className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm resize-none focus:border-blue-400 focus:outline-none"
                rows={1}
                value={bullet.text}
                onChange={(e) => updateBullet(i, e.target.value)}
                style={{ lineHeight: meta.lineSpacing }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />

              {/* Controls */}
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveBullet(i, i - 1)}
                  disabled={i === 0}
                  className="text-[10px] text-gray-400 hover:text-blue-600 disabled:opacity-30"
                  title="Move up"
                >▲</button>
                <button
                  type="button"
                  onClick={() => moveBullet(i, i + 1)}
                  disabled={i === bullets.length - 1}
                  className="text-[10px] text-gray-400 hover:text-blue-600 disabled:opacity-30"
                  title="Move down"
                >▼</button>
                <button
                  type="button"
                  onClick={() => removeBullet(i)}
                  className="text-[10px] text-red-400 hover:text-red-600"
                  title="Remove"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live preview */}
      {(title || bullets.length > 0) && (
        <div className="rounded border border-gray-200 bg-gray-50 p-3">
          <span className="text-xs font-semibold text-gray-500 mb-2 block">Live Preview</span>
          <div className="rounded p-4 overflow-hidden" style={{ backgroundColor: meta.bgColor }}>
            {title && (
              <h3
                className="mb-3"
                style={{
                  color: meta.titleColor,
                  fontSize: meta.titleFontSize,
                  fontWeight: Number(meta.titleFontWeight),
                }}
              >
                {title}
              </h3>
            )}
            {bullets.length > 0 && (
              <ul className="space-y-1 pl-0" style={{ listStyle: 'none' }}>
                {bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2"
                    style={{
                      fontSize: meta.textFontSize,
                      color: meta.textColor,
                      lineHeight: meta.lineSpacing,
                    }}
                  >
                    <span className="flex-shrink-0" style={{ color: meta.bulletColor }}>{bulletChar}</span>
                    <span className="break-words min-w-0">{b.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
