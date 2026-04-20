import type { PageResponse } from '@/types';
import type { Template } from '@/types/template';
import type { NavigationPublicResponse } from '@/types/navigation';

import { API_BASE_URL, REVALIDATE_SECONDS } from './constants';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchPublicPagesBatch(slugs: string[]): Promise<PageResponse[]> {
  if (slugs.length === 0) return [];
  const joined = slugs.map(encodeURIComponent).join(',');
  const endpoint = `${API_BASE_URL}/public/pages/batch?slugs=${joined}`;

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      throw new ApiError(
        `Failed to batch-fetch pages`,
        res.status,
        endpoint,
      );
    }

    return (await res.json()) as PageResponse[];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      `Network error batch-fetching pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      endpoint,
    );
  }
}

export async function fetchPublicPage(slug: string): Promise<PageResponse | null> {
  const cleanSlug = slug
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  const endpoint = `${API_BASE_URL}/public/pages/${cleanSlug}`;

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new ApiError(
        `Failed to fetch page "${slug}"`,
        res.status,
        endpoint,
      );
    }

    return (await res.json()) as PageResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors, JSON parse errors, etc.
    throw new ApiError(
      `Network error fetching page "${slug}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      endpoint,
    );
  }
}

export async function fetchTemplate(templateId: string): Promise<Template | null> {
  const endpoint = `${API_BASE_URL}/cms/templates/${encodeURIComponent(templateId)}`;

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new ApiError(
        `Failed to fetch template "${templateId}"`,
        res.status,
        endpoint,
      );
    }

    return (await res.json()) as Template;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors, JSON parse errors, etc.
    throw new ApiError(
      `Network error fetching template "${templateId}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      endpoint,
    );
  }
}

export async function fetchNavigation(): Promise<NavigationPublicResponse | null> {
  const endpoint = `${API_BASE_URL}/public/navigation`;

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new ApiError(
        'Failed to fetch navigation',
        res.status,
        endpoint,
      );
    }

    return (await res.json()) as NavigationPublicResponse;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      `Network error fetching navigation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      endpoint,
    );
  }
}
