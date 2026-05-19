import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const PUBLIC_SITE_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ?? 'http://localhost:3000';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Send HttpOnly cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Auth token integration ---
type TokenGetter = () => string | null;
type TokenSetter = (token: string | null) => void;
let _getAccessToken: TokenGetter = () => null;
let _setAccessToken: TokenSetter = () => {};

/** Called by AuthProvider to wire up the in-memory token */
export function setAccessTokenGetter(getter: TokenGetter): void {
  _getAccessToken = getter;
}

/** Called by AuthProvider to wire up the in-memory token setter */
export function setAccessTokenSetter(setter: TokenSetter): void {
  _setAccessToken = setter;
}

// Attach Bearer token to every request
apiClient.interceptors.request.use((config) => {
  const token = _getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh queue to prevent concurrent refresh calls ---
let isRefreshing = false;

type RefreshSubscriber = {
  onSuccess: (token: string) => void;
  onFailure: (error: unknown) => void;
};
let refreshSubscribers: RefreshSubscriber[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(({ onSuccess }) => onSuccess(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error: unknown) {
  refreshSubscribers.forEach(({ onFailure }) => onFailure(error));
  refreshSubscribers = [];
}

function addRefreshSubscriber(sub: RefreshSubscriber) {
  refreshSubscribers.push(sub);
}

// Retry transient failures (network errors, 503, 429) up to 2 times with backoff
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  _isRetryAfterRefresh?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config) return Promise.reject(error);

    const status = error.response?.status;

    // Handle 401 — attempt silent refresh (skip if request is already a refresh call)
    if (status === 401 && !config.url?.includes('/auth/refresh') && !config._isRetryAfterRefresh) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          addRefreshSubscriber({
            onSuccess: (newToken: string) => {
              config.headers.Authorization = `Bearer ${newToken}`;
              config._isRetryAfterRefresh = true;
              resolve(apiClient(config));
            },
            onFailure: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post<{ access_token: string }>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken = data.access_token;

        _setAccessToken(newToken);

        onTokenRefreshed(newToken);

        config.headers.Authorization = `Bearer ${newToken}`;
        config._isRetryAfterRefresh = true;
        return apiClient(config);
      } catch (refreshError) {
        // Notify all queued requests of the failure so they don't hang
        onRefreshFailed(refreshError);
        _setAccessToken(null);
        // Dispatch custom event so AuthProvider can update React state without a page reload
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // Retry transient failures (network errors, 503, 429)
    if ((config._retryCount ?? 0) >= 2) return Promise.reject(error);
    const isRetryable = !error.response || status === 503 || status === 429;
    if (!isRetryable) return Promise.reject(error);

    config._retryCount = (config._retryCount ?? 0) + 1;
    const delay = 1000 * config._retryCount;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
    return apiClient(config);
  },
);
