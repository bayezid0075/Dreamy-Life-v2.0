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

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized - token expired
    if (
      error.response?.status === 401 &&
      !isServer &&
      typeof window !== "undefined"
    ) {
      // Only clear tokens if not on auth pages to avoid redirect loops
      if (
        window.location.pathname !== "/signup" &&
        window.location.pathname !== "/login"
      ) {
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
