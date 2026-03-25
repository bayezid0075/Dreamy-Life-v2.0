"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const getWsUrl = () => {
  if (typeof window === "undefined") return null;
  const explicit = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (explicit) {
    const wsProtocol = explicit.startsWith("https") ? "wss" : "ws";
    const host = explicit.replace(/^https?:\/\//, "");
    return `${wsProtocol}://${host}/ws/marketplace/`;
  }
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const p = window.location.port;
  const useBackendPort =
    p === "3333" || p === "3000" || p === "3001";
  const hostPort = useBackendPort
    ? `${window.location.hostname}:8888`
    : window.location.host;
  return `${proto}://${hostPort}/ws/marketplace/`;
};

/**
 * Subscribe to marketplace WebSocket for live updates.
 * Invalidates relevant queries on job_reviewed / submission_reviewed events.
 */
export function useMarketplaceSocket(enabled = true) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const url = getWsUrl();
    if (!url) return;

    const connect = () => {
      try {
        const ws = new WebSocket(url);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === "job_reviewed" || data.event === "submission_reviewed") {
              queryClient.invalidateQueries({ queryKey: ["marketplace-public"] });
              queryClient.invalidateQueries({ queryKey: ["marketplace-my-jobs"] });
              queryClient.invalidateQueries({ queryKey: ["marketplace-admin-jobs"] });
              queryClient.invalidateQueries({ queryKey: ["marketplace-submissions"] });
              if (data.job_id) {
                queryClient.invalidateQueries({ queryKey: ["marketplace-my-job", data.job_id] });
                queryClient.invalidateQueries({ queryKey: ["marketplace-public-job", data.job_id] });
              }
            }
          } catch {
            // ignore parse errors
          }
        };
        ws.onclose = () => {
          wsRef.current = null;
          reconnectRef.current = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws.close();
        wsRef.current = ws;
      } catch {
        reconnectRef.current = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, queryClient]);
}
