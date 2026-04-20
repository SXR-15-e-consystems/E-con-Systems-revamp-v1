import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage } from '@/lib/api';

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
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

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { locale } = await searchParams;
  // locale is available for future localized content fetching
  // e.g. fetchPublicPage(slug, locale) — currently serves same page
  const page = await fetchPublicPage(slug);
  if (!page) {
    notFound();
  }

  const breadcrumbItems = [{ label: page.title }];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <BlockRenderer page={page} template={page.template_config} />
    </>
  );
}
