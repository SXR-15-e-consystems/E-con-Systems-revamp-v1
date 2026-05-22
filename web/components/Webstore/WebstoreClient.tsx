'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { WebstoreProductItem, WebstoreCountryConfigResponse } from '@/types';
import { useLivePricing } from '@/hooks/useLivePricing';
import { WebstoreProductCard } from './WebstoreProductCard';
import { WebstoreFilters } from './WebstoreFilters';

interface Props {
  products: WebstoreProductItem[];
  initialHighlightSku?: string | null;
}

const DEFAULT_COUNTRY_CONFIG: WebstoreCountryConfigResponse = {
  country: 'US',
  purchase_mode: 'buy',
  cart_url: null,
  distributor: null,
  message: '',
};

export function WebstoreClient({ products, initialHighlightSku = null }: Props) {
  const [countryConfig, setCountryConfig] = useState<WebstoreCountryConfigResponse>(DEFAULT_COUNTRY_CONFIG);
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'buy' | 'contact'>('all');
  const [activeHighlight, setActiveHighlight] = useState<string | null>(initialHighlightSku);

  // Collect all nop_product_ids for live pricing
  const allProductIds = useMemo(() => {
    const ids = new Set<string>();
    products.forEach((p) => {
      p.order_rows.forEach((r) => {
        if (r.nop_product_id) ids.add(r.nop_product_id);
      });
    });
    return [...ids].join(',');
  }, [products]);

  const { priceMap } = useLivePricing(allProductIds);

  // Scroll to the highlighted card on mount
  useEffect(() => {
    if (!activeHighlight) return;
    const timer = setTimeout(() => {
      const el = document.querySelector('[data-highlight-target="true"]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount

  // Clear highlight when the user manually scrolls (wheel or touch)
  useEffect(() => {
    if (!activeHighlight) return;
    const dismiss = () => setActiveHighlight(null);
    window.addEventListener('wheel', dismiss, { once: true, passive: true });
    window.addEventListener('touchmove', dismiss, { once: true, passive: true });
    return () => {
      window.removeEventListener('wheel', dismiss);
      window.removeEventListener('touchmove', dismiss);
    };
  }, [activeHighlight]);

  // Geo detection + country config fetch
  useEffect(() => {
    let cancelled = false;

    async function detectCountry() {
      try {
        const geoRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
        if (!geoRes.ok) throw new Error('geo failed');
        const geoData = (await geoRes.json()) as { country_code?: string };
        const code = geoData.country_code?.toUpperCase();
        if (!code || cancelled) return;

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
        const cfgRes = await fetch(`${apiBase}/public/webstore/country-config?country=${encodeURIComponent(code)}`);
        if (!cfgRes.ok || cancelled) return;
        const cfg = (await cfgRes.json()) as WebstoreCountryConfigResponse;
        if (!cancelled) setCountryConfig(cfg);
      } catch {
        // silently fall back to US/buy defaults
      }
    }

    detectCountry();
    return () => { cancelled = true; };
  }, []);

  // Unique categories sorted
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => { if (p.webstore_category) cats.add(p.webstore_category); });
    return [...cats].sort();
  }, [products]);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }, []);

  // Filtered products
  const visibleProducts = useMemo(() => {
    const search = searchText.toLowerCase().trim();
    return products.filter((p) => {
      // Search
      if (search) {
        const haystack = [p.title, p.product_name, p.meta_description, p.webstore_category, ...p.order_rows.map((r) => r.part_no)].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      // Category
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.webstore_category)) return false;
      // Availability — a product "matches buy" if any row would show Buy Now
      if (availabilityFilter !== 'all') {
        const hasMatchingRow = p.order_rows.some((row) => {
          const live = priceMap[row.nop_product_id];
          if (live?.purchaseType === 'contact_us') return availabilityFilter === 'contact';
          return availabilityFilter === countryConfig.purchase_mode;
        });
        if (!hasMatchingRow) return false;
      }
      return true;
    });
  }, [products, searchText, selectedCategories, availabilityFilter, priceMap, countryConfig.purchase_mode]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">e-con Systems Webstore</h1>
        <p className="mt-2 text-base text-slate-500">
          Browse our full range of USB cameras, MIPI cameras, and embedded vision modules.
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <WebstoreFilters
              categories={categories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              searchText={searchText}
              onSearchChange={setSearchText}
              availabilityFilter={availabilityFilter}
              onAvailabilityChange={setAvailabilityFilter}
              totalVisible={visibleProducts.length}
              totalAll={products.length}
            />
          </div>
        </aside>

        {/* Mobile filters */}
        <div className="lg:hidden mb-4 w-full">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <WebstoreFilters
              categories={categories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              searchText={searchText}
              onSearchChange={setSearchText}
              availabilityFilter={availabilityFilter}
              onAvailabilityChange={setAvailabilityFilter}
              totalVisible={visibleProducts.length}
              totalAll={products.length}
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {visibleProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12 mb-4 opacity-30">
                <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
              </svg>
              <p className="text-base font-semibold">No products match your filters</p>
              <p className="text-sm mt-1">Try adjusting your search or category selection</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {visibleProducts.map((product) => (
                <WebstoreProductCard
                  key={product.slug}
                  product={product}
                  priceMap={priceMap}
                  purchaseMode={countryConfig.purchase_mode}
                  distributor={countryConfig.distributor}
                  country={countryConfig.country}
                  highlightSku={activeHighlight}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
