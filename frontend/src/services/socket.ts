import { io, Socket } from "socket.io-client";

// Ensure we connect to the IPv4 address to avoid browser security restrictions
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL?.replace("localhost", "127.0.0.1") || "http://127.0.0.1:5000";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    
    socket.on("connect", () => {
      console.log("🔌 Connected to VendRoute WebSocket Server");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from VendRoute WebSocket Server");
    });
  }
  return socket;
};
