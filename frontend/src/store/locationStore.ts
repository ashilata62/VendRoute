import { create } from "zustand";
import { mockLocations } from "../data/mockData";
import type { VendingLocation, LocationStatus, MachineType } from "../types";

interface LocationFilters {
  status: LocationStatus | "all";
  machineType: MachineType | "all";
  search: string;
}

interface LocationState {
  locations: VendingLocation[];
  selectedLocation: VendingLocation | null;
  filters: LocationFilters;
  setSelectedLocation: (l: VendingLocation | null) => void;
  setFilter: <K extends keyof LocationFilters>(key: K, val: LocationFilters[K]) => void;
  filteredLocations: () => VendingLocation[];
  addLocation: (loc: VendingLocation) => void;
  updateLocation: (id: string, updates: Partial<VendingLocation>) => void;
  deleteLocation: (id: string) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  locations: mockLocations,
  selectedLocation: null,
  filters: { status: "all", machineType: "all", search: "" },
  setSelectedLocation: (l) => set({ selectedLocation: l }),
  setFilter: (key, val) =>
    set((s) => ({ filters: { ...s.filters, [key]: val } })),
  filteredLocations: () => {
    const { locations, filters } = get();
    return locations.filter((l) => {
      const matchStatus = filters.status === "all" || l.status === filters.status;
      const matchType = filters.machineType === "all" || l.machineType === filters.machineType;
      const matchSearch =
        !filters.search ||
        l.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        l.address.toLowerCase().includes(filters.search.toLowerCase()) ||
        l.machineId.toLowerCase().includes(filters.search.toLowerCase());
      return matchStatus && matchType && matchSearch;
    });
  },
  addLocation: (loc) =>
    set((s) => ({ locations: [loc, ...s.locations] })),
  updateLocation: (id, updates) =>
    set((s) => ({
      locations: s.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  deleteLocation: (id) =>
    set((s) => ({
      locations: s.locations.filter((l) => l.id !== id),
    })),
}));
