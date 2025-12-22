/**
 * Centralized Observability Hook for Admin Auth.
 * Wraps console usage to allow future piping to Sentry/Datadog.
 */
const LOG_PREFIX = '[AdminAuth]';

export const logAuthEvent = (event, details = {}) => {
  const timestamp = new Date().toISOString();
  
  // In production, you might filter 'info' level logs
  const isDev = import.meta.env.MODE === 'development';

  switch (event) {
    case 'LOGIN_SUCCESS':
    case 'LOGOUT_SUCCESS':
      if (isDev) console.info(`${LOG_PREFIX} ${event}`, details);
      break;
      
    case 'LOGIN_FAILURE':
    case 'SESSION_EXPIRED':
    case 'CSRF_MISMATCH':
      console.warn(`${LOG_PREFIX} ${event}`, details);
      break;
      
    case 'CRITICAL_ERROR':
      console.error(`${LOG_PREFIX} ${event}`, details);
      break;
      
    default:
      if (isDev) console.log(`${LOG_PREFIX} ${event}`, details);
  }
};