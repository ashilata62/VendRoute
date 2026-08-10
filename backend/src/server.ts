import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { ENV } from './config/env.js';

const server = http.createServer(app);

// Socket.io for Real-time GPS Tracking
export const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Map socket ID to driver ID for status tracking
const activeDriverSockets = new Map<string, string>();

io.on('connection', (socket) => {
  console.log(`🔌 Socket Client Connected: ${socket.id}`);

  // Driver registers/connects and sets status (ONLINE / OFFLINE / ON_ROUTE)
  socket.on('user:status_change', (data: {  driverId: string; status: string }) => {
    if (data.driverId) {
      activeDriverSockets.set(socket.id, data.driverId);
      console.log(`📡 Driver ${data.driverId} Status Changed -> ${data.status}`);
      io.emit('user:status_broadcast', { driverId: data.driverId, status: data.status, timestamp: new Date().toISOString() });
    }
  });

  // Throttle writes to DB (only save once every 10 seconds per driver)
  const lastWriteTimes = new Map<string, number>();

  // Driver emits GPS location update (supports user:location_update & driver:location_update)
  const handleLocationUpdate = async (data: any) => {
    const driverId = data.driverId || activeDriverSockets.get(socket.id);
    if (!driverId && !data.latitude) return;

    const lat = data.latitude ?? data.lat;
    const lng = data.longitude ?? data.lng;
    if (lat === undefined || lng === undefined) return;

    const enrichedData = {
      driverId: driverId || 'unknown',
      latitude: lat,
      longitude: lng,
      lat: lat,
      lng: lng,
      speed: data.speed || 0,
      heading: data.heading || 0,
      accuracy: data.accuracy || 0,
      timestamp: new Date().toISOString(),
    };

    // Broadcast location update to Admin tracking map & vehicles map instantly
    io.emit('tracking:location_broadcast', enrichedData);

    const now = Date.now();
    const lastWrite = lastWriteTimes.get(driverId) || 0;
    
    // Throttle database writes to every 15 seconds per driver
    if (now - lastWrite > 15000 && driverId && driverId !== 'unknown') {
      lastWriteTimes.set(driverId, now);
      try {
        await prisma.livetracking.create({
          data: {
            id: uuidv4(),
            driverId: driverId,
            latitude: lat,
            longitude: lng,
            speed: enrichedData.speed,
            heading: enrichedData.heading,
            accuracy: enrichedData.accuracy,
          }
        });
      } catch (err) {
        console.error('Failed to save GPS history:', err);
      }
    }
  };

  socket.on('user:location_update', handleLocationUpdate);
  socket.on('driver:location_update', handleLocationUpdate);

  socket.on('disconnect', () => {
    console.log(`❌ Socket Client Disconnected: ${socket.id}`);
    const driverId = activeDriverSockets.get(socket.id);
    if (driverId) {
      activeDriverSockets.delete(socket.id);
      io.emit('user:status_broadcast', { driverId, status: 'OFFLINE', timestamp: new Date().toISOString() });
    }
  });
});

// Start the simulation service to broadcast driver locations
// Removed mock simulation
// startTrackingSimulation(io);

server.listen(ENV.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 VendRoute Backend Running on http://localhost:${ENV.PORT}`);
  console.log(`📌 API Health Check: http://localhost:${ENV.PORT}/health`);
  console.log(`====================================================`);
});
