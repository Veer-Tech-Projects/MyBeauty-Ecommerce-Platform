import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/User/auth/context/AuthProvider';
import { authService } from '@/modules/User/auth/services/authService';
import AuthLayout from '@/modules/User/auth/components/AuthLayout';
import "@/app/styles/Login.css";

const Login = () => {
  const [credentials, setCredentials] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    // Clear error on user interaction for better UX
    if (error) setError('');
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.login(credentials.phone, credentials.password);
      await login(); // Hydrate
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true); // Disable interface
    try {
      await authService.googleLogin();
      await login();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue to MyJewels">
      <form onSubmit={handleLogin}>
        {error && <div className="alert alert-danger py-2 fs-6">{error}</div>}
        
        <div className="mb-3 text-start">
          <label className="form-label fw-bold small">Phone Number</label>
          <input
            type="text"
            name="phone"
            className="form-control login-input"
            placeholder="Enter 10-digit number"
            value={credentials.phone}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="mb-3 text-start">
          <label className="form-label fw-bold small">Password</label>
          <div className="password-input-wrapper position-relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="form-control login-input pe-5"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="btn position-absolute top-50 end-0 translate-middle-y text-muted border-0 bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              style={{ zIndex: 5 }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="text-end mt-1">
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold login-button" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="login-divider my-3 position-relative text-center">
          <hr className="text-muted" />
          <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">
            or
          </span>
        </div>

        <button 
          type="button" 
          className="btn btn-outline-secondary w-100 py-2 d-flex align-items-center justify-content-center gap-2 login-google"
          onClick={handleGoogleLogin}
          // Enterprise Hardening: Disable this too while main login is processing
          disabled={loading} 
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20" />
          Continue with Google
        </button>

        <div className="text-center mt-4">
          <p className="mb-0 text-muted">
            Don't have an account? <Link to="/register" className="fw-bold text-decoration-none">Sign Up</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;