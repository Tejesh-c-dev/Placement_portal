/**
 * @file api.js
 * @description Axios-based API service layer for all HTTP requests.
 * Configures interceptors for token refresh, error handling, and toast
 * notifications. Exports API methods for auth, student, job, application,
 * company, offer, announcement, and admin operations.
 */

import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_STORAGE_KEY = 'auth-storage';
const ERROR_TOAST_WINDOW_MS = 1500;
const recentErrorToasts = new Map();

const getStoredAuthState = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}');
    return parsed?.state || {};
  } catch {
    return {};
  }
};

const shouldShowErrorToast = (message) => {
  const now = Date.now();
  const key = message || 'An error occurred';
  const lastShownAt = recentErrorToasts.get(key) || 0;

  if (now - lastShownAt < ERROR_TOAST_WINDOW_MS) {
    return false;
  }

  recentErrorToasts.set(key, now);
  return true;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const originalToastError = toast.error.bind(toast);
toast.error = (message, options = {}) => {
  const normalizedMessage = typeof message === 'string' ? message : message?.message || 'An error occurred';
  const key = options.id || normalizedMessage;

  if (!shouldShowErrorToast(key)) {
    return key;
  }

  return originalToastError(normalizedMessage, options);
};

const syncAuthorizationHeader = () => {
  const token = getStoredAuthState().token;

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }

  return token;
};

syncAuthorizationHeader();

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = syncAuthorizationHeader();

    config.headers = config.headers || {};

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to prevent caching of GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = getStoredAuthState()?.refreshToken;

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Update stored tokens
          const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          storage.state.token = accessToken;
          storage.state.refreshToken = newRefreshToken;
          localStorage.setItem('auth-storage', JSON.stringify(storage));

          // Update header and retry request
          syncAuthorizationHeader();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle specific error codes
    const { status, data } = error.response;

    switch (status) {
      case 400:
        {
          // Joi ValidationError responses include a field-level `errors` array.
          // Surface those details instead of the generic message so users know what to fix.
          const fieldErrors = data.errors || data.error?.errors;
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            const messages = fieldErrors.map((e) => e?.message).filter(Boolean);
            toast.error(messages.length > 0 ? messages.join('. ') : data.message || 'Invalid request');
          } else {
            toast.error(data.message || 'Invalid request');
          }
        }
        break;
      case 403:
        toast.error(data.message || 'You do not have permission to perform this action');
        break;
      case 404:
        toast.error(data.message || 'Resource not found');
        break;
      case 422:
        // Validation errors
        if (data.errors) {
          Object.values(data.errors).forEach((messages) => {
            if (Array.isArray(messages)) {
              messages.forEach((msg) => toast.error(msg));
            } else {
              toast.error(messages);
            }
          });
        } else {
          toast.error(data.message || 'Validation error');
        }
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(data.message || 'An error occurred');
    }

    return Promise.reject(error);
  }
);

// API service methods
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password, confirmPassword) =>
    api.post(`/auth/reset-password/${token}`, { token, password, confirmPassword }),
  changePassword: (data) => api.post('/auth/change-password', data),
  getMe: () => api.get('/auth/me'),
};

export const studentAPI = {
  getProfile: () => api.get('/students/profile'),
  createProfile: (data) => api.post('/students/profile', data),
  updateProfile: (data) => api.patch('/students/profile', data),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/students/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteResume: () => api.delete('/students/profile/resume'),
  getAll: (params) => api.get('/students', { params }),
  search: (params) => api.get('/students/search', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getStats: () => api.get('/students/stats'),
};

export const jobAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.patch(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  search: (params) => api.get('/jobs/search', { params }),
  getEligible: (params) => api.get('/jobs/eligible', { params }),
  checkEligibility: (id) => api.get(`/jobs/${id}/check-eligibility`),
  getFeatured: () => api.get('/jobs/featured'),
  getTopPaying: () => api.get('/jobs/top-paying'),
  publish: (id) => api.patch(`/jobs/${id}/publish`),
  close: (id) => api.patch(`/jobs/${id}/close`),
  getMyJobs: (params) => api.get('/jobs/my-jobs', { params }),
};

export const applicationAPI = {
  apply: (data) => api.post('/applications', data),
  getById: (id) => api.get(`/applications/${id}`),
  getMy: (params) => api.get('/applications/my-applications', { params }),
  getByJob: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  updateStatus: (id, data) => api.patch(`/applications/${id}/status`, data),
  bulkUpdateStatus: (data) => api.patch('/applications/bulk-status', data),
  withdraw: (id) => api.patch(`/applications/${id}/withdraw`),
  addInterviewRound: (id, data) => api.post(`/applications/${id}/interview-round`, data),
  getStats: () => api.get('/applications/stats'),
};

export const companyAPI = {
  getAll: (params) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  getBySlug: (slug) => api.get(`/companies/slug/${slug}`),
  register: (data) => api.post('/companies', data),
  update: (id, data) => api.patch(`/companies/${id}`, data),
  search: (params) => api.get('/companies/search', { params }),
  getMy: (params) => api.get('/companies/my-companies', { params }),
  getPending: (params) => api.get('/companies/pending', { params }),
  approve: (id) => api.patch(`/companies/${id}/approve`),
  reject: (id, reason) => api.patch(`/companies/${id}/reject`, { reason }),
  addHRContact: (id, data) => api.post(`/companies/${id}/hr-contacts`, data),
};

export const offerAPI = {
  create: (data) => api.post('/offers', data),
  getById: (id) => api.get(`/offers/${id}`),
  getMy: (params) => api.get('/offers/my-offers', { params }),
  getByJob: (jobId, params) => api.get(`/offers/job/${jobId}`, { params }),
  accept: (id) => api.patch(`/offers/${id}/accept`),
  decline: (id, reason) => api.patch(`/offers/${id}/decline`, { reason }),
  revoke: (id, reason) => api.patch(`/offers/${id}/revoke`, { reason }),
  getStats: (params) => api.get('/offers/stats', { params }),
  getPending: (params) => api.get('/offers/pending', { params }),
  getExpiring: (params) => api.get('/offers/expiring', { params }),
};

export const announcementAPI = {
  getForUser: (params) => api.get('/announcements', { params }),
  getAll: (params) => api.get('/announcements/all', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  getUrgent: () => api.get('/announcements/urgent'),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.patch(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
  toggleActive: (id) => api.patch(`/announcements/${id}/toggle-active`),
  pin: (id) => api.patch(`/announcements/${id}/pin`),
  unpin: (id) => api.patch(`/announcements/${id}/unpin`),
  sendEmail: (id) => api.post(`/announcements/${id}/send-email`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPlacementStats: (params) => api.get('/admin/stats/placements', { params }),
  getBranchAnalytics: (params) => api.get('/admin/stats/branch-wise', { params }),
  getBatchTrends: () => api.get('/admin/stats/batch-trends'),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  changeUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  exportStudents: (params) => api.get('/admin/export/students', { params, responseType: 'blob' }),
  exportPlacements: (params) => api.get('/admin/export/placements', { params, responseType: 'blob' }),
  getUnplacedStudents: (params) => api.get('/admin/students/unplaced', { params }),
  getAllCompanies: (params) => api.get('/admin/companies', { params }),
  getTopRecruiters: (params) => api.get('/admin/companies/top-recruiters', { params }),
  generateReport: (params) => api.get('/admin/reports/placement', { params }),
  sendNotification: (data) => api.post('/admin/notifications/send', data),
};

export default api;
