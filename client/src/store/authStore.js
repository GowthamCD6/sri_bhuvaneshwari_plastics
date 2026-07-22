import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Authentication Store with Persist
 * Stores user authentication state and persists it to localStorage
 */
const useAuthStore = create(
  persist(
    (set) => ({
      // State
      isAuthenticated: false,
      user: null,
      token: null,
      
      // Actions
      login: (userData, token) => {
        set({
          isAuthenticated: true,
          user: userData,
          token: token,
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
        document.cookie = 'jwt_token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
        
        // Reset state
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
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
      }),
    }
  )
);

export default useAuthStore;
