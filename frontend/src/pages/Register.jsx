// src/pages/Register.jsx

import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axiosUser';
import '../styles/Register.css';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { login } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (token) {
      navigate('/');
    }
  }, []);

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, phone: digits }));
  };

  const handleRegister = async () => {
    const { username, phone, password, confirmPassword } = form;

    if (!username || !phone || !password || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }

    if (phone.length !== 10) {
      setError('Phone number must be 10 digits.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (profilePic) {
        data.append('profile_pic', profilePic);
      }

      const res = await axios.post('/api/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      login(res.data.user, res.data.token); // Stores token in localStorage
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2 className="register-title">Create Account</h2>

        <input
          className="register-input"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          disabled={loading}
        />

        <input
          className="register-input"
          type="tel"
          placeholder="Phone (10 digits)"
          value={form.phone}
          onChange={handlePhoneChange}
          maxLength={10}
          disabled={loading}
        />

        <div className="password-group">
          <input
            className="register-input"
            type={showPass ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
          />
          <button type="button" className="toggle-btn" onClick={() => setShowPass(!showPass)}>
            {showPass ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="password-group">
          <input
            className="register-input"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            disabled={loading}
          />
          <button type="button" className="toggle-btn" onClick={() => setShowConfirm(!showConfirm)}>
            {showConfirm ? 'Hide' : 'Show'}
          </button>
        </div>

        <input
          className="register-input"
          type="file"
          accept="image/*"
          onChange={(e) => setProfilePic(e.target.files[0])}
          disabled={loading}
        />

        {error && <p className="register-error">{error}</p>}

        <button className="register-button" onClick={handleRegister} disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="register-login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
