import { useContext } from 'react';
import { AdminAuthContext } from '../context/AdminAuthContext';

/**
 * Custom hook to access Admin Auth state.
 * Enforces usage within the Provider.
 */
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};