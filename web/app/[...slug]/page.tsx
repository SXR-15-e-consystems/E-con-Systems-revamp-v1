import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound, redirect } from 'next/navigation';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';
import { fetchPublicPage, fetchTemplate, fetchNavigation, fetchPublicTaxonomy } from '@/lib/api';
import { buildUiStrings } from '@/lib/ui-strings';
import type { UiStrings } from '@/lib/ui-strings';

export const revalidate = 0; // Always fetch fresh — product_name and other page-level fields must be current

const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://e-consystems.com';

interface Props {
  // [...slug] gives an array: ['cameras', 'usb', 'see3cam'] or just ['see3cam']
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ locale?: string }>;
}

// The actual page slug (MongoDB key) is always the last segment.
// Taxonomy URLs add category prefixes in front: /{cat}/{sub}/{page-slug}
function resolvePageSlug(segments: string[]): string {
  return segments[segments.length - 1];
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await searchParams;
  const pageSlug = resolvePageSlug(slug);
  const [page, taxonomy] = await Promise.all([
    fetchPublicPage(pageSlug, locale),
    fetchPublicTaxonomy(pageSlug).catch(() => null),
  ]);
  if (!page) return {};

  // Always point canonical at the taxonomy effective_url when one exists,
  // so even the old-URL response advertises the correct canonical.
  const effectivePath = taxonomy?.effective_url || '/' + slug.join('/');
  const canonical = page.canonical_url || `${SITE_BASE}${effectivePath}`;

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
  const pageSlug = resolvePageSlug(slug);

  // Fetch page, navigation, and taxonomy in parallel
  const [page, nav, taxonomy] = await Promise.all([
    fetchPublicPage(pageSlug, locale),
    fetchNavigation(locale).catch(() => null),
    fetchPublicTaxonomy(pageSlug).catch(() => null),
  ]);

  if (!page) {
    notFound();
  }

  // Enforce canonical taxonomy URL.
  // ONLY these paths are valid for a page that has a taxonomy mapping:
  //   1. requestedPath === effective_url          → serve normally
  //   2. requestedPath === '/' + pageSlug (bare)  → redirect (old pre-taxonomy URL)
  //   3. requestedPath in previous_urls           → redirect (URL changed in CMS)
  //   Anything else (e.g. /wrong-category/slug)   → 404
  if (taxonomy?.effective_url) {
    const requestedPath = '/' + slug.join('/');
    if (requestedPath !== taxonomy.effective_url) {
      const bareSlugPath = '/' + pageSlug;
      const isBarePath = requestedPath === bareSlugPath;
      const isPreviousUrl = (taxonomy.previous_urls ?? []).includes(requestedPath);

      const localePrefix = locale ? `/${locale}` : '';
      if (isBarePath || isPreviousUrl) {
        // Known old path — redirect to current canonical URL
        redirect(`${localePrefix}${taxonomy.effective_url}`);
      } else {
        // Unknown / fabricated path — return 404
        notFound();
      }
    }
  }

  const effectiveLocale = locale ?? 'en';
  const uiStrings: UiStrings = buildUiStrings(nav?.locales?.[effectiveLocale]);

  // Dev diagnostic — shows in Next.js terminal (not browser)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SlugPage] path=/${slug.join('/')}  pageSlug=${pageSlug}  product_name=${JSON.stringify(page.product_name)}`);
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

  const breadcrumbItems =
    taxonomy?.effective_breadcrumb && taxonomy.effective_breadcrumb.length > 0
      ? taxonomy.effective_breadcrumb
      : [{ label: page.title }];

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
      <BlockRenderer page={page} template={page.template_config ?? undefined} uiStrings={uiStrings} />
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
