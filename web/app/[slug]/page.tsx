import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage } from '@/lib/api';

export const revalidate = 60; // ISR: revalidate every 60 seconds

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

  // template_config is now embedded in the page response
  return <BlockRenderer page={page} template={page.template_config} />;
}
