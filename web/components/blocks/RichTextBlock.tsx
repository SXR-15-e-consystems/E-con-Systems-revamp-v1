import type { RichTextData } from '@/types';
import { sanitizeHtml } from '@/lib/security';

interface Props {
  data: Record<string, unknown>;
}

export function RichTextBlock({ data }: Props) {
  const richText = data as unknown as RichTextData;
  const sanitizedHtml = sanitizeHtml(richText.html ?? '');

  return (
    <section className="w-full px-4 py-4">
      <div
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </section>
  );
}
