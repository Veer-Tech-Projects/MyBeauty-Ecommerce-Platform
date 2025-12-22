import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/User/auth/context/AuthProvider';
import FullScreenSpinner from '@/shared/components/FullScreenSpinner';

const ProtectedRoute = ({ children }) => {
  // Enterprise Improvement: Use status-derived flag
  const { isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();

  // 1. Wait for Auth Check to complete
  if (!isInitialized) {
    return <FullScreenSpinner />;
  }

  // 2. Strict Check: If not authenticated, kick out
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Render
  return children;
};

export default ProtectedRoute;