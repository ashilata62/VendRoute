// @ts-nocheck
import { create } from "zustand";
import { routesApi } from "../services/api";
import type { Route, RouteStatus } from "../types";

interface RouteState {
  routes: Route[];
  selectedRoute: Route | null;
  setSelectedRoute: (r: Route | null) => void;
  createRoute: (r: Omit<Route, "id">) => Promise<boolean>;
  updateRoute: (id: string, updates: Partial<Route>) => Promise<boolean>;
  deleteRoute: (id: string) => void;
  filterByStatus: (status: RouteStatus | "all") => Route[];
  fetchRoutes: () => Promise<void>;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: [],
  selectedRoute: null,
  setSelectedRoute: (r) => set({ selectedRoute: r }),
  fetchRoutes: async () => {
    try {
      const res = await routesApi.getAll();
      if (res.success) {
        // Keep full stop objects (including status, gpsVerified, cashCollected etc.)
        // DO NOT map to just locationId — that loses status info needed for progress
        set({ routes: res.data });
      }
    } catch (error) {
      console.error("Failed to fetch routes", error);
    }
  },
  createRoute: async (r) => {
    try {
      const res = await routesApi.create(r);
      if (res.success) {
        // Keep full stop objects here too
        set((s) => ({ routes: [res.data, ...s.routes] }));
        return true;
      }
      alert(res.message || "Failed to create route");
      return false;
    } catch (error: any) {
      console.error("Failed to create route", error);
      alert(error.message || "Error creating route. Please ensure all fields and at least one stop are selected.");
      return false;
    }
  },
  updateRoute: async (id, updates) => {
    try {
      const res = await routesApi.update(id, updates);
      if (res.success) {
        set((s) => ({
          routes: s.routes.map((r) => (r.id === id ? { ...r, ...res.data } : r)),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update route", error);
      return false;
    }
  },
  deleteRoute: async (id) => {
    try {
      const res = await routesApi.delete(id);
      if (res.success) {
        set((s) => ({ routes: s.routes.filter((r) => r.id !== id) }));
      }
    } catch (error) {
      console.error("Failed to delete route", error);
    }
  },
  filterByStatus: (status) => {
    const { routes } = get();
    return status === "all" ? routes : routes.filter((r) => r.status === status);
  },
}));

