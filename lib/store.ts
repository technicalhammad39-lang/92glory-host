import { create } from 'zustand';

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
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, token: null });
  },
}));
