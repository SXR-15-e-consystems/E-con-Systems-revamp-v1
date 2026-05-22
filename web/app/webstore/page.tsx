import type { Metadata } from 'next';

import { fetchWebstoreProducts } from '@/lib/api';
import { WebstoreClient } from '@/components/Webstore/WebstoreClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Webstore | e-con Systems',
  description: 'Browse and purchase e-con Systems USB cameras, MIPI cameras, and embedded vision modules.',
};

export default async function WebstorePage({
  searchParams,
}: {
  searchParams: Promise<{ sku?: string }>;
}) {
  const [products, params] = await Promise.all([
    fetchWebstoreProducts().catch(() => []),
    searchParams,
  ]);

  const initialHighlightSku = params.sku ?? null;

  return (
    <main className="min-h-screen bg-slate-50">
      <WebstoreClient products={products} initialHighlightSku={initialHighlightSku} />
    </main>
  );
}
