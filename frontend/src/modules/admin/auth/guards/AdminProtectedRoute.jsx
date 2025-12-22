import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

const AdminProtectedRoute = ({ children }) => {
  const { status, admin } = useAdminAuth();
  const location = useLocation();

  if (status === 'LOADING') {
    return null; // Handled by Context Spinner, but double safety
  }

  // If Unauthenticated or Error (fail closed)
  if (status === 'UNAUTHENTICATED' || !admin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  
  // If Critical Error (Network down), consider showing an Error Boundary here
  // For now, we redirect to login to let them retry
  if (status === 'ERROR') {
      return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;