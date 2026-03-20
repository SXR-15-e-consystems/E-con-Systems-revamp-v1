import type { BlockEnvelope } from '../../types';
import { getBlockEditor } from '../blocks/BlockEditorRegistry';
import { TRAY_COMPONENTS } from '../canvas/ComponentTray';

interface ContentInjectionModalProps {
  block: BlockEnvelope;
  label?: string;
  onClose: () => void;
  onSave: (updatedBlock: BlockEnvelope) => void;
}

export function ContentInjectionModal({ block, label, onClose, onSave }: ContentInjectionModalProps) {
  const Editor = getBlockEditor(block.type);
  const def = TRAY_COMPONENTS.find((c) => c.type === block.type);

  // Local state for the editable content
  // Note: block.data contains both { meta: {...}, content: {...} } 
  // We only pass content to L2 editors. But since Hero/RichText don't use this envelope yet,
  // we do a generic pass-through for now, and handle envelope saving.

  const handleSave = () => {
    // If we were using local state for the block, we'd apply it here.
    // For now, since L2 editors mutate the block directly via onChange, we just pass the block back.
    // We mark it as filled.
    onSave({
      ...block,
      content_status: 'filled',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-[2px]">
      <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl shadow-inner">
              {def?.icon ?? '📝'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {label || def?.label || block.type}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Add content for this layout block
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {Editor ? (
              <Editor
                block={block}
                onChange={(newData: Record<string, any>) => {
                  // The Editor might pass back { meta, content } OR just flat properties (Hero/RichText legacy)
                  // It's mutating the block object here via reference or we need local state tracking.
                  // For simplicity, we just mutate block.data (React state will update via parent if needed).
                  Object.assign(block.data, newData);
                }}
              />
            ) : (
              <div className="py-12 text-center">
                <p className="text-slate-500">No content editor available for {block.type}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <button
            className="rounded-md px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleSave}
            type="button"
          >
            Save Content
          </button>
        </div>
      </div>
    </div>
  );
}
