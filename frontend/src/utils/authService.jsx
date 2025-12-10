// src/utils/authService.js

import { jwtDecode } from 'jwt-decode';

export const getDecodedUser = () => {
  const token = localStorage.getItem('user_token');
  try {
    return token ? jwtDecode(token) : null;
  } catch {
    return null;
  }
};

// Optional: keep if needed for checking seller state in shared layout
export const getDecodedSeller = () => {
  const token = localStorage.getItem('seller_token');
  try {
    return token ? jwtDecode(token) : null;
  } catch {
    return null;
  }
};

export const clearAllAuth = () => {
  localStorage.removeItem('user_token');
  localStorage.removeItem('user');

  // Optional seller clearing — keep only if needed
  localStorage.removeItem('seller_token');
};
