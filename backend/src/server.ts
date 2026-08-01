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

io.on('connection', (socket) => {
  console.log(`🔌 Socket Client Connected: ${socket.id}`);

  // Driver emits GPS location
  socket.on('driver:location_update', (data) => {
    // Broadcast location update to Admin tracking map
    socket.broadcast.emit('tracking:location_broadcast', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket Client Disconnected: ${socket.id}`);
  });
});

server.listen(ENV.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 VendRoute Backend Running on http://localhost:${ENV.PORT}`);
  console.log(`📌 API Health Check: http://localhost:${ENV.PORT}/health`);
  console.log(`====================================================`);
});
