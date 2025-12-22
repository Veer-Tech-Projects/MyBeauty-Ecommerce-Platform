import axios from 'axios';
import { getCookie } from '@/shared/utils/cookie';

// 1. Singleton Instance with Environment Config
const api = axios.create({
  // FIXED: Added '/api' to the end of the base URL
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api', 
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... (Keep the rest of the file exactly the same: Interceptors, Error Handling) ...

api.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrfToken = getCookie('csrf_access_token');
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      console.error('Network/Server Error:', error);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        status: 0,
      });
    }

    const { status, data } = error.response;

    // Auto-Logout on 401
    if (status === 401) {
      if (!window.__isLoggingOut && !originalRequest.url.includes('/auth/logout')) {
        window.__isLoggingOut = true; 
        window.dispatchEvent(new Event('auth:logout'));
      }
    }

    if (status >= 500) {
      console.error('Server Error:', data);
      return Promise.reject({
        message: 'Something went wrong on our end. Please try again later.',
        code: 'SERVER_ERROR',
        status: status,
      });
    }

    const normalizedError = {
      message: data?.message || 'An error occurred',
      code: data?.error_code || 'UNKNOWN_ERROR',
      details: data?.details || null,
      status: status,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;