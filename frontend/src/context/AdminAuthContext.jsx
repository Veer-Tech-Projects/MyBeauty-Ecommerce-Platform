// frontend/src/context/AdminAuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getAdminSession, adminLogout } from '../utils/adminAuthService';
import FullScreenSpinner from '../components/FullScreenSpinner';

const AdminAuthContext = createContext();

// Custom hook for easy access
export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load admin session on mount
  const loadAdmin = async () => {
    setLoading(true);
    setError('');
    try {
      const adminData = await getAdminSession();
      setAdmin(adminData);
    } catch (err) {
      setAdmin(null);
      // Silent fail — expected if not logged in
      if (err.status !== 401) {
        console.error('Session load failed:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await adminLogout();
      setAdmin(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    loadAdmin();
  }, []);

  // Provide context value
  const value = {
    admin,
    loading,
    error,
    setError,
    logout,
    loadAdmin,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {loading ? (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
          <FullScreenSpinner />
        </div>
      ) : (
        children
      )}
    </AdminAuthContext.Provider>
  );
};