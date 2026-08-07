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
  isRouteStarted: boolean;
  setAuth: (user: User, token: string) => void;
  toggleOnline: () => void;
  logout: () => void;
  startRoute: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isOnline: true,
  isRouteStarted: false,
  setAuth: (user, token) => set({ user, token }),
  toggleOnline: async () => {
    const currentState = get();
    const newStatus = !currentState.isOnline;
    set({ isOnline: newStatus });
    
    if (currentState.user?.id) {
      try {
        const { authApi } = await import('../services/api');
        await authApi.updateStatus(currentState.user.id, newStatus);
      } catch (error) {
        console.error('Failed to sync online status:', error);
        set({ isOnline: !newStatus }); // rollback
      }
    }
  },
  logout: () => set({ user: null, token: null, isOnline: false, isRouteStarted: false }),
  startRoute: () => set({ isRouteStarted: true }),
}));
