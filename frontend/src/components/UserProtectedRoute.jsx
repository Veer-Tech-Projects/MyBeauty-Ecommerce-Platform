// src/components/UserProtectedRoute.jsx

import React from 'react';
import { useUser } from '../context/UserContext';
import { Navigate } from 'react-router-dom';

const UserProtectedRoute = ({ children }) => {
  const { isAuthenticated, loadingUser } = useUser();

  if (loadingUser) return null;

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default UserProtectedRoute;
