/**
 * NexusAI — Realtime Pipeline
 * WebSocket manager for live alert streaming, AI response streaming,
 * and presence/collaboration features. Handles reconnection, message
 * ordering, and workspace-scoped channel isolation.
 */

import { authService } from "./AuthService";

/* ── Message Types ──────────────────────────────────────────────────── */

export type RealtimeEventType =
  | "alert.created"         | "alert.updated"       | "alert.assigned"
  | "sar.status_changed"    | "sar.approved"         | "sar.submitted"
  | "kyc.completed"         | "kyc.flagged"
  | "rule.triggered"        | "rule.updated"
  | "model.inference_done"  | "model.stream_chunk"
  | "presence.join"         | "presence.leave"
  | "notification.system"   | "notification.user"
  | "workspace.settings_changed"
  | "ping"                  | "pong";

export interface RealtimeMessage<T = unknown> {
  id:          string;
  type:        RealtimeEventType;
  workspaceId: string;
  payload:     T;
  timestamp:   string;
  sequence:    number;              // monotonic — detect gaps
}

export type RealtimeHandler<T = unknown> = (message: RealtimeMessage<T>) => void;

export interface SubscriptionHandle {
  unsubscribe: () => void;
}

/* ── Realtime Pipeline ──────────────────────────────────────────────── */

export class RealtimePipeline {
  private ws?:           WebSocket;
  private status:        "disconnected" | "connecting" | "connected" | "reconnecting" = "disconnected";
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private pingTimer?:    ReturnType<typeof setInterval>;
  private reconnectAttempts = 0;
  private lastSequence   = 0;
  private handlers:      Map<string, Set<RealtimeHandler>> = new Map();
  private queuedMessages: RealtimeMessage[] = [];  // messages received while handlers loading
  private workspaceId?:  string;

  private readonly WS_URL_BASE   = import.meta.env.VITE_WS_URL ?? "wss://api.nexusai.ca/ws/v1";
  private readonly PING_INTERVAL = 25_000;
  private readonly MAX_RECONNECT = 10;
  private readonly BASE_BACKOFF  = 1_000;

  /* ── Connect ─────────────────────────────────────────────────────── */

  async connect(workspaceId: string): Promise<void> {
    if (this.status === "connected" || this.status === "connecting") return;
    this.workspaceId = workspaceId;
    this.status      = "connecting";

    const token = authService.isTokenExpired()
      ? await authService.refreshAccessToken()
      : authService.getAccessToken();

    const url = `${this.WS_URL_BASE}?workspace=${workspaceId}&token=${token}`;
    this.ws   = new WebSocket(url);

    this.ws.onopen    = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose   = this.onClose.bind(this);
    this.ws.onerror   = this.onError.bind(this);
  }

  disconnect(): void {
    this.reconnectAttempts = this.MAX_RECONNECT; // prevent auto-reconnect
    this.cleanup();
    this.ws?.close(1000, "User initiated disconnect");
    this.status = "disconnected";
  }

  /* ── Subscribe to event types ────────────────────────────────────── */

  on<T = unknown>(eventType: RealtimeEventType, handler: RealtimeHandler<T>): SubscriptionHandle {
    if (!this.handlers.has(eventType)) this.handlers.set(eventType, new Set());
    this.handlers.get(eventType)!.add(handler as RealtimeHandler);

    // Deliver any queued messages for this type
    this.queuedMessages
      .filter(m => m.type === eventType)
      .forEach(m => handler(m as RealtimeMessage<T>));

    return { unsubscribe: () => this.handlers.get(eventType)?.delete(handler as RealtimeHandler) };
  }

  onAny(handler: RealtimeHandler): SubscriptionHandle {
    return this.on("ping", handler);  // ping fires frequently — use specific types instead
  }

  once<T = unknown>(eventType: RealtimeEventType): Promise<RealtimeMessage<T>> {
    return new Promise(resolve => {
      const handle = this.on<T>(eventType, (msg) => {
        handle.unsubscribe();
        resolve(msg);
      });
    });
  }

  /* ── Send ────────────────────────────────────────────────────────── */

  send<T>(type: RealtimeEventType, payload: T): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("[RealtimePipeline] Cannot send — not connected");
      return;
    }
    this.ws.send(JSON.stringify({
      id:          crypto.randomUUID(),
      type,
      workspaceId: this.workspaceId,
      payload,
      timestamp:   new Date().toISOString(),
    }));
  }

  getStatus(): typeof this.status { return this.status; }

  /* ── WebSocket Lifecycle ─────────────────────────────────────────── */

  private onOpen(): void {
    this.status            = "connected";
    this.reconnectAttempts = 0;
    this.startPing();
  }

  private onMessage(event: MessageEvent): void {
    let message: RealtimeMessage;
    try { message = JSON.parse(event.data as string); } catch { return; }

    if (message.type === "pong") return;

    // Sequence gap detection
    if (message.sequence > this.lastSequence + 1) {
      // Request missed messages from server
      this.send("ping", { since: this.lastSequence });
    }
    this.lastSequence = message.sequence;

    const handlers = this.handlers.get(message.type);
    if (!handlers || handlers.size === 0) {
      // Queue for late subscribers
      if (this.queuedMessages.length < 100) this.queuedMessages.push(message);
      return;
    }
    handlers.forEach(h => { try { h(message); } catch { /* handler errors isolated */ } });
  }

  private onClose(event: CloseEvent): void {
    this.cleanup();
    if (event.code === 1000) { this.status = "disconnected"; return; }  // intentional close
    if (event.code === 4001) { this.status = "disconnected"; return; }  // auth failure — don't retry

    this.scheduleReconnect();
  }

  private onError(): void {
    this.cleanup();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT) {
      this.status = "disconnected";
      return;
    }
    this.status = "reconnecting";
    const backoff = Math.min(this.BASE_BACKOFF * 2 ** this.reconnectAttempts, 30_000);
    const jitter  = Math.random() * 1000;
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      if (this.workspaceId) this.connect(this.workspaceId);
    }, backoff + jitter);
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send("ping", { at: Date.now() });
    }, this.PING_INTERVAL);
  }

  private cleanup(): void {
    if (this.pingTimer)     clearInterval(this.pingTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
  }
}

export const realtimePipeline = new RealtimePipeline();
