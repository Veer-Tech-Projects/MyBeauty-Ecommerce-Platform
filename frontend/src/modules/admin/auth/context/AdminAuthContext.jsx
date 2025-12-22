import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { authReducer, initialState } from './authReducer';
import { adminAuthApi } from '../api/adminAuthApi';
import { authEvents, AUTH_EVENTS } from '../utils/authEvents';
import { logAuthEvent } from '../utils/authLogger';
import FullScreenSpinner from "@/shared/components/FullScreenSpinner";

export const AdminAuthContext = createContext();


export const AdminAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadSession = useCallback(async (signal) => {
    if (state.status !== 'AUTHENTICATED') {
      dispatch({ type: 'LOGIN_START' });
    }

    try {
      const admin = await adminAuthApi.getSession(signal);
      dispatch({ type: 'LOGIN_SUCCESS', payload: admin });
      // Enhancement 4: Observability
      logAuthEvent('SESSION_RESTORED', { username: admin.username });
    } catch (error) {
      // Ignore AbortError (component unmounted)
      if (error.code === "ERR_CANCELED" || error.name === "CanceledError") return;

      if (error.status === 401 || error.status === 403) {
        dispatch({ type: 'LOGIN_FAILURE', payload: null });
        logAuthEvent('SESSION_INVALID');
      } else {
        dispatch({ type: 'SESSION_ERROR', payload: error.message });
        logAuthEvent('NETWORK_ERROR', { message: error.message });
      }
    }
  }, [state.status]);

  const login = async (username, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const admin = await adminAuthApi.login(username, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: admin });
      logAuthEvent('LOGIN_SUCCESS', { username: admin.username });
      return true;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      logAuthEvent('LOGIN_FAILURE', { username, error: error.message });
      throw error;
    }
  };

  const logout = async () => {
    await adminAuthApi.logout();
    dispatch({ type: 'LOGOUT' });
    logAuthEvent('LOGOUT_SUCCESS');
  };

  // 1. Bootstrap Session (with AbortController)
  useEffect(() => {
    const controller = new AbortController(); // Enhancement 1: AbortController
    loadSession(controller.signal);
    return () => controller.abort();
  }, []);

  // 2. Listen for Event Bus (401 from Axios)
  useEffect(() => {
    const unsubscribe = authEvents.on(AUTH_EVENTS.SESSION_EXPIRED, () => {
      // Only dispatch if we think we are authenticated to avoid loops
      if (state.status === 'AUTHENTICATED') {
        logAuthEvent('SESSION_EXPIRED_EVENT');
        dispatch({ type: 'LOGOUT' });
      }
    });
    return unsubscribe;
  }, [state.status]);

  return (
    <AdminAuthContext.Provider value={{ ...state, login, logout, refreshSession: () => loadSession() }}>
      {state.status === 'LOADING' ? (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
           <FullScreenSpinner />
        </div>
      ) : (
        children
      )}
    </AdminAuthContext.Provider>
  );
};