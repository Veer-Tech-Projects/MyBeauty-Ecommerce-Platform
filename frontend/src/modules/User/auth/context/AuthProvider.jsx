import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '@/shared/networking/api';
import { clearAllAuth } from '@/shared/utils/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // --- State Machine ---
  // status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error'
  const [status, setStatus] = useState('idle');
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- 1. Single Stable BroadcastChannel ---
  const channelRef = useRef(null);

  useEffect(() => {
    // Initialize once
    channelRef.current = new BroadcastChannel('auth_channel');
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, []);

  // --- 2. Stable Session Check (The Source of Truth) ---
  const checkSession = useCallback(async () => {
    // Only trigger loading state if we are initializing or explicitly re-verifying
    // This prevents flickering if called in background
    if (!isInitialized) setStatus('loading');

    try {
      const { data } = await api.get('/auth/me');
      
      if (data?.data?.user) {
        setUser(data.data.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      // If 401, api.js handles the event, but we ensure local state is clean
      setUser(null);
      // Distinguish network errors from auth errors if needed
      if (error.code === 'NETWORK_ERROR') {
         setStatus('error'); // UI can show "Offline" state
      } else {
         setStatus('unauthenticated');
      }
    } finally {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // --- 3. Event Listeners (Tabs & API Events) ---
  useEffect(() => {
    if (!channelRef.current) return;

    const handleMessage = (event) => {
      if (event.data.type === 'LOGOUT') {
        setUser(null);
        setStatus('unauthenticated');
      } else if (event.data.type === 'LOGIN') {
        // Another tab logged in, we should re-verify who it is
        checkSession();
      }
    };

    channelRef.current.onmessage = handleMessage;

    // Listen for the internal 'auth:logout' event from api.js (401 Interceptor)
    const handleForceLogout = () => {
      logout(true); // true = skip API call, just clear state
    };
    window.addEventListener('auth:logout', handleForceLogout);

    return () => {
      if (channelRef.current) channelRef.current.onmessage = null;
      window.removeEventListener('auth:logout', handleForceLogout);
    };
  }, [checkSession]);

  // --- 4. Actions ---

  // Login now trusts the BACKEND, not the argument.
  const login = useCallback(async () => {
    // We assume the component calling this has already successfully POSTed credentials.
    // Now we hydrate to get the user profile.
    await checkSession();
    
    // Notify other tabs
    channelRef.current?.postMessage({ type: 'LOGIN' });
  }, [checkSession]);

  const logout = useCallback(async (skipApi = false) => {
    try {
      if (!skipApi) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.warn('Logout API failed, clearing local state anyway', err);
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      clearAllAuth(); // Legacy cleanup
      channelRef.current?.postMessage({ type: 'LOGOUT' });
    }
  }, []);

  // --- 5. Initial Load ---
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // --- 6. Memoized Context Value ---
  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isInitialized,
    login,
    logout,
    checkSession
  }), [user, status, isInitialized, login, logout, checkSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Custom Hook ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};