import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/modules/User/auth/services/authService';
import AuthLayout from '@/modules/User/auth/components/AuthLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const msg = await authService.forgotPassword(email);
      setMessage(msg); // "Reset link sent..."
    } catch (err) {
      setError(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password?" subtitle="Enter your email to reset">
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {message && <div className="alert alert-success py-2">{message}</div>}

        <div className="mb-4">
          <label className="form-label fw-bold small">Email Address</label>
          <input
            type="email"
            className="form-control"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || message}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading || message}>
          {loading ? 'Sending Link...' : 'Send Reset Link'}
        </button>

        <div className="text-center mt-4">
          <Link to="/login" className="text-decoration-none text-muted small">
            &larr; Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;