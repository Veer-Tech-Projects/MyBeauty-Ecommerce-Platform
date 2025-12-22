import axios from 'axios';
import { authEvents, AUTH_EVENTS } from '../utils/authEvents';
import { getCookie } from '../utils/csrf';


const axiosAdmin = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Auto-Inject CSRF Header
axiosAdmin.interceptors.request.use((config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    const csrfToken = getCookie('admin_csrf_token');
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});

// RESPONSE INTERCEPTOR: Error Normalization & Event Emission
axiosAdmin.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhancement 3: Centralized Event Bus
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        // Notify Context to clear state, but don't force page reload
        authEvents.emit(AUTH_EVENTS.SESSION_EXPIRED);
      }
    } else {
      // Network Error
      authEvents.emit(AUTH_EVENTS.NETWORK_ERROR);
    }

    const message = error.response?.data?.error || 'Network error. Please try again.';
    return Promise.reject({ 
      message, 
      status: error.response?.status,
      originalError: error 
    });
  }
);

export default axiosAdmin;