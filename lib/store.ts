import { create } from 'zustand';

const AUTH_USER_CACHE_KEY = 'auth_user_cache';

function persistCachedUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(AUTH_USER_CACHE_KEY);
    return;
  }
  try {
    localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage failures
  }
}

interface User {
  id: string;
  phone?: string | null;
  name?: string | null;
  email?: string | null;
  balance: number;
  vipLevel: number;
  role: string;
  uid?: string;
  inviteCode?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  setUser: (user) => {
    persistCachedUser(user);
    set({ user, isAuthenticated: !!user });
  },
  setToken: (token) => set({ token }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem(AUTH_USER_CACHE_KEY);
    set({ user: null, isAuthenticated: false, token: null });
  },
}));
