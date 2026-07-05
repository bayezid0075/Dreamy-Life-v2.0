import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationStore } from '@/shared/stores/notificationStore';

const SOCKET_URL = process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:4000';

export function useNotificationSocket() {
  const socketRef = useRef<Socket | null>(null);
  const incrementCount = useNotificationStore((s) => s.incrementCount);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token || cancelled) return;

      const socket = io(`${SOCKET_URL}/notifications`, {
        auth: { token },
        transports: ['websocket'],
      });

      socketRef.current = socket;

      socket.on('notification:new', () => {
        incrementCount();
      });

      socket.on('connect_error', () => {
        socket.disconnect();
      });
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [incrementCount]);

  return socketRef.current;
}
