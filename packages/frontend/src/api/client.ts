import axios, { type AxiosError } from 'axios';
import type { ApiResponse } from '@dukkan/shared';
import { log } from '../lib/logger';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('dukkan-auth');
    if (stored) {
      try {
        const token = JSON.parse(stored)?.state?.token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        log.warn('Failed to parse stored auth token');
      }
    }
    log.debug(`→ ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (err) => {
    log.error('Request setup error', err);
    return Promise.reject(err);
  }
);

// ── Response interceptor: normalise errors ────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    log.debug(`← ${response.status} ${response.config.url}`);
    return response;
  },
  (err: AxiosError<{ error?: string; code?: string }>) => {
    const status = err.response?.status;
    const url = err.config?.url ?? '';
    const serverMessage = err.response?.data?.error;
    const serverCode = err.response?.data?.code;

    if (status === 401) {
      log.warn('Auth expired — redirecting to login', { url, code: serverCode });
      localStorage.removeItem('dukkan-auth');
      window.location.href = '/login';
      return Promise.reject(new Error(serverMessage || 'انتهت الجلسة'));
    }

    if (status === 0 || !err.response) {
      log.warn('Network error — no response from server', { url });
      return Promise.reject(new Error('لا يوجد اتصال بالخادم'));
    }

    if (status && status >= 500) {
      log.error(`Server error ${status} on ${url}`, err, { serverCode });
    } else {
      log.warn(`Client error: ${serverMessage}`, { url, status, serverCode });
    }

    return Promise.reject(new Error(serverMessage || err.message || 'خطأ في الاتصال بالخادم'));
  }
);

// ── Typed helpers ─────────────────────────────────────────────────────────────
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
