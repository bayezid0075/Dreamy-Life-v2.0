import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  // Works for both web (localStorage) and mobile (will be replaced with SecureStore)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
