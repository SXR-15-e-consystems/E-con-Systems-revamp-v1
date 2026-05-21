import { AxiosError } from 'axios';
import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubCategory2 {
  id: string;
  name: string;
  slug: string;
}

export interface SubCategory1 {
  id: string;
  name: string;
  slug: string;
  sub_categories: SubCategory2[];
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  slug: string;
  sub_categories: SubCategory1[];
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TaxonomyCategoryCreate {
  name: string;
  slug: string;
  sub_categories: SubCategory1[];
  order: number;
}

export interface TaxonomyCategoryUpdate {
  name?: string;
  slug?: string;
  sub_categories?: SubCategory1[];
  order?: number;
}

export interface TaxonomyFilter {
  id: string;
  name: string;
  slug: string;
  group: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TaxonomyFilterCreate {
  name: string;
  slug: string;
  group: string;
  order: number;
}

export interface TaxonomyFilterUpdate {
  name?: string;
  slug?: string;
  group?: string;
  order?: number;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface ProductCategoryEntry {
  category_id: string;
  category_name: string;
  category_slug: string;
  sub_category_1: SubCategory1 | null;
  sub_category_2: SubCategory2 | null;
}

export interface ProductTaxonomy {
  id: string;
  page_id: string;
  page_slug: string;
  product_name: string;
  categories: ProductCategoryEntry[];
  primary_category_id: string;
  filter_ids: string[];
  filters: TaxonomyFilter[];
  generated_url: string;
  generated_breadcrumb: BreadcrumbItem[];
  custom_url: string | null;
  custom_breadcrumb: BreadcrumbItem[] | null;
  effective_url: string;
  effective_breadcrumb: BreadcrumbItem[];
  created_at: string;
  updated_at: string;
}

export interface ProductTaxonomyCreate {
  page_id?: string;
  page_slug: string;
  product_name?: string;
  categories: ProductCategoryEntry[];
  primary_category_id: string;
  filter_ids: string[];
  custom_url?: string | null;
  custom_breadcrumb?: BreadcrumbItem[] | null;
}

export interface ProductTaxonomyUpdate {
  product_name?: string;
  categories?: ProductCategoryEntry[];
  primary_category_id?: string;
  filter_ids?: string[];
  custom_url?: string | null;
  custom_breadcrumb?: BreadcrumbItem[] | null;
  clear_custom_url?: boolean;
  clear_custom_breadcrumb?: boolean;
}

// ── Error helper ──────────────────────────────────────────────────────────────

function extractError(error: unknown): string {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.error?.message ?? error.response?.data?.detail;
    if (typeof msg === 'string') return msg;
    if (error.response?.status === 409) return 'Already exists.';
    if (error.response?.status === 404) return 'Not found.';
    if (error.message) return error.message;
  }
  return 'An unexpected error occurred.';
}

export class TaxonomyApiError extends Error {
  public readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'TaxonomyApiError';
    this.status = status;
  }
}

function wrap(error: unknown): never {
  throw new TaxonomyApiError(extractError(error), (error as AxiosError)?.response?.status);
}

// ── Category endpoints ────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<TaxonomyCategory[]> {
  try {
    const { data } = await apiClient.get<TaxonomyCategory[]>('/cms/taxonomy/categories');
    return data;
  } catch (e) { wrap(e); }
}

export async function createCategory(payload: TaxonomyCategoryCreate): Promise<TaxonomyCategory> {
  try {
    const { data } = await apiClient.post<TaxonomyCategory>('/cms/taxonomy/categories', payload);
    return data;
  } catch (e) { wrap(e); }
}

export async function updateCategory(id: string, payload: TaxonomyCategoryUpdate): Promise<TaxonomyCategory> {
  try {
    const { data } = await apiClient.put<TaxonomyCategory>(`/cms/taxonomy/categories/${id}`, payload);
    return data;
  } catch (e) { wrap(e); }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await apiClient.delete(`/cms/taxonomy/categories/${id}`);
  } catch (e) { wrap(e); }
}

// ── Filter endpoints ──────────────────────────────────────────────────────────

export async function fetchFilters(): Promise<TaxonomyFilter[]> {
  try {
    const { data } = await apiClient.get<TaxonomyFilter[]>('/cms/taxonomy/filters');
    return data;
  } catch (e) { wrap(e); }
}

export async function createTaxonomyFilter(payload: TaxonomyFilterCreate): Promise<TaxonomyFilter> {
  try {
    const { data } = await apiClient.post<TaxonomyFilter>('/cms/taxonomy/filters', payload);
    return data;
  } catch (e) { wrap(e); }
}

export async function updateTaxonomyFilter(id: string, payload: TaxonomyFilterUpdate): Promise<TaxonomyFilter> {
  try {
    const { data } = await apiClient.put<TaxonomyFilter>(`/cms/taxonomy/filters/${id}`, payload);
    return data;
  } catch (e) { wrap(e); }
}

export async function deleteTaxonomyFilter(id: string): Promise<void> {
  try {
    await apiClient.delete(`/cms/taxonomy/filters/${id}`);
  } catch (e) { wrap(e); }
}

// ── Product Taxonomy endpoints ────────────────────────────────────────────────

export async function fetchProductTaxonomies(): Promise<ProductTaxonomy[]> {
  try {
    const { data } = await apiClient.get<ProductTaxonomy[]>('/cms/taxonomy/products');
    return data;
  } catch (e) { wrap(e); }
}

export async function fetchProductTaxonomy(pageSlug: string): Promise<ProductTaxonomy> {
  try {
    const { data } = await apiClient.get<ProductTaxonomy>(`/cms/taxonomy/products/${encodeURIComponent(pageSlug)}`);
    return data;
  } catch (e) { wrap(e); }
}

export async function createProductTaxonomy(payload: ProductTaxonomyCreate): Promise<ProductTaxonomy> {
  try {
    const { data } = await apiClient.post<ProductTaxonomy>('/cms/taxonomy/products', payload);
    return data;
  } catch (e) { wrap(e); }
}

export async function upsertProductTaxonomy(
  pageSlug: string,
  payload: ProductTaxonomyUpdate,
): Promise<ProductTaxonomy> {
  // Try update first; if 404, create
  try {
    const { data } = await apiClient.put<ProductTaxonomy>(
      `/cms/taxonomy/products/${encodeURIComponent(pageSlug)}`,
      payload,
    );
    return data;
  } catch (e) {
    if (e instanceof AxiosError && e.response?.status === 404) {
      const createPayload: ProductTaxonomyCreate = {
        page_slug: pageSlug,
        product_name: payload.product_name ?? '',
        categories: payload.categories ?? [],
        primary_category_id: payload.primary_category_id ?? '',
        filter_ids: payload.filter_ids ?? [],
        custom_url: payload.custom_url,
        custom_breadcrumb: payload.custom_breadcrumb,
      };
      return createProductTaxonomy(createPayload);
    }
    wrap(e);
  }
}

export async function regenerateProductTaxonomy(pageSlug: string): Promise<ProductTaxonomy> {
  try {
    const { data } = await apiClient.post<ProductTaxonomy>(
      `/cms/taxonomy/products/${encodeURIComponent(pageSlug)}/regenerate`,
    );
    return data;
  } catch (e) { wrap(e); }
}

export async function deleteProductTaxonomy(pageSlug: string): Promise<void> {
  try {
    await apiClient.delete(`/cms/taxonomy/products/${encodeURIComponent(pageSlug)}`);
  } catch (e) { wrap(e); }
}
