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
  seedLocationsFromDrivers: (driverIds: (string | { id: string; startLat?: number; startLng?: number })[]) => void;
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
    // Seeds demo GPS pins using real driver UUIDs from DB
    seedLocationsFromDrivers: (driversData: (string | { id: string; startLat?: number; startLng?: number })[]) => {
      const offsets = [
        { lat: -0.015, lng: -0.021 },
        { lat:  0.040, lng:  0.027 },
        { lat:  0.035, lng: -0.008 },
        { lat:  0.110, lng:  0.086 },
        { lat: -0.002, lng:  0.119 },
        { lat:  0.060, lng: -0.040 },
      ];
      set((s) => {
        // Map driver data format to structured items
        const items = driversData.map((item) => {
          if (typeof item === "string") {
            return { id: item, startLat: undefined, startLng: undefined };
          }
          return item;
        });

        // 1. Update any existing locations if they were seeded near Mumbai but now have customized coordinates
        const updatedLocations = s.liveLocations.map((loc) => {
          const matchingItem = items.find(item => item.id === loc.driverId);
          if (matchingItem) {
            const hasCustomCoords = matchingItem.startLat !== undefined && matchingItem.startLng !== undefined && matchingItem.startLat !== null && matchingItem.startLng !== null;
            const isNearMumbai = Math.abs(loc.lat - MUMBAI_CENTER.lat) < 0.2 && Math.abs(loc.lng - MUMBAI_CENTER.lng) < 0.2;
            if (hasCustomCoords && isNearMumbai) {
              return {
                ...loc,
                lat: Number(matchingItem.startLat),
                lng: Number(matchingItem.startLng),
                timestamp: new Date().toISOString(),
              };
            }
          }
          return loc;
        });

        // 2. Create new locations for drivers that are not already tracked
        const existingIds = new Set(updatedLocations.map(l => l.driverId));
        const newLocs: LiveLocation[] = items
          .filter(item => !existingIds.has(item.id))
          .map((item, i) => {
            const hasCustomCoords = item.startLat !== undefined && item.startLng !== undefined && item.startLat !== null && item.startLng !== null;
            const baseLat = hasCustomCoords ? Number(item.startLat) : MUMBAI_CENTER.lat;
            const baseLng = hasCustomCoords ? Number(item.startLng) : MUMBAI_CENTER.lng;
            return {
              driverId: item.id,
              lat: baseLat + (hasCustomCoords ? 0 : (offsets[i % offsets.length]?.lat ?? 0)),
              lng: baseLng + (hasCustomCoords ? 0 : (offsets[i % offsets.length]?.lng ?? 0)),
              speed: Math.floor(Math.random() * 40) + 10,
              heading: Math.floor(Math.random() * 360),
              timestamp: new Date().toISOString(),
            };
          });

        return { liveLocations: [...updatedLocations, ...newLocs] };
      });
    },
  };
});

