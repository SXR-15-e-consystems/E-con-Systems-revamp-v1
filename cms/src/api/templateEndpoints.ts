import { apiClient } from './client';
import type {
  Template,
  TemplateCreate,
  TemplateListItem,
  TemplateUpdate,
} from '../types/template';

export async function fetchTemplates(): Promise<TemplateListItem[]> {
  const { data } = await apiClient.get<TemplateListItem[]>('/cms/templates');
  return data;
}

export async function fetchTemplate(templateId: string): Promise<Template> {
  const { data } = await apiClient.get<Template>(`/cms/templates/${templateId}`);
  return data;
}

export async function createTemplate(payload: TemplateCreate): Promise<Template> {
  const { data } = await apiClient.post<Template>('/cms/templates', payload);
  return data;
}

export async function updateTemplate(
  templateId: string,
  payload: TemplateUpdate,
): Promise<Template> {
  const { data } = await apiClient.put<Template>(
    `/cms/templates/${templateId}`,
    payload,
  );
  return data;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await apiClient.delete(`/cms/templates/${templateId}`);
}
