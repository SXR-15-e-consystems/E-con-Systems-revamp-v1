import { apiClient } from './client';
import type { Page, PageCreate, PageListItem, PageUpdate } from '../types';

export async function fetchPages(): Promise<PageListItem[]> {
  const { data } = await apiClient.get<PageListItem[]>('/cms/pages');
  return data;
}

export async function fetchPage(slug: string): Promise<Page> {
  const { data } = await apiClient.get<Page>(`/cms/pages/${encodeURIComponent(slug)}`);
  return data;
}

export async function createPage(payload: PageCreate): Promise<Page> {
  const { data } = await apiClient.post<Page>('/cms/pages', payload);
  return data;
}

export async function updatePage(slug: string, payload: PageUpdate): Promise<Page> {
  const { data } = await apiClient.put<Page>(`/cms/pages/${encodeURIComponent(slug)}`, payload);
  return data;
}

export async function deletePage(slug: string): Promise<void> {
  await apiClient.delete(`/cms/pages/${encodeURIComponent(slug)}`);
}
