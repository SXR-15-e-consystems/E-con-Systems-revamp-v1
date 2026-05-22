import { AxiosError } from 'axios';
import { apiClient } from './client';
import type { Page, PageCreate, PageListItem, PageUpdate } from '../types';

/** Extracts a user-friendly error message from an API error response */
function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.error?.message
      ?? error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (error.response?.status === 409) return 'Resource already exists.';
    if (error.response?.status === 404) return 'Resource not found.';
    if (error.message) return error.message;
  }
  return 'An unexpected error occurred.';
}

export class ApiError extends Error {
  public readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchPages(): Promise<PageListItem[]> {
  try {
    const { data } = await apiClient.get<PageListItem[]>('/cms/pages');
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export interface PageSummary {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  og_image_url: string | null;
  status: 'draft' | 'published' | 'archived';
}

export async function fetchPageSummaries(): Promise<PageSummary[]> {
  try {
    const { data } = await apiClient.get<PageSummary[]>('/cms/pages/summaries');
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export async function fetchPage(slug: string): Promise<Page> {
  try {
    const { data } = await apiClient.get<Page>(`/cms/pages/${encodeURIComponent(slug)}`);
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export async function createPage(payload: PageCreate): Promise<Page> {
  try {
    const { data } = await apiClient.post<Page>('/cms/pages', payload);
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export async function updatePage(slug: string, payload: PageUpdate): Promise<Page> {
  try {
    const { data } = await apiClient.put<Page>(`/cms/pages/${encodeURIComponent(slug)}`, payload);
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

// ── Webstore config ────────────────────────────────────────────────────────

export interface WebstoreDistributor {
  name: string;
  email: string;
  phone: string;
  website: string;
  message: string;
}

export interface WebstoreCountryEntry {
  country_code: string;
  purchase_mode: 'buy' | 'contact';
  cart_url: string;
  distributor: WebstoreDistributor;
}

export interface WebstoreConfig {
  default_cart_url: string;
  countries: WebstoreCountryEntry[];
}

export async function fetchWebstoreConfig(): Promise<WebstoreConfig> {
  try {
    const { data } = await apiClient.get<WebstoreConfig>('/cms/webstore-config');
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export async function saveWebstoreConfig(payload: WebstoreConfig): Promise<WebstoreConfig> {
  try {
    const { data } = await apiClient.put<WebstoreConfig>('/cms/webstore-config', payload);
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export async function deletePage(slug: string): Promise<void> {
  try {
    await apiClient.delete(`/cms/pages/${encodeURIComponent(slug)}`);
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

// ── File Uploads ──────────────────────────────────────────────────────────────

export interface UploadDocumentResponse {
  url: string;
  filename: string;
}

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<UploadDocumentResponse>(
      '/cms/uploads/documents',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 },
    );
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}
