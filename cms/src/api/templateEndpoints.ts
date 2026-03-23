import { AxiosError } from 'axios';
import { apiClient } from './client';
import type {
  Template,
  TemplateCreate,
  TemplateListItem,
  TemplateUpdate,
} from '../types/template';

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.error?.message
      ?? error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (error.response?.status === 409) return 'Template already exists.';
    if (error.response?.status === 404) return 'Template not found.';
    if (error.message) return error.message;
  }
  return 'An unexpected error occurred.';
}

class ApiError extends Error {
  public readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchTemplates(): Promise<TemplateListItem[]> {
  try {
    const { data } = await apiClient.get<TemplateListItem[]>('/cms/templates');
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export async function fetchTemplate(templateId: string): Promise<Template> {
  try {
    const { data } = await apiClient.get<Template>(`/cms/templates/${templateId}`);
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export async function createTemplate(payload: TemplateCreate): Promise<Template> {
  try {
    const { data } = await apiClient.post<Template>('/cms/templates', payload);
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export async function updateTemplate(
  templateId: string,
  payload: TemplateUpdate,
): Promise<Template> {
  try {
    const { data } = await apiClient.put<Template>(
      `/cms/templates/${templateId}`,
      payload,
    );
    return data;
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  try {
    await apiClient.delete(`/cms/templates/${templateId}`);
  } catch (error) {
    throw new ApiError(extractErrorMessage(error), (error as AxiosError)?.response?.status);
  }
}
