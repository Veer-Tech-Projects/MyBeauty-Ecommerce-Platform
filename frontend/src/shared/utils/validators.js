/**
 * Enterprise-grade validation utilities.
 */

// Min 8 chars, 1 number, 1 special char
export const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;

export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!PASSWORD_REGEX.test(password)) return "Password must contain at least one number and one special character (!@#$%^&*)";
  return null;
};

export const validateProfilePic = (file) => {
  if (!file) return null; // Optional
  
  // 1. Type Check
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return "Only JPG, PNG, or WEBP images are allowed.";
  }

  // 2. Size Check (Max 2MB)
  const maxSize = 2 * 1024 * 1024; 
  if (file.size > maxSize) {
    return "Image size must be less than 2MB.";
  }

  return null;
};