import { create } from "zustand";
import { mockRoutes } from "../data/mockData";
import type { Route, RouteStatus } from "../types";

interface RouteState {
  routes: Route[];
  selectedRoute: Route | null;
  setSelectedRoute: (r: Route | null) => void;
  createRoute: (r: Omit<Route, "id">) => void;
  updateRoute: (id: string, updates: Partial<Route>) => void;
  deleteRoute: (id: string) => void;
  filterByStatus: (status: RouteStatus | "all") => Route[];
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: mockRoutes,
  selectedRoute: null,
  setSelectedRoute: (r) => set({ selectedRoute: r }),
  createRoute: (r) => {
    const newRoute: Route = { ...r, id: `r${Date.now()}` };
    set((s) => ({ routes: [newRoute, ...s.routes] }));
  },
  updateRoute: (id, updates) =>
    set((s) => ({
      routes: s.routes.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  deleteRoute: (id) =>
    set((s) => ({ routes: s.routes.filter((r) => r.id !== id) })),
  filterByStatus: (status) => {
    const { routes } = get();
    return status === "all" ? routes : routes.filter((r) => r.status === status);
  },
}));
