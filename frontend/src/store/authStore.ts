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
  { id: "u1", name: "Rohit Kapoor", email: "admin@vendroute.in", role: "superadmin", avatar: "https://ui-avatars.com/api/?name=Rohit+Kapoor&background=18C29C&color=fff" },
  { id: "u2", name: "Sunita Agarwal", email: "manager@vendroute.in", role: "supervisor", avatar: "https://ui-avatars.com/api/?name=Sunita+Agarwal&background=18C29C&color=fff" },
  { id: "u3", name: "Arjun Sharma", email: "driver@vendroute.in", role: "driver", avatar: "https://ui-avatars.com/api/?name=Arjun+Sharma&background=10B981&color=fff" },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, _password, role) => {
        const found = MOCK_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        const finalRole: UserRole = found ? found.role : (role && role !== "NIVHE" ? role : "superadmin");
        const userObj: AuthUser = found ? found : {
          id: "u1",
          name: "Rohit Kapoor",
          email,
          role: finalRole,
          avatar: `https://ui-avatars.com/api/?name=Rohit+Kapoor&background=18C29C&color=fff`,
        };
        set({ user: userObj, isAuthenticated: true });
        return true;
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "vendroute-auth" }
  )
);
