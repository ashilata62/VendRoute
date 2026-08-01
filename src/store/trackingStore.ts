import { create } from "zustand";
import { mockDrivers } from "../data/mockData";
import type { Driver } from "../types";

interface LiveLocation {
  driverId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

interface TrackingState {
  drivers: Driver[];
  liveLocations: LiveLocation[];
  selectedDriver: Driver | null;
  isTracking: boolean;
  setSelectedDriver: (d: Driver | null) => void;
  startTracking: () => void;
  stopTracking: () => void;
  updateLocation: (loc: LiveLocation) => void;
}

// Seed initial live locations around Mumbai
const initialLocations: LiveLocation[] = [
  { driverId: "d1", lat: 19.0596, lng: 72.8656, speed: 32, heading: 45, timestamp: new Date().toISOString() },
  { driverId: "d2", lat: 19.1196, lng: 72.9050, speed: 0, heading: 0, timestamp: new Date().toISOString() },
  { driverId: "d3", lat: 19.1120, lng: 72.8692, speed: 28, heading: 180, timestamp: new Date().toISOString() },
  { driverId: "d4", lat: 19.1869, lng: 72.9634, speed: 0, heading: 0, timestamp: new Date().toISOString() },
  { driverId: "d6", lat: 19.0743, lng: 73.0073, speed: 0, heading: 0, timestamp: new Date().toISOString() },
];

export const useTrackingStore = create<TrackingState>((set) => ({
  drivers: mockDrivers,
  liveLocations: initialLocations,
  selectedDriver: null,
  isTracking: false,
  setSelectedDriver: (d) => set({ selectedDriver: d }),
  startTracking: () => set({ isTracking: true }),
  stopTracking: () => set({ isTracking: false }),
  updateLocation: (loc) =>
    set((s) => ({
      liveLocations: s.liveLocations.map((l) =>
        l.driverId === loc.driverId ? loc : l
      ),
    })),
}));
