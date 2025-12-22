// src/shared/utils/authService.jsx

// Deprecated: We don't decode tokens in JS anymore. Cookies handle it.
export const getDecodedUser = () => {
  return null; // No tokens in localStorage
};

export const clearAllAuth = () => {
  // Only clear non-sensitive preferences
  localStorage.removeItem('user'); 
  localStorage.removeItem('user_token'); 
};