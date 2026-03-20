import { notFound } from 'next/navigation';

import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const page = await fetchPublicPage('homepage');
  if (!page) {
    notFound();
  }

  let template = undefined;
  if (page.template_id) {
    const { API_BASE_URL, REVALIDATE_SECONDS } = await import('@/lib/constants');
    const res = await fetch(`${API_BASE_URL}/templates/${page.template_id}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (res.ok) {
      template = await res.json();
    }
  }

  return <BlockRenderer page={page} template={template} />;
}
