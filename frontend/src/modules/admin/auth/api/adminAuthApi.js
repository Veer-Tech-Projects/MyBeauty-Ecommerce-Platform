import axiosAdmin from './axiosAdmin';
import { AdminSession } from '../models/AdminSession';

// In-flight promise cache (Singleton pattern)
let sessionPromise = null;

export const adminAuthApi = {
  // Pass signal to allow cancellation
  login: async (username, password, signal) => {
    const { data } = await axiosAdmin.post('/api/admin/login', { username, password }, { signal });
    return AdminSession.fromJSON(data.admin);
  },

  logout: async () => {
    try {
      await axiosAdmin.post('/api/admin/logout');
    } catch (error) {
      console.warn("Logout network failed, clearing local state anyway.", error);
    }
  },

  /**
   * Fetches session with De-duplication.
   * Note: We generally don't abort the singleton promise if one subscriber unmounts,
   * but we support signal for fresh requests if needed.
   */
  getSession: async (signal) => {
    if (sessionPromise) return sessionPromise;

    sessionPromise = axiosAdmin.get('/api/admin/session', { signal })
      .then(({ data }) => {
        return AdminSession.fromJSON(data.admin);
      })
      .finally(() => {
        sessionPromise = null;
      });

    return sessionPromise;
  }
};