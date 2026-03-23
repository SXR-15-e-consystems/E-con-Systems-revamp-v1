import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage, fetchTemplate } from '@/lib/api';

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

  // If the page was created from a template, fetch the template
  // so GridLayout can render the proper 2D grid placement
  const template = page.template_id
    ? await fetchTemplate(page.template_id)
    : undefined;

  return <BlockRenderer page={page} template={template ?? undefined} />;
}
