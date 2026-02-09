import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../api';

interface User {
  id: string;
  email: string;
  name?: string;
  plan?: string;
  subscriptionStatus?: string;
  subscriptionId?: string;
  customerId?: string;
  currentPeriodEnd?: string | Date;
  isVerified?: boolean;
  githubId?: string;
  githubAccessToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  init: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      error: null,

      setHydrated: () => set({ isHydrated: true }),

      init: () => {
        // Hydrate state from localStorage is handled by persist middleware automatically
        // but we can add custom init logic here if needed
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<AuthResponse>('/api/auth/register', {
            email,
            password,
            name,
          });
          set({
            user: data.user,
            token: data.token || null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const data = await api.get<{ success: boolean; user: User }>('/api/auth/me', token);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // If token is invalid or expired
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      verifyOtp: async (email, code) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<AuthResponse>('/api/auth/verify-otp', { email, code });
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Verification failed',
            isLoading: false,
          });
          throw error;
        }
      },

      resendOtp: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/api/auth/resend-otp', { email });
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Resend failed',
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
