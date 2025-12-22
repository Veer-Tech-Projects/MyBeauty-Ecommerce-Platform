// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// NEW: Use Enterprise Auth
import { useAuth } from "@/modules/User/auth/context/AuthProvider";

import {
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from '../utils/recentSearches';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "@/app/styles/NavbarSearch.css";

export default function Navbar() {
  // NEW: Destructure from useAuth
  const { user, isInitialized } = useAuth();
  
  // Mapping 'loadingUser' concept to '!isInitialized'
  const loadingUser = !isInitialized; 

  const loc       = useLocation();
  const navigate  = useNavigate();

  const   [collapsed,   setCollapsed]   = useState(true);
  const   [query,       setQuery]       = useState('');
  const   [showDD,      setShowDD]      = useState(false);
  const   [recent,      setRecent]      = useState(getRecentSearches());
  const     searchRef  = useRef(null);

  /* click‑outside for recent‑search dropdown */
  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDD(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* refresh list only when dropdown opens */
  useEffect(() => {
    if (showDD) setRecent(getRecentSearches());
  }, [showDD]);

  /* ─── JSX ─── */
  return (
    <nav
      className="navbar navbar-expand-lg shadow-sm fixed-top px-4 py-3"
      style={{
        background: '#f6f1eb',
        zIndex: 1030,
      }}
    >
      <div className="container-fluid">
        {/* brand */}
        <Link className="navbar-brand fw-bold fs-4" to="/" onClick={() => setCollapsed(true)}>
          MyBeauty
        </Link>

        {/* mobile toggler */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-controls="navbarNav"
          aria-expanded={!collapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* body */}
        <div
          id="navbarNav"
          className={`collapse navbar-collapse justify-content-end ${!collapsed ? 'show' : ''}`}
        >
          <ul className="navbar-nav align-items-center gap-3" onClick={() => setCollapsed(true)}>
            {/* ───── Search field ───── */}
            <li className="nav-item w-lg-auto position-relative">
              <form
                ref={searchRef}
                className="nav-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  const term = query.trim();
                  if (term) {
                    addRecentSearch(term);
                    navigate(`/search?q=${encodeURIComponent(term)}`);
                    setQuery('');
                    setShowDD(false);
                  }
                }}
              >
                <input
                  className="form-control"
                  placeholder="Search products"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDD(true);
                  }}
                  onFocus={() => setShowDD(true)}
                  autoComplete="off"
                  onKeyDown={(e) => e.key === 'Escape' && setShowDD(false)}
                />
                <button type="submit" className="search-btn" aria-label="search">
                  <i className="bi bi-search" />
                </button>

                {showDD && recent.length > 0 && (
                  <ul className="recent-box list-unstyled shadow-sm">
                    {recent.map((txt) => (
                      <li key={txt}>
                        <button
                          type="button"
                          className="recent-item w-100 text-start"
                          onClick={() => {
                            navigate(`/search?q=${encodeURIComponent(txt)}`);
                            setQuery('');
                            setShowDD(false);
                          }}
                        >
                          <i className="bi bi-clock-history me-2 small text-muted" />
                          {txt}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        className="recent-clear w-100 text-center"
                        onClick={() => {
                          clearRecentSearches();
                          setRecent([]);
                        }}
                      >
                        Clear history
                      </button>
                    </li>
                  </ul>
                )}
              </form>
            </li>
            
            <Link to="/seller/register" className="btn">
              Become a Seller
            </Link>
          </ul>
        </div>
      </div>
    </nav>
  );
}