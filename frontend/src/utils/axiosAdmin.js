// frontend/src/utils/axiosAdmin.js
import axios from 'axios';

// Dedicated Axios instance for Admin API
// - Sends HttpOnly cookie automatically
// - Same base URL as backend
// - Bootstrap-ready error handling
const axiosAdmin = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // ← CRITICAL: sends admin_session_id cookie
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Global response interceptor for consistent error handling
axiosAdmin.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract backend error message
    const message = error.response?.data?.error || 'Network error. Please try again.';
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default axiosAdmin;