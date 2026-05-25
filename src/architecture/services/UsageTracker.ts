/**
 * NexusAI — Usage Tracker & Rate Limiter
 * Client-side metering buffer that batches usage records to the backend.
 * Also enforces soft limits with real-time feedback before hitting hard limits.
 */

import type { UsageMetric, WorkspaceUsageSummary, PlanLimits } from "../types/subscription";

/* ── Pending Record ────────────────────────────────────────────────── */

interface PendingUsageRecord {
  workspaceId: string;
  metric:      UsageMetric;
  value:       number;
  metadata?:   Record<string, unknown>;
  timestamp:   string;
}

/* ── Rate limit state (client-side shadow) ─────────────────────────── */

interface RateLimitState {
  requestsThisMinute:  number;
  requestsThisHour:    number;
  tokensThisMinute:    number;
  windowStartMinute:   number;
  windowStartHour:     number;
}

/* ── UsageTracker ──────────────────────────────────────────────────── */

export class UsageTracker {
  private buffer:       PendingUsageRecord[] = [];
  private flushTimer?:  ReturnType<typeof setInterval>;
  private rateLimitState: RateLimitState = {
    requestsThisMinute: 0, requestsThisHour: 0, tokensThisMinute: 0,
    windowStartMinute: Date.now(), windowStartHour: Date.now(),
  };
  private usageSummary?:   WorkspaceUsageSummary;
  private planLimits?:     PlanLimits;
  private readonly FLUSH_INTERVAL_MS = 10_000;  // flush every 10 seconds
  private readonly MAX_BUFFER        = 500;

  start(): void {
    this.flushTimer = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
    // Flush before page unload
    window.addEventListener("beforeunload", () => this.flush({ sync: true }));
  }

  stop(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
  }

  /* ── Record a usage event ────────────────────────────────────────── */

  record(workspaceId: string, metric: UsageMetric, value: number, metadata?: Record<string, unknown>): void {
    this.buffer.push({ workspaceId, metric, value, metadata, timestamp: new Date().toISOString() });

    // Update client-side rate limit shadow
    if (metric === "api_requests") this.updateRequestCount();
    if (metric === "ai_tokens_input" || metric === "ai_tokens_output") this.updateTokenCount(value);

    // Flush if buffer is full
    if (this.buffer.length >= this.MAX_BUFFER) this.flush();
  }

  /* ── Pre-flight rate limit check ─────────────────────────────────── */

  checkRateLimit(tokensNeeded = 0): RateLimitCheckResult {
    this.resetWindowsIfNeeded();
    const limits = this.planLimits?.rateLimits;
    if (!limits) return { allowed: true, reason: null, retryAfterMs: 0 };

    if (this.rateLimitState.requestsThisMinute >= limits.requestsPerMinute) {
      const retryAfterMs = 60_000 - (Date.now() - this.rateLimitState.windowStartMinute);
      return { allowed: false, reason: "requests_per_minute", retryAfterMs };
    }
    if (this.rateLimitState.requestsThisHour >= limits.requestsPerHour) {
      const retryAfterMs = 3_600_000 - (Date.now() - this.rateLimitState.windowStartHour);
      return { allowed: false, reason: "requests_per_hour", retryAfterMs };
    }
    if (tokensNeeded > 0 && this.rateLimitState.tokensThisMinute + tokensNeeded > limits.tokensPerMinute) {
      const retryAfterMs = 60_000 - (Date.now() - this.rateLimitState.windowStartMinute);
      return { allowed: false, reason: "tokens_per_minute", retryAfterMs };
    }

    return { allowed: true, reason: null, retryAfterMs: 0 };
  }

  /* ── Soft limit warnings (before hitting hard stop) ─────────────── */

  checkSoftLimits(): SoftLimitWarning[] {
    if (!this.usageSummary) return [];
    const warnings: SoftLimitWarning[] = [];
    const WARN_THRESHOLD = 0.85;    // warn at 85% usage
    const CRITICAL_THRESHOLD = 0.95;

    for (const [metric, pct] of Object.entries(this.usageSummary.percentUsed)) {
      if (pct == null) continue;
      if (pct >= CRITICAL_THRESHOLD) {
        warnings.push({ metric: metric as UsageMetric, percentUsed: pct, severity: "critical" });
      } else if (pct >= WARN_THRESHOLD) {
        warnings.push({ metric: metric as UsageMetric, percentUsed: pct, severity: "warning" });
      }
    }
    return warnings;
  }

  /* ── Cache usage summary from server ────────────────────────────── */

  setUsageSummary(summary: WorkspaceUsageSummary): void {
    this.usageSummary = summary;
  }

  setPlanLimits(limits: PlanLimits): void {
    this.planLimits = limits;
  }

  getUsageSummary(): WorkspaceUsageSummary | undefined {
    return this.usageSummary;
  }

  /* ── Flush buffer to backend ─────────────────────────────────────── */

  private async flush(opts: { sync?: boolean } = {}): Promise<void> {
    if (this.buffer.length === 0) return;
    const records = this.buffer.splice(0, this.buffer.length);

    const payload = JSON.stringify({ records });
    const url     = "/api/v1/usage/batch";
    const token   = localStorage.getItem("nexusai_at");  // if not in memory

    if (opts.sync && navigator.sendBeacon) {
      // Use sendBeacon for unload — guaranteed delivery
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      return;
    }

    try {
      await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    payload,
        keepalive: true,
      });
    } catch {
      // Restore records to front of buffer if flush failed
      this.buffer.unshift(...records);
    }
  }

  /* ── Rate limit window management ────────────────────────────────── */

  private resetWindowsIfNeeded(): void {
    const now = Date.now();
    if (now - this.rateLimitState.windowStartMinute > 60_000) {
      this.rateLimitState.requestsThisMinute = 0;
      this.rateLimitState.tokensThisMinute   = 0;
      this.rateLimitState.windowStartMinute  = now;
    }
    if (now - this.rateLimitState.windowStartHour > 3_600_000) {
      this.rateLimitState.requestsThisHour = 0;
      this.rateLimitState.windowStartHour  = now;
    }
  }

  private updateRequestCount(): void {
    this.resetWindowsIfNeeded();
    this.rateLimitState.requestsThisMinute++;
    this.rateLimitState.requestsThisHour++;
  }

  private updateTokenCount(tokens: number): void {
    this.resetWindowsIfNeeded();
    this.rateLimitState.tokensThisMinute += tokens;
  }
}

export interface RateLimitCheckResult {
  allowed:      boolean;
  reason:       "requests_per_minute" | "requests_per_hour" | "tokens_per_minute" | null;
  retryAfterMs: number;
}

export interface SoftLimitWarning {
  metric:      UsageMetric;
  percentUsed: number;
  severity:    "warning" | "critical";
}

export const usageTracker = new UsageTracker();
