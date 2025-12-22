import api from '@/shared/networking/api';

export const userService = {
  /**
   * Get the current user's profile from the backend.
   * This hits the secure /auth/me endpoint we built in Phase 3.
   * @returns {Promise<Object>} User object
   */
  async getProfile() {
    // We reuse the existing auth endpoint as it returns the full user profile
    const { data } = await api.get('/auth/me');
    return data.data.user; 
  },

  /**
   * Update text-based profile fields (Username, Email).
   * @param {Object} updates - { username, email }
   * @returns {Promise<Object>} Updated user object
   */
  async updateProfile(updates) {
    // Enterprise Constraint: Only allow specific fields
    // This prevents accidental over-posting of sensitive fields like 'role' or 'balance'
    const payload = {};
    if (updates.username) payload.username = updates.username;
    if (updates.email) payload.email = updates.email;

    const { data } = await api.put('/user/profile', payload);
    return data.data.user;
  },

  /**
   * Securely upload a new profile picture.
   * Uses multipart/form-data.
   * @param {File} file - The image file object
   * @returns {Promise<Object>} Updated user object with new picture URL
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('profile_pic', file);

    const { data } = await api.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data.user;
  },
};