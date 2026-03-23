import { notFound } from 'next/navigation';

import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage, fetchTemplate } from '@/lib/api';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const page = await fetchPublicPage('homepage');
  if (!page) {
    notFound();
  }

  const template = page.template_id
    ? await fetchTemplate(page.template_id)
    : undefined;

  return <BlockRenderer page={page} template={template} />;
}
