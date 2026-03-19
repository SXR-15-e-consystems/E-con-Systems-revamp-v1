import type { RichTextData } from '@/types';

interface Props {
  data: Record<string, unknown>;
}

export function RichTextBlock({ data }: Props) {
  const richText = data as unknown as RichTextData;

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <div
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: richText.html ?? '' }}
      />
    </section>
  );
}
