import { useState } from 'react';
import { userService } from '../services/userService';
import { useAuth } from '@/modules/User/auth/context/AuthProvider';
import { toast } from 'react-toastify';
import { validateProfilePic } from '@/shared/utils/validators'; // Reusing Phase 3 validator

export const useProfile = () => {
  // We use 'login' here to re-hydrate the global user state from the backend
  // effectively refreshing the UI everywhere (Navbar, etc.)
  const { user, login } = useAuth(); 
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle text updates (Username, Email)
   */
  const updateDetails = async (username) => {
    if (!username || username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Call API
      await userService.updateProfile({ username });
      
      // 2. Refresh Global State (Backend is source of truth)
      // This ensures the Navbar updates instantly with the new name
      await login(); 
      
      toast.success("Profile updated successfully");
      return true;
    } catch (err) {
      const msg = err.message || "Failed to update profile";
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Avatar Upload
   */
  const updateAvatar = async (file) => {
    // 1. Client-Side Validation (Fast Feedback)
    // Uses the shared enterprise validator we created in Phase 3
    const validationError = validateProfilePic(file);
    if (validationError) {
      toast.error(validationError);
      return false;
    }

    setUploading(true);
    setError(null);
    try {
      // 2. Call API
      await userService.uploadAvatar(file);
      
      // 3. Refresh Global State
      await login(); 
      
      toast.success("Profile picture updated");
      return true;
    } catch (err) {
      const msg = err.message || "Failed to upload image";
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    user,
    loading,
    uploading,
    error,
    updateDetails,
    updateAvatar
  };
};