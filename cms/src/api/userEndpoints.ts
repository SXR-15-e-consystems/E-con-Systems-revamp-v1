import { apiClient } from './client';
import type { AuthUser, UserRole } from '../types/auth';

export interface UserCreatePayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdatePayload {
  role?: UserRole;
  is_active?: boolean;
}

export async function fetchUsers(): Promise<AuthUser[]> {
  const { data } = await apiClient.get<AuthUser[]>('/cms/users');
  return data;
}

export async function createUser(payload: UserCreatePayload): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>('/cms/users', payload);
  return data;
}

export async function updateUser(userId: string, payload: UserUpdatePayload): Promise<AuthUser> {
  const { data } = await apiClient.put<AuthUser>(`/cms/users/${userId}`, payload);
  return data;
}

export async function deleteUser(userId: string): Promise<AuthUser> {
  const { data } = await apiClient.delete<AuthUser>(`/cms/users/${userId}`);
  return data;
}

/** Soft-deactivates a user via PUT (semantically correct — does not delete the resource). */
export async function deactivateUser(userId: string): Promise<AuthUser> {
  const { data } = await apiClient.put<AuthUser>(`/cms/users/${userId}`, { is_active: false });
  return data;
}
