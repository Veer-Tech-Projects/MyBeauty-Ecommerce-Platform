// frontend/src/routes/AdminProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import FullScreenSpinner from '../components/FullScreenSpinner';

const AdminProtectedRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();

  // Show full-screen spinner while checking session
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <FullScreenSpinner />
      </div>
    );
  }

  // If no admin → redirect to login
  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Admin authenticated → render protected content
  return children;
};

export default AdminProtectedRoute;