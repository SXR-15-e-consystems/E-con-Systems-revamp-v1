import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchFilters,
  createTaxonomyFilter,
  updateTaxonomyFilter,
  deleteTaxonomyFilter,
  fetchProductTaxonomies,
  deleteProductTaxonomy,
  type TaxonomyCategory,
  type TaxonomyCategoryCreate,
  type TaxonomyFilter,
  type TaxonomyFilterCreate,
  type ProductTaxonomy,
  type SubCategory1,
  type SubCategory2,
} from '../api/taxonomyEndpoints';

// ── Utilities ─────────────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'categories' | 'filters' | 'products';

// ── SubCategory editors (inline) ──────────────────────────────────────────────

function SubCat2Editor({
  items,
  onChange,
}: {
  items: SubCategory2[];
  onChange: (items: SubCategory2[]) => void;
}) {
  return (
    <div className="space-y-1 pl-4 border-l-2 border-slate-200">
      {items.map((sc2, i) => (
        <div key={sc2.id} className="flex items-center gap-2">
          <input
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
            placeholder="Name"
            value={sc2.name}
            onChange={(e) => {
              const name = e.target.value;
              onChange(items.map((x, j) => j === i ? { ...x, name, slug: toSlug(name) } : x));
            }}
          />
          <input
            className="w-36 rounded border border-slate-300 px-2 py-1 text-xs font-mono"
            placeholder="slug"
            value={sc2.slug}
            onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, slug: e.target.value } : x))}
          />
          <button
            type="button"
            className="text-red-500 text-xs hover:underline"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-xs text-blue-600 hover:underline"
        onClick={() => onChange([...items, { id: makeId(), name: '', slug: '' }])}
      >
        + Add Level 2
      </button>
    </div>
  );
}

function SubCat1Editor({
  items,
  onChange,
}: {
  items: SubCategory1[];
  onChange: (items: SubCategory1[]) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((sc1, i) => (
        <div key={sc1.id} className="rounded border border-slate-200 bg-slate-50 p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="Sub-category 1 name"
              value={sc1.name}
              onChange={(e) => {
                const name = e.target.value;
                onChange(items.map((x, j) => j === i ? { ...x, name, slug: toSlug(name) } : x));
              }}
            />
            <input
              className="w-36 rounded border border-slate-300 px-2 py-1 text-xs font-mono"
              placeholder="slug"
              value={sc1.slug}
              onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, slug: e.target.value } : x))}
            />
            <button
              type="button"
              className="text-red-500 text-xs hover:underline"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
          <SubCat2Editor
            items={sc1.sub_categories}
            onChange={(sc2) =>
              onChange(items.map((x, j) => j === i ? { ...x, sub_categories: sc2 } : x))
            }
          />
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-blue-600 hover:underline"
        onClick={() => onChange([...items, { id: makeId(), name: '', slug: '', sub_categories: [] }])}
      >
        + Add Sub-category 1
      </button>
    </div>
  );
}

// ── Category modal ────────────────────────────────────────────────────────────

function CategoryModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: TaxonomyCategory;
  onSave: (data: TaxonomyCategoryCreate) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [subCats, setSubCats] = useState<SubCategory1[]>(initial?.sub_categories ?? []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ name, slug, order, sub_categories: subCats });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold text-slate-900">
          {initial ? 'Edit Category' : 'New Category'}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Name</label>
            <input
              required
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!initial) setSlug(toSlug(e.target.value));
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Slug</label>
            <input
              required
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Order</label>
            <input
              type="number"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">Sub-categories</label>
          <SubCat1Editor items={subCats} onChange={setSubCats} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Filter modal ──────────────────────────────────────────────────────────────

function FilterModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: TaxonomyFilter;
  onSave: (data: TaxonomyFilterCreate) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [group, setGroup] = useState(initial?.group ?? '');
  const [order, setOrder] = useState(initial?.order ?? 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ name, slug, group, order });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-900">
          {initial ? 'Edit Filter' : 'New Filter'}
        </h2>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Name</label>
              <input
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!initial) setSlug(toSlug(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Slug</label>
              <input
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Group</label>
              <input
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. Interface, Resolution"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Order</label>
              <input
                type="number"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Categories tab ────────────────────────────────────────────────────────────

function CategoriesTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'create' | TaxonomyCategory | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['taxonomy-categories'],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: (d: TaxonomyCategoryCreate) => createCategory(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy-categories'] });
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: TaxonomyCategoryCreate }) => updateCategory(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy-categories'] });
      setModal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxonomy-categories'] }),
  });

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) return <p className="text-slate-500">Loading categories…</p>;
  if (isError) return <p className="text-red-600">Failed to load categories.</p>;

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={() => setModal('create')}
        >
          + New Category
        </button>
      </div>

      {categories?.length === 0 && (
        <p className="text-slate-500 text-sm">No categories yet.</p>
      )}

      <div className="space-y-2">
        {categories?.map((cat) => {
          const isOpen = expanded.has(cat.id);
          return (
            <div key={cat.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600"
                  onClick={() => toggleExpand(cat.id)}
                >
                  {isOpen ? '▾' : '▸'}
                </button>
                <div className="flex-1">
                  <span className="font-medium text-slate-800">{cat.name}</span>
                  <span className="ml-2 font-mono text-xs text-slate-400">/{cat.slug}</span>
                  <span className="ml-2 text-xs text-slate-400">order: {cat.order}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {cat.sub_categories.length} sub-cat(s)
                  </span>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setModal(cat)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-sm text-red-500 hover:underline"
                  onClick={() => {
                    if (confirm(`Delete category "${cat.name}"?`)) deleteMutation.mutate(cat.id);
                  }}
                >
                  Delete
                </button>
              </div>

              {isOpen && cat.sub_categories.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 space-y-2">
                  {cat.sub_categories.map((sc1) => (
                    <div key={sc1.id}>
                      <p className="text-sm font-medium text-slate-700">
                        {sc1.name}
                        <span className="ml-1 font-mono text-xs text-slate-400">/{sc1.slug}</span>
                      </p>
                      {sc1.sub_categories.length > 0 && (
                        <div className="pl-4 mt-1 space-y-1">
                          {sc1.sub_categories.map((sc2) => (
                            <p key={sc2.id} className="text-xs text-slate-500">
                              ↳ {sc2.name}
                              <span className="ml-1 font-mono text-slate-400">/{sc2.slug}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal === 'create' && (
        <CategoryModal
          onSave={(d) => createMutation.mutate(d)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
      {modal && modal !== 'create' && (
        <CategoryModal
          initial={modal}
          onSave={(d) => updateMutation.mutate({ id: (modal as TaxonomyCategory).id, d })}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

// ── Filters tab ───────────────────────────────────────────────────────────────

function FiltersTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'create' | TaxonomyFilter | null>(null);

  const { data: filters, isLoading, isError } = useQuery({
    queryKey: ['taxonomy-filters'],
    queryFn: fetchFilters,
  });

  const createMutation = useMutation({
    mutationFn: (d: TaxonomyFilterCreate) => createTaxonomyFilter(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy-filters'] });
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: TaxonomyFilterCreate }) => updateTaxonomyFilter(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxonomy-filters'] });
      setModal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaxonomyFilter,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxonomy-filters'] }),
  });

  // Group filters by group name for display
  const grouped = filters?.reduce<Record<string, TaxonomyFilter[]>>((acc, f) => {
    (acc[f.group] ??= []).push(f);
    return acc;
  }, {}) ?? {};

  if (isLoading) return <p className="text-slate-500">Loading filters…</p>;
  if (isError) return <p className="text-red-600">Failed to load filters.</p>;

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={() => setModal('create')}
        >
          + New Filter
        </button>
      </div>

      {filters?.length === 0 && <p className="text-slate-500 text-sm">No filters yet.</p>}

      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([group, items]) => (
        <div key={group} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {items.sort((a, b) => a.order - b.order).map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-800">{f.name}</span>
                  <span className="ml-2 font-mono text-xs text-slate-400">/{f.slug}</span>
                  <span className="ml-2 text-xs text-slate-400">order: {f.order}</span>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setModal(f)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-sm text-red-500 hover:underline"
                  onClick={() => {
                    if (confirm(`Delete filter "${f.name}"?`)) deleteMutation.mutate(f.id);
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {modal === 'create' && (
        <FilterModal
          onSave={(d) => createMutation.mutate(d)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
      {modal && modal !== 'create' && (
        <FilterModal
          initial={modal}
          onSave={(d) => updateMutation.mutate({ id: (modal as TaxonomyFilter).id, d })}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

// ── Products tab ──────────────────────────────────────────────────────────────

function ProductsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['taxonomy-products'],
    queryFn: fetchProductTaxonomies,
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => deleteProductTaxonomy(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxonomy-products'] }),
  });

  const filtered = products?.filter(
    (p) =>
      p.page_slug.toLowerCase().includes(search.toLowerCase()) ||
      p.product_name.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  if (isLoading) return <p className="text-slate-500">Loading product taxonomy mappings…</p>;
  if (isError) return <p className="text-red-600">Failed to load product taxonomy.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Search by slug or product name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-sm text-slate-500">{filtered.length} mapping(s)</span>
      </div>

      {filtered.length === 0 && (
        <p className="text-slate-500 text-sm">
          {products?.length === 0
            ? 'No product taxonomy mappings yet. Open a page in the editor to assign taxonomy.'
            : 'No results match your search.'}
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onDelete={() => {
            if (confirm(`Remove taxonomy for "${p.page_slug}"?`)) deleteMutation.mutate(p.page_slug);
          }} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onDelete,
}: {
  product: ProductTaxonomy;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" className="text-slate-400 hover:text-slate-600" onClick={() => setOpen((o) => !o)}>
          {open ? '▾' : '▸'}
        </button>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-slate-800 truncate block">{product.product_name || product.page_slug}</span>
          <span className="font-mono text-xs text-slate-400 truncate block">{product.effective_url}</span>
        </div>
        {product.custom_url && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">custom URL</span>
        )}
        <button
          type="button"
          className="text-sm text-red-500 hover:underline flex-shrink-0"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-2 text-sm">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Categories</span>
            <ul className="mt-1 space-y-0.5">
              {product.categories.map((c, i) => (
                <li key={i} className="text-slate-700">
                  {c.category_name}
                  {c.sub_category_1 && <> › {c.sub_category_1.name}</>}
                  {c.sub_category_2 && <> › {c.sub_category_2.name}</>}
                  {c.category_id === product.primary_category_id && (
                    <span className="ml-1 rounded bg-blue-100 text-blue-700 px-1.5 py-0.5 text-xs">primary</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {product.filters.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Filters</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {product.filters.map((f) => (
                  <span key={f.id} className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Breadcrumb</span>
            <p className="mt-1 text-slate-600 text-xs">
              {product.effective_breadcrumb.map((b) => b.label).join(' › ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'categories', label: 'Categories' },
    { id: 'filters', label: 'Filters' },
    { id: 'products', label: 'Product Mappings' },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Taxonomy</h1>
        <p className="text-sm text-slate-500">Manage categories, filters and product URL mappings.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'filters' && <FiltersTab />}
        {activeTab === 'products' && <ProductsTab />}
      </div>
    </main>
  );
}
