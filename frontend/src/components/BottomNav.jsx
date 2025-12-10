import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/BottomNav.css';

const BottomNav = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  if (isAdminPage) return null;

  const { user, loadingUser } = useUser();
  const { cartItems } = useCart();
  const totalItems = cartItems.length;

  return (
    <div className="bottom-nav">
      <Link to="/" className="nav-icon">
        <i className="bi bi-house-door"></i>
      </Link>

      <Link to="/shop" className="nav-icon">
        <i className="bi bi-bag"></i>
      </Link>

      <Link to="/cart" className="nav-icon position-relative">
        <i className="bi bi-cart"></i>
        {totalItems > 0 && (
          <span className="cart-badge">{totalItems}</span>
        )}
      </Link>

      {loadingUser ? (
        <div className="nav-icon text-muted small">...</div>
      ) : user ? (
        <Link to="/profile" className="nav-icon">
          <i className="bi bi-person-circle"></i>
        </Link>
      ) : (
        <Link to="/login" className="nav-login-box">
          <i className="bi bi-box-arrow-in-right me-1"></i>
          <span>Login</span>
        </Link>
      )}
    </div>
  );
};

export default BottomNav;
