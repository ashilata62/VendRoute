import { create } from "zustand";
import { mockLocations } from "../data/mockData";
import type { VendingLocation, LocationStatus, MachineType } from "../types";
import { api } from "../services/api";

interface LocationFilters {
  status: LocationStatus | "all";
  machineType: MachineType | "all";
  search: string;
}

interface LocationState {
  locations: VendingLocation[];
  selectedLocation: VendingLocation | null;
  filters: LocationFilters;
  loading: boolean;
  fetchLocations: () => Promise<void>;
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
  loading: false,

  fetchLocations: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/locations');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Map backend location model to frontend VendingLocation interface
        const mapped: VendingLocation[] = res.data.map((item: any) => ({
          id: item.id,
          customerName: item.name || item.customer?.companyName || 'Location Customer',
          address: `${item.address}, ${item.city}`,
          lat: item.latitude,
          lng: item.longitude,
          contactPerson: item.customer?.contactPerson || 'Facility Manager',
          contactPhone: item.customer?.phone || '+919876543210',
          machineId: item.machines?.[0]?.machineCode || 'VEND-2026',
          machineType: 'Combo',
          products: ['Snacks', 'Beverages', 'Water'],
          visitFrequency: 'Weekly',
          lastServiceDate: new Date().toISOString().split('T')[0],
          nextServiceDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: item.machines?.[0]?.status === 'NEEDS_MAINTENANCE' ? 'needs-service' : 'operational',
          notes: 'Regular scheduled service location',
          photoGallery: [],
          customerId: item.customerId,
          revenue: 12500,
        }));
        set({ locations: mapped, loading: false });
        return;
      }
    } catch (err) {
      console.warn('Backend API connection fallback to mock data:', err);
    }
    set({ loading: false });
  },

  setSelectedLocation: (l) => set({ selectedLocation: l }),
  setFilter: (key, val) => set((s) => ({ filters: { ...s.filters, [key]: val } })),
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
  addLocation: (loc) => set((s) => ({ locations: [loc, ...s.locations] })),
  updateLocation: (id, updates) =>
    set((s) => ({
      locations: s.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  deleteLocation: (id) =>
    set((s) => ({
      locations: s.locations.filter((l) => l.id !== id),
    })),
}));
