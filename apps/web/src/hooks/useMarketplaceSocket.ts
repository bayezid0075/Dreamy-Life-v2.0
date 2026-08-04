import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const MARKETPLACE_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let marketplaceSocket: Socket | null = null;

export function getMarketplaceSocket(): Socket | null {
  return marketplaceSocket;
}

export function connectMarketplaceSocket(token: string): Socket {
  if (marketplaceSocket?.connected) return marketplaceSocket;

  marketplaceSocket = io(`${MARKETPLACE_WS_URL}/marketplace`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  marketplaceSocket.on('connect', () => {
    console.log('[Marketplace Socket] Connected');
  });

  marketplaceSocket.on('disconnect', (reason) => {
    console.log('[Marketplace Socket] Disconnected:', reason);
  });

  marketplaceSocket.on('connect_error', (err) => {
    console.error('[Marketplace Socket] Connection error:', err.message);
  });

  return marketplaceSocket;
}

export function disconnectMarketplaceSocket() {
  if (marketplaceSocket) {
    marketplaceSocket.disconnect();
    marketplaceSocket = null;
  }
}

export function useMarketplaceSocket(
  token: string | null,
  handlers: {
    onJobCreated?: (data: any) => void;
    onJobApproved?: (data: any) => void;
    onJobRejected?: (data: any) => void;
    onNewSubmission?: (data: any) => void;
    onSubmissionApproved?: (data: any) => void;
    onSubmissionRejected?: (data: any) => void;
    onJobCancelled?: (data: any) => void;
    onPaymentReleased?: (data: any) => void;
    onJobUpdated?: (data: any) => void;
  }
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = connectMarketplaceSocket(token);
    socketRef.current = socket;

    if (handlers.onJobCreated) socket.on('job:created', handlers.onJobCreated);
    if (handlers.onJobApproved) socket.on('job:approved', handlers.onJobApproved);
    if (handlers.onJobRejected) socket.on('job:rejected', handlers.onJobRejected);
    if (handlers.onNewSubmission) socket.on('job:submission:new', handlers.onNewSubmission);
    if (handlers.onSubmissionApproved) socket.on('job:submission:approved', handlers.onSubmissionApproved);
    if (handlers.onSubmissionRejected) socket.on('job:submission:rejected', handlers.onSubmissionRejected);
    if (handlers.onJobCancelled) socket.on('job:cancelled', handlers.onJobCancelled);
    if (handlers.onPaymentReleased) socket.on('job:payment:released', handlers.onPaymentReleased);
    if (handlers.onJobUpdated) socket.on('job:updated', handlers.onJobUpdated);

    return () => {
      if (handlers.onJobCreated) socket.off('job:created', handlers.onJobCreated);
      if (handlers.onJobApproved) socket.off('job:approved', handlers.onJobApproved);
      if (handlers.onJobRejected) socket.off('job:rejected', handlers.onJobRejected);
      if (handlers.onNewSubmission) socket.off('job:submission:new', handlers.onNewSubmission);
      if (handlers.onSubmissionApproved) socket.off('job:submission:approved', handlers.onSubmissionApproved);
      if (handlers.onSubmissionRejected) socket.off('job:submission:rejected', handlers.onSubmissionRejected);
      if (handlers.onJobCancelled) socket.off('job:cancelled', handlers.onJobCancelled);
      if (handlers.onPaymentReleased) socket.off('job:payment:released', handlers.onPaymentReleased);
      if (handlers.onJobUpdated) socket.off('job:updated', handlers.onJobUpdated);
    };
  }, [token]);

  const subscribeToJob = useCallback((jobId: string) => {
    socketRef.current?.emit('job:subscribe', { jobId });
  }, []);

  const unsubscribeFromJob = useCallback((jobId: string) => {
    socketRef.current?.emit('job:unsubscribe', { jobId });
  }, []);

  return { subscribeToJob, unsubscribeFromJob };
}
