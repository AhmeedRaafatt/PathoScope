/**
 * Authentication and Authorization Utilities
 * Handles token validation and role-based access
 */

/**
 * Check if the user still has the correct role
 * @param {string} requiredRole - The required role (admin, patient, lab_tech, pathologist)
 * @returns {boolean} - True if user has required role, false otherwise
 */
export const hasRequiredRole = (requiredRole) => {
  const userRole = localStorage.getItem("userRole");
  return userRole === requiredRole;
};

/**
 * Handle API response and check for auth errors
 * If 401 or 403, redirect to login
 * @param {Response} response - Fetch response object
 * @param {Function} navigate - React Router navigate function
 * @returns {boolean} - True if response is valid, false if auth error
 */
export const handleAuthError = (response, navigate) => {
  if (response.status === 401 || response.status === 403) {
    // Clear tokens and redirect to login
    localStorage.clear();
    if (navigate) {
      navigate("/login", { replace: true });
    }
    return false;
  }
  return true;
};

/**
 * Safe fetch wrapper that handles auth errors
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {Function} navigate - React Router navigate function
 * @returns {Promise<Response>} - Fetch response
 */
export const safeFetch = async (url, options = {}, navigate) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Token ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Check for auth errors
  if (!handleAuthError(response, navigate)) {
    throw new Error("Authentication failed");
  }

  return response;
};

/**
 * Verify admin access and redirect if needed
 * Used in admin components
 */
export const verifyAdminAccess = (navigate) => {
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "admin") {
    localStorage.clear();
    navigate("/login", { replace: true });
    return false;
  }
  return true;
};
