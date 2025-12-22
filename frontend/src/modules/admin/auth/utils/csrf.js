/**
 * Safely retrieves a specific cookie value.
 * Used primarily for extracting the CSRF token.
 */
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null; // SSR safety
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};