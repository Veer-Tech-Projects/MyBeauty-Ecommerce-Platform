import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('user_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        const decoded = jwtDecode(storedToken);
        if (!decoded.sub || typeof decoded.sub !== 'string') {
          throw new Error('Invalid token subject');
        }
        if (decoded.exp * 1000 < Date.now()) {
          logout(); // Token expired
          return;
        }
        setToken(storedToken);
      }

      if (storedUser && storedUser !== 'undefined') {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error restoring user context:', err);
      logout();
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const login = (userData, accessToken = null) => {
    try {
      if (accessToken) {
        const decoded = jwtDecode(accessToken);
        const idFromToken = decoded.sub || decoded.identity;
        if (!idFromToken || typeof idFromToken !== 'string') {
          throw new Error('Invalid token subject');
        }
        if (String(userData.id) !== String(idFromToken)) {
          logout(); // ID mismatch
          return;
        }

        localStorage.setItem('user_token', accessToken);
        setToken(accessToken);
      }

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.error('Login error:', err);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        userId: user?.id,
        token,
        login,
        logout,
        loadingUser,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);