/**
 * NexusAI — useRealtime Hook
 * Subscribe to realtime events (alerts, SAR updates, AI responses)
 * from the WebSocket pipeline with automatic cleanup on unmount.
 */

import { useEffect, useRef, useCallback } from "react";
import type { RealtimeEventType, RealtimeMessage, RealtimeHandler } from "../services/RealtimePipeline";
import { realtimePipeline } from "../services/RealtimePipeline";

export function useRealtime<T = unknown>(
  eventType: RealtimeEventType,
  handler: RealtimeHandler<T>,
  deps: unknown[] = [],
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const stableHandler: RealtimeHandler<T> = (msg) => handlerRef.current(msg);
    const handle = realtimePipeline.on<T>(eventType, stableHandler);
    return () => handle.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...deps]);
}

/* ── Alert-specific convenience hooks ──────────────────────────────── */

export function useAlertStream(onNewAlert: (alertId: string, riskLevel: string) => void): void {
  useRealtime<{ alertId: string; riskLevel: string; entityName: string }>(
    "alert.created",
    useCallback((msg) => onNewAlert(msg.payload.alertId, msg.payload.riskLevel), [onNewAlert]),
  );
}

export function useSARStatusStream(onStatusChange: (sarId: string, status: string) => void): void {
  useRealtime<{ sarId: string; status: string; approvedBy?: string }>(
    "sar.status_changed",
    useCallback((msg) => onStatusChange(msg.payload.sarId, msg.payload.status), [onStatusChange]),
  );
}

/* ── Connection status ──────────────────────────────────────────────── */

export function useRealtimeStatus(): "disconnected" | "connecting" | "connected" | "reconnecting" {
  return realtimePipeline.getStatus();
}
