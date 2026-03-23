import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const PUBLIC_SITE_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ?? 'http://localhost:3001';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Retry transient failures (network errors, 503, 429) up to 2 times with backoff
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config || (config._retryCount ?? 0) >= 2) return Promise.reject(error);

    const status = error.response?.status;
    const isRetryable = !error.response || status === 503 || status === 429;
    if (!isRetryable) return Promise.reject(error);

    config._retryCount = (config._retryCount ?? 0) + 1;
    const delay = 1000 * config._retryCount;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
    return apiClient(config);
  },
);
