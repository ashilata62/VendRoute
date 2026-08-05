import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.14:5000';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
    
    socket.on('connect', () => {
      console.log('Mobile App Socket Connected:', socket?.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Mobile App Socket Disconnected');
    });
  }
  return socket;
};
