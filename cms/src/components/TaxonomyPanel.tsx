/**
 * TaxonomyPanel — collapsible right-panel section for the Page Editor.
 * Handles category selection, filter tagging, URL override, and breadcrumb preview.
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchCategories,
  fetchFilters,
  fetchProductTaxonomy,
  upsertProductTaxonomy,
  regenerateProductTaxonomy,
  TaxonomyApiError,
  type TaxonomyCategory,
  type SubCategory1,
  type SubCategory2,
  type ProductCategoryEntry,
  type ProductTaxonomyUpdate,
  type TaxonomyFilter,
} from '../api/taxonomyEndpoints';

interface Props {
  pageSlug: string;
  productName: string;
  pageId?: string;
}

export function TaxonomyPanel({ pageSlug, productName, pageId }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: allCategories } = useQuery({
    queryKey: ['taxonomy-categories'],
    queryFn: fetchCategories,
    enabled: open,
  });

  const { data: allFilters } = useQuery({
    queryKey: ['taxonomy-filters'],
    queryFn: fetchFilters,
    enabled: open,
  });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['taxonomy-product', pageSlug],
    queryFn: () => fetchProductTaxonomy(pageSlug),
    enabled: open,
    retry: (count, err: unknown) => {
      if (err instanceof TaxonomyApiError && err.status === 404) return false;
      return count < 2;
    },
  });

  // ── Local form state ───────────────────────────────────────────────────────

  const [primaryCatId, setPrimaryCatId] = useState('');
  const [sub1Id, setSub1Id] = useState('');
  const [sub2Id, setSub2Id] = useState('');
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [clearCustom, setClearCustom] = useState(false);

  // Seed form from existing taxonomy
  const seededRef = { done: false };
  useEffect(() => {
    if (!existing || seededRef.done) return;
    seededRef.done = true;
    setPrimaryCatId(existing.primary_category_id ?? '');
    setSelectedFilterIds(existing.filter_ids ?? []);
    setCustomUrl(existing.custom_url ?? '');

    // Restore sub-category selections from the primary entry
    const primaryEntry = existing.categories.find(
      (c) => c.category_id === existing.primary_category_id,
    );
    if (primaryEntry?.sub_category_1) setSub1Id(primaryEntry.sub_category_1.id);
    if (primaryEntry?.sub_category_2) setSub2Id(primaryEntry.sub_category_2.id);
  }, [existing]);

  // ── Derived helpers ────────────────────────────────────────────────────────

  const selectedCat: TaxonomyCategory | undefined = (allCategories ?? []).find(
    (c) => c.id === primaryCatId,
  );
  const selectedSub1: SubCategory1 | undefined = (selectedCat?.sub_categories ?? []).find(
    (s) => s.id === sub1Id,
  );
  const selectedSub2: SubCategory2 | undefined = (selectedSub1?.sub_categories ?? []).find(
    (s) => s.id === sub2Id,
  );

  function buildCategories(): ProductCategoryEntry[] {
    if (!selectedCat) return [];
    return [
      {
        category_id: selectedCat.id,
        category_name: selectedCat.name,
        category_slug: selectedCat.slug,
        sub_category_1: selectedSub1
          ? { id: selectedSub1.id, name: selectedSub1.name, slug: selectedSub1.slug, sub_categories: [] }
          : null,
        sub_category_2: selectedSub2
          ? { id: selectedSub2.id, name: selectedSub2.name, slug: selectedSub2.slug }
          : null,
      },
    ];
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (payload: ProductTaxonomyUpdate) =>
      upsertProductTaxonomy(pageSlug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy-product', pageSlug] });
      queryClient.invalidateQueries({ queryKey: ['taxonomy-products'] });
      setClearCustom(false);
    },
  });

  const regenMutation = useMutation({
    mutationFn: () => regenerateProductTaxonomy(pageSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy-product', pageSlug] });
    },
  });

  function handleSave() {
    const cats = buildCategories();
    const payload: ProductTaxonomyUpdate = {
      product_name: productName || pageSlug,
      categories: cats,
      primary_category_id: primaryCatId,
      filter_ids: selectedFilterIds,
    };
    if (clearCustom) {
      payload.clear_custom_url = true;
      payload.custom_url = null;
    } else if (customUrl.trim()) {
      payload.custom_url = customUrl.trim();
    }
    saveMutation.mutate(payload);
  }

  function toggleFilter(id: string) {
    setSelectedFilterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // Group filters by group name
  const filterGroups =
    (allFilters ?? []).reduce<Record<string, TaxonomyFilter[]>>((acc, f) => {
      (acc[f.group] ??= []).push(f);
      return acc;
    }, {});

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL &amp; Categorisation</span>
          {existing?.effective_url && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              set
            </span>
          )}
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-4 space-y-4 bg-white">
          {loadingExisting && (
            <p className="text-xs text-slate-400">Loading taxonomy…</p>
          )}

          {/* Effective URL preview (read-only) */}
          {existing?.effective_url && (
            <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Effective URL
              </p>
              <code className="text-xs text-slate-700 break-all">{existing.effective_url}</code>
              {existing.custom_url && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                  custom
                </span>
              )}
            </div>
          )}

          {/* Breadcrumb preview */}
          {existing?.effective_breadcrumb && existing.effective_breadcrumb.length > 0 && (
            <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Breadcrumb
              </p>
              <p className="text-xs text-slate-600">
                {existing.effective_breadcrumb.map((b) => b.label).join(' › ')}
              </p>
            </div>
          )}

          {/* Category selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Category</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={primaryCatId}
              onChange={(e) => {
                setPrimaryCatId(e.target.value);
                setSub1Id('');
                setSub2Id('');
              }}
            >
              <option value="">— None —</option>
              {(allCategories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sub-category 1 */}
          {selectedCat && selectedCat.sub_categories.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Sub-category 1</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={sub1Id}
                onChange={(e) => {
                  setSub1Id(e.target.value);
                  setSub2Id('');
                }}
              >
                <option value="">— None —</option>
                {selectedCat.sub_categories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sub-category 2 */}
          {selectedSub1 && selectedSub1.sub_categories.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Sub-category 2</label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={sub2Id}
                onChange={(e) => setSub2Id(e.target.value)}
              >
                <option value="">— None —</option>
                {selectedSub1.sub_categories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filters */}
          {allFilters && allFilters.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Product Filters</label>
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border border-slate-200 p-2">
                {Object.entries(filterGroups)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([group, items]) => (
                    <div key={group}>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                        {group}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(items as TaxonomyFilter[]).sort((a, b) => a.order - b.order).map((f) => {
                          const checked = selectedFilterIds.includes(f.id);
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => toggleFilter(f.id)}
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                                checked
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                              }`}
                            >
                              {f.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Custom URL override */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Custom URL override{' '}
              <span className="font-normal text-slate-400">(leave blank to auto-generate)</span>
            </label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                setClearCustom(false);
              }}
              placeholder="/cameras/usb/see3cam"
            />
            {existing?.custom_url && (
              <button
                type="button"
                className="text-xs text-red-500 hover:underline"
                onClick={() => {
                  setCustomUrl('');
                  setClearCustom(true);
                }}
              >
                ✕ Remove custom URL
              </button>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={!primaryCatId || saveMutation.isPending}
              className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleSave}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Taxonomy'}
            </button>
            {existing && (
              <button
                type="button"
                title="Regenerate URL & breadcrumb from category data"
                disabled={regenMutation.isPending}
                className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                onClick={() => regenMutation.mutate()}
              >
                {regenMutation.isPending ? '…' : '↺ Regen'}
              </button>
            )}
          </div>

          {saveMutation.isError && (
            <p className="text-xs text-red-600">
              {(saveMutation.error as TaxonomyApiError)?.message ?? 'Save failed.'}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-xs text-emerald-600">✓ Taxonomy saved.</p>
          )}
          {regenMutation.isSuccess && (
            <p className="text-xs text-emerald-600">✓ Regenerated.</p>
          )}
        </div>
      )}
    </div>
  );
}
