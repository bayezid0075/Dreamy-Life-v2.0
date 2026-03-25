import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * When unset, use same-origin relative `/api/...` so Next.js rewrites can proxy to
 * the backend (avoids baking `localhost` into the client bundle in production).
 * Set `NEXT_PUBLIC_API_URL` only if the API is on a different public origin.
 */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
}

const API_BASE_URL = getApiBaseUrl();

function refreshTokenUrl(): string {
  return API_BASE_URL
    ? `${API_BASE_URL}/api/token/refresh/`
    : '/api/token/refresh/';
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 60_000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(refreshTokenUrl(), {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    // Show account status message on 403 (hold/ban/inactive)
    if (error.response?.status === 403 && (error.response?.data as Record<string, unknown>)?.detail && typeof window !== 'undefined') {
      const detail = (error.response.data as Record<string, unknown>).detail;
      const msg = typeof detail === 'string' ? detail : 'This action is not allowed.';
      import('sonner').then(({ toast }) => toast.error(msg)).catch(() => {});
    }

    return Promise.reject(error);
  }
);

// Helper for multipart form data requests
export const apiClientMultipart = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: false,
  timeout: 120_000,
});

apiClientMultipart.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClientMultipart.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(refreshTokenUrl(), {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }

          return apiClientMultipart(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
