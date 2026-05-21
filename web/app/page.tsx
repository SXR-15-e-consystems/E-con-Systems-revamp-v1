import { notFound } from 'next/navigation';

import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage, fetchTemplate } from '@/lib/api';

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface Props {
  searchParams: Promise<{ locale?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const { locale } = await searchParams;
  // locale is available for future localized content fetching
  const page = await fetchPublicPage('homepage');
  if (!page) {
    notFound();
  }

  const template = page.template_id
    ? await fetchTemplate(page.template_id)
    : undefined;

  return <BlockRenderer page={page} template={template ?? undefined} />;
}
