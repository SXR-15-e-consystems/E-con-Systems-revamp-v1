import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPublicPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.meta_description,
    openGraph: page.og_image_url ? { images: [page.og_image_url] } : undefined,
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const page = await fetchPublicPage(slug);
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
