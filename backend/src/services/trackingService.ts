import { Server } from 'socket.io';

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

// Initial set of simulated drivers spread out in Mumbai
let activeDrivers: DriverLocation[] = [
  { driverId: "d1", lat: 19.0596, lng: 72.8656, speed: 32, heading: 45, timestamp: new Date().toISOString() },
  { driverId: "d2", lat: 19.1196, lng: 72.9050, speed: 15, heading: 90, timestamp: new Date().toISOString() },
  { driverId: "d3", lat: 19.1120, lng: 72.8692, speed: 28, heading: 180, timestamp: new Date().toISOString() },
  { driverId: "d4", lat: 19.1869, lng: 72.9634, speed: 45, heading: 270, timestamp: new Date().toISOString() },
  { driverId: "d6", lat: 19.0743, lng: 73.0073, speed: 20, heading: 315, timestamp: new Date().toISOString() },
];

export const startTrackingSimulation = (io: Server) => {
  console.log("🚦 Starting Driver Location Simulation Service...");

  // Broadcast location updates every 3 seconds
  setInterval(() => {
    activeDrivers = activeDrivers.map((driver) => {
      // Simulate slight movement
      const deltaLat = (Math.random() - 0.5) * 0.003;
      const deltaLng = (Math.random() - 0.5) * 0.003;
      
      // Simulate speed changes between 10 and 60 km/h
      const newSpeed = Math.max(10, Math.min(60, driver.speed + (Math.random() - 0.5) * 10));
      
      // Slight heading adjustments
      const newHeading = (driver.heading + (Math.random() - 0.5) * 20) % 360;

      const updatedDriver = {
        ...driver,
        lat: driver.lat + deltaLat,
        lng: driver.lng + deltaLng,
        speed: Math.round(newSpeed),
        heading: Math.round(newHeading),
        timestamp: new Date().toISOString(),
      };

      // Emit broadcast for this driver
      io.emit('tracking:location_broadcast', updatedDriver);

      return updatedDriver;
    });
  }, 3000); // 3 second intervals for smooth realistic tracking
};
