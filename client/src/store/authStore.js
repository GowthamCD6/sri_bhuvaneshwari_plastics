import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

/**
 * Normalizes user role strings into standardized role identifiers
 */
export const normalizeRole = (role) => {
  const normalized = String(role || '').toLowerCase().replace(/[\s_-]+/g, '').trim();
  if (normalized.includes('store')) return 'storeofficer';
  if (normalized.includes('purchase')) return 'purchasedepartment';
  if (normalized.includes('qms')) return 'qms';
  if (normalized.includes('account')) return 'accountant';
  if (normalized.includes('admin')) return 'admin';
  return normalized;
};

/**
 * Authentication Store with Persist
 * Stores user authentication state and persists it to localStorage
 * Enforces an 8-hour session expiration constraint
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      isAuthenticated: false,
      user: null,
      token: null,
      expiresAt: null,
      
      // Actions
      login: (userData, token) => {
        const now = Date.now();
        const expiresAt = now + EIGHT_HOURS_MS;

        set({
          isAuthenticated: true,
          user: userData,
          token: token,
          expiresAt: expiresAt,
        });
        
        // Also store in localStorage for API service
        if (token) {
          localStorage.setItem('jwt_token', token);
        }
        if (userData) {
          localStorage.setItem('user_data', JSON.stringify(userData));
        }
      },
      
      logout: () => {
        // Clear all stored data
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('auth-storage');
        document.cookie = 'jwt_token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
        document.cookie = 'refresh_token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
        
        // Reset state
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          expiresAt: null,
        });
      },

      /**
       * Checks if the 8-hour token/session expiration has been reached.
       * Automatically logs out if expired.
       * @returns {boolean} true if expired, false if valid
       */
      checkTokenExpiration: () => {
        const { isAuthenticated, expiresAt } = get();
        if (isAuthenticated) {
          if (!expiresAt || Date.now() >= expiresAt) {
            console.warn('Session expired after 8 hours. Logging out...');
            get().logout();
            return true;
          }
        }
        return false;
      },
      
      updateUser: (userData) => {
        set({ user: userData });
        if (userData) {
          localStorage.setItem('user_data', JSON.stringify(userData));
        }
      },
    }),
    {
      name: 'auth-storage', // name of item in localStorage
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
      }),
    }
  )
);

export default useAuthStore;
