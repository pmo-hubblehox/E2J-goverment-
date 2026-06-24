import { create } from 'zustand';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

// Load from localStorage on init
const storedUser = localStorage.getItem('e2j_user');
const storedToken = localStorage.getItem('e2j_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  setAuth: (user, token) => {
    localStorage.setItem('e2j_user', JSON.stringify(user));
    localStorage.setItem('e2j_token', token);
    set({ user, token, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem('e2j_user');
    localStorage.removeItem('e2j_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
