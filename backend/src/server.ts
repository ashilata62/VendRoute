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

import { startTrackingSimulation } from './services/trackingService.js';

// Map socket ID to driver ID for status tracking
const activeDriverSockets = new Map<string, string>();

io.on('connection', (socket) => {
  console.log(`🔌 Socket Client Connected: ${socket.id}`);

  // Driver registers/connects and sets status (ONLINE / OFFLINE / ON_ROUTE)
  socket.on('driver:status_change', (data: { driverId: string; status: string }) => {
    if (data.driverId) {
      activeDriverSockets.set(socket.id, data.driverId);
      console.log(`📡 Driver ${data.driverId} Status Changed -> ${data.status}`);
      io.emit('driver:status_broadcast', { driverId: data.driverId, status: data.status, timestamp: new Date().toISOString() });
    }
  });

  // Driver emits GPS location update
  socket.on('driver:location_update', (data) => {
    // Broadcast location update to Admin tracking map
    io.emit('tracking:location_broadcast', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket Client Disconnected: ${socket.id}`);
    const driverId = activeDriverSockets.get(socket.id);
    if (driverId) {
      activeDriverSockets.delete(socket.id);
      io.emit('driver:status_broadcast', { driverId, status: 'OFFLINE', timestamp: new Date().toISOString() });
    }
  });
});

// Start the simulation service to broadcast driver locations
startTrackingSimulation(io);

server.listen(ENV.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 VendRoute Backend Running on http://localhost:${ENV.PORT}`);
  console.log(`📌 API Health Check: http://localhost:${ENV.PORT}/health`);
  console.log(`====================================================`);
});
