/**
 * NexusAI — Observability Configuration
 * Structured logging, distributed tracing, metrics collection, and alerting.
 * Frontend sends telemetry to CloudWatch via the API; never directly.
 */

/* ── Log Levels ─────────────────────────────────────────────────────── */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface StructuredLog {
  level:        LogLevel;
  message:      string;
  timestamp:    string;
  requestId?:   string;
  userId?:      string;
  workspaceId?: string;
  sessionId?:   string;
  service:      string;
  version:      string;
  environment:  string;
  duration?:    number;             // ms
  error?:       { code: string; message: string; stack?: string };
  metadata?:    Record<string, unknown>;
}

/* ── Client-Side Logger ─────────────────────────────────────────────── */

const REDACT_KEYS = new Set([
  "password", "token", "secret", "key", "authorization",
  "ssn", "sin", "passport", "creditCard", "cvv",
]);

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      REDACT_KEYS.has(k.toLowerCase()) ? "[REDACTED]" : v,
    ]),
  );
}

class Logger {
  private readonly service     = "nexusai-frontend";
  private readonly version     = import.meta.env.VITE_APP_VERSION ?? "dev";
  private readonly environment = import.meta.env.MODE ?? "development";
  private readonly minLevel    = this.levelNum(import.meta.env.VITE_LOG_LEVEL as LogLevel ?? "info");

  private levelNum(level: LogLevel): number {
    return { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 }[level] ?? 1;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (this.levelNum(level) < this.minLevel) return;

    const entry: StructuredLog = {
      level,
      message,
      timestamp:   new Date().toISOString(),
      service:     this.service,
      version:     this.version,
      environment: this.environment,
      metadata:    metadata ? redact(metadata) : undefined,
    };

    // In development: pretty-print to console
    if (this.environment === "development") {
      const fn = level === "error" || level === "fatal" ? console.error
               : level === "warn"                       ? console.warn
               :                                          console.log;
      fn(`[${level.toUpperCase()}] ${message}`, metadata ?? "");
      return;
    }

    // In production: batch and send to API
    this.buffer.push(entry);
    if (this.buffer.length >= 20) this.flush();
  }

  private buffer: StructuredLog[] = [];
  private flushTimer?: ReturnType<typeof setTimeout>;

  debug(message: string, metadata?: Record<string, unknown>): void { this.log("debug", message, metadata); }
  info (message: string, metadata?: Record<string, unknown>): void { this.log("info",  message, metadata); }
  warn (message: string, metadata?: Record<string, unknown>): void { this.log("warn",  message, metadata); }
  error(message: string, err?: unknown, metadata?: Record<string, unknown>): void {
    const errorMeta = err instanceof Error
      ? { code: (err as { code?: string }).code ?? "UNKNOWN", message: err.message, stack: err.stack }
      : undefined;
    this.log("error", message, { ...metadata, error: errorMeta });
  }
  fatal(message: string, err?: unknown, metadata?: Record<string, unknown>): void {
    this.error(message, err, metadata);
    this.flush({ sync: true });
  }

  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      this.info(`${label} completed`, { duration });
    };
  }

  private flush(opts: { sync?: boolean } = {}): void {
    if (this.buffer.length === 0) return;
    const entries = this.buffer.splice(0);
    const payload = JSON.stringify({ logs: entries });

    if (opts.sync && navigator.sendBeacon) {
      navigator.sendBeacon("/api/v1/telemetry/logs", new Blob([payload], { type: "application/json" }));
      return;
    }
    fetch("/api/v1/telemetry/logs", { method: "POST", body: payload, keepalive: true }).catch(() => {});
  }
}

export const logger = new Logger();

/* ── Performance Metrics ─────────────────────────────────────────────── */

export interface WebVital {
  name:    "CLS" | "FID" | "FCP" | "INP" | "LCP" | "TTFB";
  value:   number;
  rating:  "good" | "needs-improvement" | "poor";
  id:      string;
  delta:   number;
}

export function reportWebVital(vital: WebVital): void {
  const body = JSON.stringify({ vitals: [vital] });
  navigator.sendBeacon?.("/api/v1/telemetry/vitals", new Blob([body], { type: "application/json" }));
}

/* ── Error Boundary telemetry ────────────────────────────────────────── */

export function reportError(error: Error, context?: Record<string, unknown>): void {
  logger.error("Unhandled React error", error, context);
}
