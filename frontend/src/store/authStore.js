/**
 * @file authStore.js
 * @description Zustand store for authentication state management.
 * Handles login, register, logout, token refresh, and user data
 * with localStorage persistence across sessions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data.data;
          
          set({
            user,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set token in API instance
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          return { success: true, user };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { user, accessToken, refreshToken } = response.data.data;
          
          set({
            user,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          return { success: true, user };
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          delete api.defaults.headers.common['Authorization'];
        }
      },

      // Refresh token
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await api.post('/auth/refresh-token', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          set({
            token: accessToken,
            refreshToken: newRefreshToken,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      // Update user data
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Initialize auth (check if token is valid)
      initializeAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // Token invalid, try to refresh
          const refreshed = await get().refreshAccessToken();
          if (!refreshed) {
            get().logout();
          } else {
            try {
              const response = await api.get('/auth/me');
              set({
                user: response.data.data.user,
                isAuthenticated: true,
                isLoading: false,
              });
            } catch {
              set({ isLoading: false });
            }
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };
