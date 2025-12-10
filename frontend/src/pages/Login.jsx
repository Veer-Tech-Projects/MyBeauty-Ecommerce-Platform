// src/pages/Login.jsx

import React, { useState, useEffect } from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useUser } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axiosUser';
import '../styles/Login.css';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (token) navigate('/');
  }, []);

  const handleLogin = async () => {
    if (!phone || !password) {
      setError('Please enter both phone and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await axios.post('/api/login', { phone, password });
      login(res.data.user, res.data.token); // Automatically saves in context + localStorage
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const { displayName, email, uid, photoURL } = result.user;

      const res = await axios.post('/api/google-login', {
        idToken,
        username: displayName,
        email,
        google_id: uid,
        profile_pic: photoURL,
      });

      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      console.error('Google Login Error:', err);
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-image">
          <img src="/assets/model-design.png" alt="Login Visual" />
        </div>

        <div className="login-form">
          <div className="login-card">
            <h2 className="login-title">Log in</h2>

            <input
              type="tel"
              className="login-input"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />

            <div className="login-password">
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="show-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button className="login-button" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            {error && <p className="login-error mt-2">{error}</p>}

            <p className="login-create">
              Don’t have an account?{' '}
              <Link to="/register" className="register-link">Sign up</Link>
            </p>

            <div className="login-divider"><span>or</span></div>

            <button className="login-google" onClick={handleGoogleLogin} disabled={loading}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                width="20"
                height="20"
              />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
