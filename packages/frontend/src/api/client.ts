import axios from 'axios';
import type { ApiResponse } from '@dukkan/shared';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export async function apiGet<T>(url: string): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(url);
  if (res.data.error) throw new Error(res.data.error);
  return res.data.data as T;
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await apiClient.post<ApiResponse<T>>(url, body);
  if (res.data.error) throw new Error(res.data.error);
  return res.data.data as T;
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await apiClient.patch<ApiResponse<T>>(url, body);
  if (res.data.error) throw new Error(res.data.error);
  return res.data.data as T;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await apiClient.delete<ApiResponse<T>>(url);
  if (res.data.error) throw new Error(res.data.error);
  return res.data.data as T;
}
