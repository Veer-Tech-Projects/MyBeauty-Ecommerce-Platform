/**
 * specific cookie by name.
 * Used primarily to extract the CSRF token exposed by the backend.
 * @param {string} name 
 * @returns {string|null}
 */
export const getCookie = (name) => {
  if (!document.cookie) return null;
  
  const xsrfCookies = document.cookie.split(';')
    .map(c => c.trim())
    .filter(c => c.startsWith(name + '='));

  if (xsrfCookies.length === 0) return null;
  return decodeURIComponent(xsrfCookies[0].split('=')[1]);
};