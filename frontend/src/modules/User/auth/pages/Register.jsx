import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/modules/User/auth/services/authService';
import AuthLayout from '@/modules/User/auth/components/AuthLayout';
import { validatePassword, validateProfilePic } from '@/shared/utils/validators';
import "@/app/styles/Register.css";
import { useAuth } from "@/modules/User/auth/context/AuthProvider";

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    email: '', // Mandatory now
    password: '',
    confirmPassword: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // For inline success UI
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    if (error) setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Client-side validation
      const err = validateProfilePic(file);
      if (err) {
        setError(err);
        e.target.value = null; // Reset input
        setProfilePic(null);
      } else {
        setProfilePic(file);
        setError('');
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Password Match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // 2. Complexity Check
    const pwdError = validatePassword(formData.password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('phone', formData.phone);
      data.append('email', formData.email); // Required
      data.append('password', formData.password);
      if (profilePic) data.append('profile_pic', profilePic);

      await authService.register(data);
      
      // 2. FIX: Auto-Login (Hydrate state from cookies)
      await login();

      // Inline Success UI instead of alert()
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1000); // Faster redirect
      
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setLoading(false); // Only stop loading on error, keep loading on success redirect
    }
  };

  if (success) {
    return (
        <AuthLayout title="Success!" subtitle="Account created.">
            <div className="alert alert-success text-center">
                Registration successful! Redirecting to login...
            </div>
            <div className="d-flex justify-content-center">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join MyJewels today">
      <form onSubmit={handleRegister}>
        {error && <div className="alert alert-danger py-2 fs-6">{error}</div>}

        <div className="mb-3">
          <input
            type="text"
            name="username"
            className="form-control register-input"
            placeholder="Full Name"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <input
            type="text"
            name="phone"
            className="form-control register-input"
            placeholder="Phone Number (10 digits)"
            value={formData.phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              setFormData({ ...formData, phone: val });
            }}
            required
            disabled={loading}
          />
        </div>
        
        {/* Enterprise: Email is now strictly required for recovery flow */}
        <div className="mb-3">
           <input
            type="email"
            name="email"
            className="form-control register-input"
            placeholder="Email Address (Required)"
            value={formData.email}
            onChange={handleChange}
            required 
            disabled={loading}
          />
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <input
              type="password"
              name="password"
              className="form-control register-input"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <small className="text-muted" style={{fontSize: '0.7rem'}}>Min 8 chars, 1 number, 1 special char</small>
          </div>
          <div className="col-md-6 mb-3">
            <input
              type="password"
              name="confirmPassword"
              className="form-control register-input"
              placeholder="Confirm"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label small text-muted">Profile Picture (Optional)</label>
          <input
            type="file"
            className="form-control form-control-sm"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold register-button" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <div className="text-center mt-4">
          <p className="mb-0 text-muted">
            Already have an account? <Link to="/login" className="fw-bold text-decoration-none">Login</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Register;