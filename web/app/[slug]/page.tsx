import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage, fetchTemplate, fetchNavigation } from '@/lib/api';
import { buildUiStrings } from '@/lib/ui-strings';
import type { UiStrings } from '@/lib/ui-strings';

export const revalidate = 0; // Always fetch fresh — product_name and other page-level fields must be current

const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://e-consystems.com';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await searchParams;
  const page = await fetchPublicPage(slug, locale);
  if (!page) return {};

  const canonical = page.canonical_url || `${SITE_BASE}/${page.slug}`;
  const ogImages = page.og_image_url ? [{ url: page.og_image_url }] : [];

  return {
    title: page.title,
    description: page.meta_description || undefined,
    alternates: { canonical },
    openGraph: {
      title: page.og_title || page.title,
      description: page.og_description || page.meta_description || undefined,
      url: canonical,
      type: (page.og_type as any) || 'website',
      images: ogImages,
    },
    twitter: {
      card: (page.twitter_card as any) || 'summary_large_image',
      title: page.og_title || page.title,
      description: page.og_description || page.meta_description || undefined,
      images: ogImages.map((i) => i.url),
      site: page.twitter_site || undefined,
    },
  };
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { locale } = await searchParams;

  // Fetch page + navigation in parallel (nav provides UI strings per locale)
  const [page, nav] = await Promise.all([
    fetchPublicPage(slug, locale),
    fetchNavigation(locale).catch(() => null),
  ]);

  if (!page) {
    notFound();
  }

  const effectiveLocale = locale ?? 'en';
  const uiStrings: UiStrings = buildUiStrings(nav?.locales?.[effectiveLocale]);

  // Dev diagnostic — shows in Next.js terminal (not browser)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SlugPage] slug=${slug}  product_name=${JSON.stringify(page.product_name)}`);
  }

  // Fetch template JS if this page uses a template
  let templateJsHead = '';
  let templateJsBody = '';
  if (page.template_id) {
    try {
      const tmpl = await fetchTemplate(page.template_id);
      templateJsHead = tmpl?.custom_js_head || '';
      templateJsBody = tmpl?.custom_js_body || '';
    } catch {
      // Graceful degradation — template JS is non-critical
    }
  }

  const breadcrumbItems = [{ label: page.title }];

  const schemaScript = page.schema_json?.trim() ? (
    <Script
      id={`schema-${page.slug}`}
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: page.schema_json }}
    />
  ) : null;

  const headScripts = [templateJsHead, page.custom_js_head || '']
    .map((s) => s.trim())
    .filter(Boolean);

  const bodyScripts = [templateJsBody, page.custom_js_body || '']
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      {schemaScript}
      {headScripts.map((js, i) => (
        <Script
          key={`head-js-${i}`}
          id={`page-head-script-${page.slug}-${i}`}
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: js }}
        />
      ))}
      <Breadcrumbs items={breadcrumbItems} />
      <BlockRenderer page={page} template={page.template_config} uiStrings={uiStrings} />
      {bodyScripts.map((js, i) => (
        <Script
          key={`body-js-${i}`}
          id={`page-body-script-${page.slug}-${i}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: js }}
        />
      ))}
    </>
  );
}
