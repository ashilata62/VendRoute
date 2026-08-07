import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isOnline: boolean;
  setAuth: (user: User, token: string) => void;
  toggleOnline: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isOnline: true,
  setAuth: (user, token) => set({ user, token }),
  toggleOnline: () => set((state) => ({ isOnline: !state.isOnline })),
  logout: () => set({ user: null, token: null, isOnline: false }),
}));
