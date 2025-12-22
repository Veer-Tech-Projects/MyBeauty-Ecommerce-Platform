import api from '@/shared/networking/api';
import { auth, provider } from '@/firebase'; // Your config
import { signInWithPopup } from 'firebase/auth'; // SDK method

export const authService = {
  // --- 1. Standard Auth ---
  
  async login(phone, password) {
    // We don't return user data here. We just ensure the cookie is set.
    // The UI must call useAuth().login() afterwards to hydrate state from /me.
    await api.post('/auth/login', { phone, password });
    return true; 
  },

  async register(formData) {
    // FormData is required for file uploads (profile_pic)
    await api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return true;
  },

  async logout() {
    await api.post('/auth/logout');
    return true;
  },

  async getMe() {
    // The only place we read user data
    const { data } = await api.get('/auth/me');
    return data.data; // { user: ... }
  },

  // --- 2. Google OAuth (Hybrid Flow) ---
  
  async googleLogin() {
    try {
      // A. Get Token from Firebase (Client Side)
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // B. Send Token to Backend (Exchange for Session Cookie)
      await api.post('/auth/google-login', { 
        id_token: idToken 
      });
      return true;

    } catch (error) {
      // Enterprise Fix: Normalize Firebase errors to match API error shape
      if (error.code?.startsWith('auth/')) {
        // Map Firebase error codes to readable messages if needed
        let msg = 'Google Sign-In failed.';
        if (error.code === 'auth/popup-closed-by-user') msg = 'Sign-in cancelled.';
        
        throw { 
          message: msg, 
          code: error.code.toUpperCase().replace('/', '_'), 
          status: 400 
        };
      }
      // Re-throw generic errors
      throw error;
    }
  },

  // --- 3. Password Recovery ---

  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data.message;
  },

  async resetPassword(token, newPassword) {
    const { data } = await api.post('/auth/reset-password', { 
      token, 
      new_password: newPassword 
    });
    return data.message;
  }
};