import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectFeedSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:4000', {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
};

export const disconnectFeedSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getFeedSocket = (): Socket | null => socket;
