import { notFound } from 'next/navigation';

import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const page = await fetchPublicPage('homepage');
  if (!page) {
    notFound();
  }

  return <BlockRenderer blocks={page.blocks} />;
}
