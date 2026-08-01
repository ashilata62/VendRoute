import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, UserRole } from "../types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
}

const MOCK_USERS: AuthUser[] = [
  { id: "u1", name: "Rohit Kapoor", email: "admin@vendroute.in", role: "superadmin", avatar: "https://ui-avatars.com/api/?name=Rohit+Kapoor&background=2563EB&color=fff" },
  { id: "u2", name: "Sunita Agarwal", email: "manager@vendroute.in", role: "supervisor", avatar: "https://ui-avatars.com/api/?name=Sunita+Agarwal&background=8B5CF6&color=fff" },
  { id: "u3", name: "Arjun Sharma", email: "driver@vendroute.in", role: "driver", avatar: "https://ui-avatars.com/api/?name=Arjun+Sharma&background=10B981&color=fff" },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, _password, role) => {
        const found = MOCK_USERS.find(
          (u) => u.email === email || u.role === role
        );
        if (found) {
          set({ user: { ...found, role }, isAuthenticated: true });
          return true;
        }
        // default superadmin for demo
        const defaultUser: AuthUser = {
          id: "u1",
          name: "Rohit Kapoor",
          email,
          role,
          avatar: `https://ui-avatars.com/api/?name=Rohit+Kapoor&background=2563EB&color=fff`,
        };
        set({ user: defaultUser, isAuthenticated: true });
        return true;
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "vendroute-auth" }
  )
);
