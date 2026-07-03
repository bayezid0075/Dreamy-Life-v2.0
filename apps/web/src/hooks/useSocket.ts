import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('user:online', (data: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(data.userId));
    });

    socket.on('user:offline', (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:join', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:leave', { conversationId });
  }, []);

  const sendMessage = useCallback(
    (data: {
      conversationId: string;
      content?: string;
      mediaUrl?: string;
      mediaType?: string;
      replyTo?: string;
    }) => {
      socketRef.current?.emit('message:send', data);
    },
    [],
  );

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:start', { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:stop', { conversationId });
  }, []);

  const markRead = useCallback((conversationId: string, messageId: string) => {
    socketRef.current?.emit('message:read', { conversationId, messageId });
  }, []);

  const onMessage = useCallback((callback: (message: any) => void) => {
    socketRef.current?.on('message:new', callback);
    return () => {
      socketRef.current?.off('message:new', callback);
    };
  }, []);

  const onTypingStart = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('typing:start', callback);
    return () => {
      socketRef.current?.off('typing:start', callback);
    };
  }, []);

  const onTypingStop = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('typing:stop', callback);
    return () => {
      socketRef.current?.off('typing:stop', callback);
    };
  }, []);

  const onMessageRead = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('message:read', callback);
    return () => {
      socketRef.current?.off('message:read', callback);
    };
  }, []);

  const onConversationCreated = useCallback((callback: (conversation: any) => void) => {
    socketRef.current?.on('conversation:created', callback);
    return () => {
      socketRef.current?.off('conversation:created', callback);
    };
  }, []);

  const onMessageStatus = useCallback((callback: (data: { messageId: string; status: string }) => void) => {
    socketRef.current?.on('message:status', callback);
    return () => {
      socketRef.current?.off('message:status', callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    onMessage,
    onTypingStart,
    onTypingStop,
    onMessageRead,
    onConversationCreated,
    onMessageStatus,
  };
}
