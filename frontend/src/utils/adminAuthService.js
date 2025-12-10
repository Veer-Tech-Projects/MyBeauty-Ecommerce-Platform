// frontend/src/utils/adminAuthService.js
import axiosAdmin from './axiosAdmin';

// Mirror backend endpoints exactly
// No token logic — all handled by HttpOnly cookie
export const adminLogin = async (username, password) => {
  const response = await axiosAdmin.post('/api/admin/login', {
    username: username.trim().toLowerCase(),
    password,
  });
  return response.data; // { message, admin }
};

export const getAdminSession = async () => {
  const response = await axiosAdmin.get('/api/admin/session');
  return response.data.admin; // { admin_id, username, name, role }
};

export const adminLogout = async () => {
  await axiosAdmin.post('/api/admin/logout');
};

export const refreshAdminSession = async () => {
  await axiosAdmin.post('/api/admin/refresh');
};