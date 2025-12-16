import axios from 'axios';

import { JWT_HOST_API } from 'configs/auth.config';
import { isServer } from './isServer';

const axiosInstance = axios.create({
  baseURL: JWT_HOST_API,
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    if (!isServer && typeof window !== "undefined") {
      const authToken = window.localStorage.getItem("authToken");
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized - token expired
    if (error.response?.status === 401 && !isServer && typeof window !== "undefined") {
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("refreshToken");
      // Optionally redirect to login
      if (window.location.pathname !== "/signup" && window.location.pathname !== "/login") {
        window.location.href = "/signup";
      }
    }
    return Promise.reject((error.response && error.response.data) || 'Something went wrong');
  }
);

export default axiosInstance;
