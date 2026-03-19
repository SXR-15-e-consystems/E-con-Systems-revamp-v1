import type { PageResponse } from '@/types';

import { API_BASE_URL, REVALIDATE_SECONDS } from './constants';

export async function fetchPublicPage(slug: string): Promise<PageResponse | null> {
  const cleanSlug = slug
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  const res = await fetch(`${API_BASE_URL}/public/pages/${cleanSlug}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as PageResponse;
}
