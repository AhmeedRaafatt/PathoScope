/**
 * Admin API Integration Utilities
 * Provides centralized API functions for all admin operations
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api/admin';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.blob(); // For file downloads
  } else {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }
};

// Admin Dashboard API
export const adminAPI = {
  // Dashboard Statistics
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/stats/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // User Management
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`${API_BASE_URL}/users/?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  updateUser: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Lab Configuration (Test Analytes)
  getAnalytes: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`${API_BASE_URL}/analytes/?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createAnalyte: async (analyteData) => {
    const response = await fetch(`${API_BASE_URL}/analytes/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(analyteData),
    });
    return handleResponse(response);
  },

  updateAnalyte: async (analyteId, analyteData) => {
    const response = await fetch(`${API_BASE_URL}/analytes/${analyteId}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(analyteData),
    });
    return handleResponse(response);
  },

  deleteAnalyte: async (analyteId) => {
    const response = await fetch(`${API_BASE_URL}/analytes/${analyteId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Audit Logs
  getAuditLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`${API_BASE_URL}/audit-logs/?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  exportAuditLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    params.append('export', 'csv');
    
    const response = await fetch(`${API_BASE_URL}/audit-logs/?${params}`, {
      headers: getAuthHeaders(),
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return blob;
    } else {
      throw new Error('Failed to export audit logs');
    }
  },

  // System Broadcasts
  getBroadcasts: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await fetch(`${API_BASE_URL}/broadcasts/?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createBroadcast: async (broadcastData) => {
    const response = await fetch(`${API_BASE_URL}/broadcasts/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(broadcastData),
    });
    return handleResponse(response);
  },

  updateBroadcast: async (broadcastId, broadcastData) => {
    const response = await fetch(`${API_BASE_URL}/broadcasts/${broadcastId}/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(broadcastData),
    });
    return handleResponse(response);
  },

  deleteBroadcast: async (broadcastId) => {
    const response = await fetch(`${API_BASE_URL}/broadcasts/${broadcastId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get Active Broadcast (for all authenticated users)
  getActiveBroadcast: async () => {
    const response = await fetch(`${API_BASE_URL}/broadcasts/active/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Role-based access control utilities
export const adminUtils = {
  // Check if current user is admin
  isAdmin: () => {
    return localStorage.getItem('userRole') === 'admin';
  },

  // Check if user has required role
  hasRole: (requiredRole) => {
    const userRole = localStorage.getItem('userRole');
    const roleHierarchy = {
      'admin': 4,
      'pathologist': 3,
      'lab_tech': 2,
      'patient': 1
    };
    
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  },

  // Redirect non-admin users
  requireAdmin: (navigate) => {
    if (!adminUtils.isAdmin()) {
      const userRole = localStorage.getItem('userRole');
      switch (userRole) {
        case 'patient':
          navigate('/patient');
          break;
        case 'lab_tech':
        case 'pathologist':
          navigate('/hematology');
          break;
        default:
          navigate('/');
      }
      return false;
    }
    return true;
  },

  // Format user role for display
  formatRole: (role) => {
    const roleLabels = {
      'admin': 'Administrator',
      'pathologist': 'Pathologist',
      'lab_tech': 'Lab Technician',
      'patient': 'Patient'
    };
    return roleLabels[role] || role;
  },

  // Get role color for UI
  getRoleColor: (role) => {
    const roleColors = {
      'admin': '#dc2626',
      'pathologist': '#8b5cf6',
      'lab_tech': '#10b981',
      'patient': '#5B65DC'
    };
    return roleColors[role] || '#64748b';
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Format date for display
  formatDate: (dateString, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString('en-US', {
      ...defaultOptions,
      ...options
    });
  },

  // Format relative time
  formatRelativeTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return adminUtils.formatDate(dateString, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  },

  // Export data as CSV
  exportToCSV: (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Debounce function for search inputs
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Generate unique ID for frontend use
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Copy text to clipboard
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  },

  // Show notification (can be integrated with toast library)
  showNotification: (message, type = 'info') => {
    // This can be replaced with a proper toast library
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Example implementation with browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('PathoScope Admin', {
        body: message,
        icon: '/favicon.ico'
      });
    }
  },

  // Request notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }
};

export default adminAPI;
