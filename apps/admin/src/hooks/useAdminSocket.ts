import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useAdminSocket(onEvent?: (event: string, data: any) => void) {
  const socketRef = useRef<Socket | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(`${SOCKET_URL}/admin`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    const events = ['user:update', 'visitor:new', 'stats:update'];
    events.forEach((event) => {
      socket.on(event, (data) => {
        onEventRef.current?.(event, data);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [getToken]);

  return socketRef.current;
}
