import { apiClient } from './client';
import type { AuthUser, LoginRequest, LoginResponse, PasswordChangeRequest } from '../types/auth';

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function refreshTokenApi(): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/refresh');
  return data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me');
  return data;
}

export async function changePasswordApi(payload: PasswordChangeRequest): Promise<void> {
  await apiClient.put('/auth/password', payload);
}
