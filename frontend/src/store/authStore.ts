import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, UserRole } from "../types";
import { api } from "../services/api";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password, _role) => {
        try {
          const res = await api.post('/auth/login', { email, password });
          if (res.success && res.token) {
            localStorage.setItem('token', res.token);
            
            // Map backend role to frontend UserRole
            const backendRole = res.user.role?.toLowerCase() || 'superadmin';
            const roleMap: Record<string, UserRole> = {
              admin: 'superadmin',
              driver: 'driver',
              customer: 'viewer',
            };

            const userObj: AuthUser = {
              id: res.user.id,
              name: res.user.name,
              email: res.user.email,
              role: roleMap[backendRole] || 'superadmin',
              avatar: res.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.user.name)}&background=2563EB&color=fff`,
            };

            set({ user: userObj, token: res.token, isAuthenticated: true });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: "vendroute-auth" }
  )
);
