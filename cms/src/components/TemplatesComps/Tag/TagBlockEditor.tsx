import { useState } from 'react';
import type { TagData, TagMeta, TagItem } from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L2: Block Content Editor — fills title + tag items
// meta{} is shown read-only for context; only content{} is editable here
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: TagMeta = {
  layout: 'grid',
  bgColor: '#ffffff',
  tagBgColor: '#f1f5f9',
  tagTextColor: '#334155',
  tagBorderRadius: '9999px',
  showIcon: true,
  width: '100%',
};

export function TagBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as TagData;
  const meta: TagMeta = { ...DEFAULT_META, ...data.meta };
  const title: string = data.content?.title ?? '';
  const tags: TagItem[] = data.content?.tags ?? [];
  const [newTag, setNewTag] = useState('');

  function updateContent(patch: Partial<TagData['content']>) {
    onChange({ ...data, content: { ...data.content, title, tags, ...patch } });
  }

  function addTag() {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    updateContent({ tags: [...tags, { label: trimmed }] });
    setNewTag('');
  }

  function removeTag(index: number) {
    updateContent({ tags: tags.filter((_, i) => i !== index) });
  }

  function updateTag(index: number, patch: Partial<TagItem>) {
    const updated = tags.map((t, i) => (i === index ? { ...t, ...patch } : t));
    updateContent({ tags: updated });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }

  return (
    <div className="space-y-4 p-4">
      {/* Read-only meta summary */}
      <div className="rounded bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 flex flex-wrap gap-3">
        <span><strong>Layout:</strong> {meta.layout}</span>
        <span><strong>Width:</strong> {meta.width}</span>
        <span>
          <strong>Tag style:</strong>{' '}
          <span
            className="inline-block px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: meta.tagBgColor,
              color: meta.tagTextColor,
              borderRadius: meta.tagBorderRadius,
            }}
          >
            sample
          </span>
        </span>
      </div>

      {/* Title */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Section Title *</span>
        <input
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          value={title}
          placeholder="e.g. Tags, Targeted Applications, Categories…"
          onChange={(e) => updateContent({ title: e.target.value })}
        />
      </label>

      {/* Add tag input */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Add Tag</span>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            value={newTag}
            placeholder="Type tag name and press Enter or click Add"
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!newTag.trim()}
            className="px-4 py-2 rounded text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Tag list */}
      <div className="border border-gray-200 rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">
            Tags ({tags.length})
          </span>
        </div>

        {tags.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2">No tags added yet. Use the input above to add tags.</p>
        )}

        <div className={meta.layout === 'list' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
          {tags.map((tag, i) => {
            const hasLink = Boolean(tag.href);
            const pillBg = hasLink ? '#d5e8ff' : meta.tagBgColor;
            return (
              <div
                key={i}
                className="group flex flex-col gap-1 rounded-lg border border-gray-100 p-2"
                style={{ backgroundColor: pillBg }}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    className="bg-transparent text-sm font-medium outline-none min-w-[60px] flex-1"
                    style={{ color: meta.tagTextColor }}
                    value={tag.label}
                    placeholder="Tag label"
                    onChange={(e) => updateTag(i, { label: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs opacity-50 hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                    title="Remove tag"
                  >
                    ×
                  </button>
                </div>
                <input
                  className="bg-white/70 rounded border border-gray-200 px-2 py-1 text-xs outline-none w-full"
                  value={tag.href ?? ''}
                  placeholder="Link URL (optional) e.g. /products/camera"
                  onChange={(e) => updateTag(i, { href: e.target.value || undefined })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      {tags.length > 0 && (
        <div className="rounded border border-gray-200 bg-gray-50 p-3">
          <span className="text-xs font-semibold text-gray-500 mb-2 block">Live Preview</span>
          <div className="rounded p-4" style={{ backgroundColor: meta.bgColor }}>
            {title && meta.layout !== 'row' && (
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                {meta.showIcon && <span className="text-blue-600">▦</span>}
                {title}
              </h3>
            )}
            <div className={meta.layout === 'row' ? 'flex flex-wrap items-center gap-2' : meta.layout === 'grid' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}>
              {meta.layout === 'row' && title && (
                <span className="text-xs font-medium text-gray-600 mr-1">{title}</span>
              )}
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-block px-4 py-1.5 text-sm font-medium"
                  style={{
                    backgroundColor: tag.href ? '#d5e8ff' : meta.tagBgColor,
                    color: meta.tagTextColor,
                    borderRadius: meta.tagBorderRadius,
                  }}
                >
                  {tag.label}
                  {tag.href && <span className="ml-1 text-[10px] text-blue-500">🔗</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
