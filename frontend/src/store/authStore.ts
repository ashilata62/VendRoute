import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, UserRole } from "../types";
import { authApi, setToken, clearToken } from "../services/api";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

// Role mapping: backend ADMIN/SUPERVISOR/DRIVER → frontend roles
function mapRole(backendRole: string): UserRole {
  switch (backendRole?.toUpperCase()) {
    case "ADMIN":      return "superadmin";
    case "SUPERVISOR": return "supervisor";
    case "DRIVER":     return "driver";
    default:           return "superadmin";
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(email, password);
          if (res.success && res.token && res.user) {
            setToken(res.token);
            const user: AuthUser = {
              id: res.user.id,
              name: res.user.name,
              email: res.user.email,
              role: mapRole(res.user.role),
              avatar:
                res.user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(res.user.name)}&background=2563EB&color=fff`,
            };
            set({ user, isAuthenticated: true, isLoading: false });
            return { ok: true };
          }
          set({ isLoading: false });
          return { ok: false, error: "Login failed. Check your credentials." };
        } catch (err: any) {
          set({ isLoading: false });
          return { ok: false, error: err?.message || "Server error. Please try again." };
        }
      },

      logout: () => {
        clearToken();
        set({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        const { isAuthenticated } = get();
        if (!isAuthenticated) return;
        try {
          const res = await authApi.me();
          if (res.success && res.user) {
            const user: AuthUser = {
              id: res.user.id,
              name: res.user.name,
              email: res.user.email,
              role: mapRole(res.user.role),
              avatar:
                res.user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(res.user.name)}&background=2563EB&color=fff`,
            };
            set({ user });
          }
        } catch {
          // Token expired ya invalid — logout kar do
          clearToken();
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    { name: "vendroute-auth" }
  )
);
