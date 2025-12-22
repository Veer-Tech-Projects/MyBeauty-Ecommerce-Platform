import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/modules/User/auth/services/authService';
import AuthLayout from '@/modules/User/auth/components/AuthLayout';
import { validatePassword } from '@/shared/utils/validators';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError("Invalid link. Please try again.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Enterprise: Shared Validator
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);
    try {
      const msg = await authService.resetPassword(token, password);
      setMessage(msg);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Reset failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
        <AuthLayout title="Invalid Link" subtitle="This reset link is missing or broken.">
            <div className="text-center">
                 <button className="btn btn-primary" onClick={() => navigate('/forgot-password')}>Request New Link</button>
            </div>
        </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set New Password" subtitle="Choose a strong password">
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {message && <div className="alert alert-success py-2">{message}</div>}

        <div className="mb-3">
          <label className="form-label fw-bold small">New Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={message || loading}
          />
          <small className="text-muted" style={{fontSize: '0.7rem'}}>Min 8 chars, 1 number, 1 special char</small>
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold small">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={message || loading}
          />
        </div>

        <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={loading || message}>
          {loading ? 'Updating...' : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;