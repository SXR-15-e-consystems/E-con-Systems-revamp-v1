import type { RichTextData } from '../../types';
import type { BlockEditorProps } from './BlockEditorRegistry';

export function RichTextBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as RichTextData;

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold">HTML Content</span>
      <textarea
        className="min-h-40 rounded border px-3 py-2 font-mono text-sm"
        value={data.html ?? ''}
        onChange={(event) => onChange({ ...data, html: event.target.value })}
      />
    </label>
  );
}
