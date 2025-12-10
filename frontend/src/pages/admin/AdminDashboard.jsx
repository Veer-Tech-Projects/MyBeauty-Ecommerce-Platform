// frontend/src/pages/admin/AdminDashboard.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { refreshAdminSession } from '../../utils/adminAuthService';
import AdminProtectedRoute from '../../routes/AdminProtectedRoute';

const AdminDashboard = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  // Auto-refresh session on user activity (mousemove, keydown, scroll)
  useEffect(() => {
    let idleTimer;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(async () => {
        try {
          await refreshAdminSession();
          console.log('Admin session auto-refreshed');
        } catch (err) {
          console.warn('Auto-refresh failed:', err.message);
          // Optionally: force logout if refresh fails
        }
      }, 25 * 60 * 1000); // Refresh after 25 min of activity
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // Initial trigger

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(idleTimer);
    };
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="min-vh-100 bg-light">
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
          <div className="container-fluid">
            <a className="navbar-brand fw-bold" href="/admin/dashboard">
              MyBeauty Admin
            </a>
            <div className="d-flex align-items-center">
              <span className="text-white me-3">
                <i className="bi bi-person-circle"></i> {admin.name}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline-light btn-sm"
              >
                <i className="bi bi-box-arrow-right"></i> Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container-fluid py-4">
          <div className="row">
            {/* Sidebar */}
            <div className="col-md-3 col-lg-2 d-md-block bg-white sidebar border-end" style={{ minHeight: '80vh' }}>
              <div className="p-3">
                <h5 className="text-muted">Navigation</h5>
                <ul className="nav nav-pills flex-column">
                  <li className="nav-item">
                    <a href="/admin/dashboard" className="nav-link active">
                      <i className="bi bi-speedometer2"></i> Dashboard
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/admin/orders" className="nav-link">
                      <i className="bi bi-cart"></i> Orders
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/admin/products" className="nav-link">
                      <i className="bi bi-box"></i> Products
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/admin/analytics" className="nav-link">
                      <i className="bi bi-graph-up"></i> Analytics
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/admin/settings" className="nav-link">
                      <i className="bi bi-gear"></i> Settings
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Main Panel */}
            <div className="col-md-9 col-lg-10">
              <div className="row g-4">
                {/* Welcome Card */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h2 className="card-title mb-3">
                        Welcome back, <span className="text-primary">{admin.name}</span>!
                      </h2>
                      <p className="text-muted">
                        You are logged in as <strong>{admin.role.toUpperCase()}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="col-md-4">
                  <div className="card text-white bg-primary shadow-sm">
                    <div className="card-body d-flex align-items-center">
                      <i className="bi bi-cart-check fs-1 me-3"></i>
                      <div>
                        <h4 className="mb-0">1,234</h4>
                        <small>Total Orders</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card text-white bg-success shadow-sm">
                    <div className="card-body d-flex align-items-center">
                      <i className="bi bi-currency-rupee fs-1 me-3"></i>
                      <div>
                        <h4 className="mb-0">₹89.5K</h4>
                        <small>Revenue Today</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card text-white bg-warning shadow-sm">
                    <div className="card-body d-flex align-items-center">
                      <i className="bi bi-people fs-1 me-3"></i>
                      <div>
                        <h4 className="mb-0">456</h4>
                        <small>Active Users</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Info */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="bi bi-shield-lock"></i> Session Security
                      </h5>
                      <ul className="list-unstyled">
                        <li><strong>Username:</strong> {admin.username}</li>
                        <li><strong>Role:</strong> <span className="badge bg-success">{admin.role}</span></li>
                        <li><strong>Session:</strong> HttpOnly cookie (auto-refreshed)</li>
                        <li><strong>Idle Timeout:</strong> 30 minutes</li>
                      </ul>
                      <small className="text-muted">
                        Session auto-refreshes on activity. You will be logged out after 30 min of inactivity.
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
};

export default AdminDashboard;