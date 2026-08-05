import { create } from "zustand";
import { getSocket } from "../services/socket";
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
  driverStatuses: Record<string, string>;
  selectedDriver: Driver | null;
  isTracking: boolean;
  setSelectedDriver: (d: Driver | null) => void;
  startTracking: () => void;
  stopTracking: () => void;
  updateLocation: (loc: LiveLocation) => void;
  seedLocationsFromDrivers: (driverIds: string[]) => void;
}

// Default city center for seeding demo pins (Mumbai)
const MUMBAI_CENTER = { lat: 19.076, lng: 72.8777 };

export const useTrackingStore = create<TrackingState>((set) => {
  const socket = getSocket();

  socket.on("tracking:location_broadcast", (loc: LiveLocation) => {
    set((s) => {
      const existing = s.liveLocations.find(l => l.driverId === loc.driverId);
      if (existing) {
        return {
          liveLocations: s.liveLocations.map((l) =>
            l.driverId === loc.driverId ? { ...l, ...loc } : l
          )
        };
      } else {
        return { liveLocations: [...s.liveLocations, loc] };
      }
    });
  });

  socket.on("driver:status_broadcast", (data: { driverId: string; status: string }) => {
    set((s) => ({
      driverStatuses: { ...s.driverStatuses, [data.driverId]: data.status }
    }));
  });

  return {
    drivers: [],
    liveLocations: [], // starts empty — filled by real WebSocket or seedLocationsFromDrivers
    driverStatuses: {},
    selectedDriver: null,
    isTracking: false,
    setSelectedDriver: (d) => set({ selectedDriver: d }),
    startTracking: () => set({ isTracking: true }),
    stopTracking: () => set({ isTracking: false }),
    updateLocation: (loc) =>
      set((s) => ({
        liveLocations: s.liveLocations.map((l) =>
          l.driverId === loc.driverId ? { ...l, ...loc } : l
        ),
      })),
    // Seeds demo GPS pins using real driver UUIDs from DB (spread around Mumbai area)
    seedLocationsFromDrivers: (driverIds: string[]) => {
      const offsets = [
        { lat: -0.015, lng: -0.021 },
        { lat:  0.040, lng:  0.027 },
        { lat:  0.035, lng: -0.008 },
        { lat:  0.110, lng:  0.086 },
        { lat: -0.002, lng:  0.119 },
        { lat:  0.060, lng: -0.040 },
      ];
      set((s) => {
        // Only seed if no real GPS data exists for these drivers
        const existingIds = new Set(s.liveLocations.map(l => l.driverId));
        const newLocs: LiveLocation[] = driverIds
          .filter(id => !existingIds.has(id))
          .map((id, i) => ({
            driverId: id,
            lat: MUMBAI_CENTER.lat + (offsets[i % offsets.length]?.lat ?? 0),
            lng: MUMBAI_CENTER.lng + (offsets[i % offsets.length]?.lng ?? 0),
            speed: Math.floor(Math.random() * 40) + 10,
            heading: Math.floor(Math.random() * 360),
            timestamp: new Date().toISOString(),
          }));
        return { liveLocations: [...s.liveLocations, ...newLocs] };
      });
    },
  };
});

