import axios from "axios";

import { JWT_HOST_API } from "configs/auth.config";
import { isServer } from "./isServer";

const axiosInstance = axios.create({
  baseURL: JWT_HOST_API,
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    if (!isServer && typeof window !== "undefined") {
      // Don't add token for authentication endpoints (login, register)
      const url = config.url || "";
      const isAuthEndpoint =
        url.includes("/api/users/login/") ||
        url.includes("/api/users/register/");

      if (!isAuthEndpoint) {
        const authToken = window.localStorage.getItem("authToken");
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
      } else {
        // Remove any existing token for auth endpoints
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor with token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 unauthorized - try to refresh token
    if (
      error.response?.status === 401 &&
      !isServer &&
      typeof window !== "undefined" &&
      !originalRequest._retry
    ) {
      // Skip refresh on auth pages to avoid redirect loops
      if (
        window.location.pathname === "/signup" ||
        window.location.pathname === "/login"
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = window.localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          // Try to refresh the access token
          // Use a new axios instance without auth header for refresh endpoint
          const response = await axios.post(
            `${JWT_HOST_API}/api/token/refresh/`,
            {
              refresh: refreshToken,
            },
          );

          const { access } = response.data;

          if (access) {
            // Update tokens
            window.localStorage.setItem("authToken", access);
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${access}`;
            originalRequest.headers.Authorization = `Bearer ${access}`;

            // Process queued requests
            processQueue(null, access);

            isRefreshing = false;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          processQueue(refreshError, null);
          isRefreshing = false;
          window.localStorage.removeItem("authToken");
          window.localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - clear and redirect
        isRefreshing = false;
        window.localStorage.removeItem("authToken");
        window.localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    // Return the full error object so we can access response.data, response.status, etc.
    return Promise.reject(error);
  },
);

export default axiosInstance;
