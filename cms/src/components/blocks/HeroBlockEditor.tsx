import type { HeroData } from '../../types';
import type { BlockEditorProps } from './BlockEditorRegistry';

export function HeroBlockEditor({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as HeroData;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Title</span>
        <input
          className="rounded border px-3 py-2"
          value={data.title ?? ''}
          onChange={(event) => onChange({ ...data, title: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Subtitle</span>
        <input
          className="rounded border px-3 py-2"
          value={data.subtitle ?? ''}
          onChange={(event) => onChange({ ...data, subtitle: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 md:col-span-2">
        <span className="text-sm font-semibold">Image URL</span>
        <input
          className="rounded border px-3 py-2"
          value={data.image_url ?? ''}
          onChange={(event) => onChange({ ...data, image_url: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">CTA Text</span>
        <input
          className="rounded border px-3 py-2"
          value={data.cta_text ?? ''}
          onChange={(event) => onChange({ ...data, cta_text: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">CTA Link</span>
        <input
          className="rounded border px-3 py-2"
          value={data.cta_link ?? ''}
          onChange={(event) => onChange({ ...data, cta_link: event.target.value })}
        />
      </label>
    </div>
  );
}
