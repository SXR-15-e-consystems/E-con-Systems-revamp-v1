'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { API_BASE_URL } from '@/lib/constants';
import type { ProductPriceResult } from '@/types/templates';

export interface LivePricingState {
  /** Map of NopProductId string → price result. Empty until fetch completes. */
  priceMap: Record<string, ProductPriceResult>;
  loading: boolean;
  error: string | null;
}

/**
 * useLivePricing — fetches real-time pricing from MS SQL via the backend.
 *
 * Pass `productCodes` as a comma-separated string of NopProductId values
 * (e.g. "281,1432").  All variants are fetched in a single request on mount;
 * switching variants is then a pure in-memory lookup — no additional requests.
 *
 * When `productCodes` is empty/undefined the hook stays idle and returns an
 * empty priceMap, allowing the component to fall back to static CMS prices.
 */
export function useLivePricing(productCodes: string | undefined): LivePricingState {
  const [priceMap, setPriceMap] = useState<Record<string, ProductPriceResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPricing = useCallback(async (codes: string) => {
    const trimmed = codes.trim();
    if (!trimmed) return;

    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/public/product-pricing?ids=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Record<string, unknown>;
        const msg =
          (body?.error as Record<string, unknown> | undefined)?.message as string | undefined
          ?? 'Pricing unavailable';
        throw new Error(msg);
      }

      const data = await res.json() as { products: Record<string, ProductPriceResult> };
      setPriceMap(data.products ?? {});
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load pricing');
    } finally {
      setLoading(false);
    }
  }, []);

  // Normal mount / dependency change — fetch on load and whenever codes change
  useEffect(() => {
    if (productCodes) {
      void fetchPricing(productCodes);
    }
    return () => abortRef.current?.abort();
  }, [productCodes, fetchPricing]);

  // bfcache (Back/Forward Cache) restoration fix.
  // When the browser uses the back/forward button it may restore the page from
  // a frozen snapshot (bfcache) instead of remounting the component. In that
  // case the useEffect above never re-runs and priceMap stays as it was when
  // the page was frozen — possibly empty if pricing hadn't finished loading yet.
  // The `pageshow` event fires with event.persisted === true exactly in this
  // scenario, so we force a fresh pricing fetch here.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && productCodes) {
        void fetchPricing(productCodes);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [productCodes, fetchPricing]);

  return { priceMap, loading, error };
}
