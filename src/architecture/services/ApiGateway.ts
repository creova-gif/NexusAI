/**
 * NexusAI — API Gateway Client
 * Central HTTP client for all backend communication.
 * Handles auth token injection, retry with exponential backoff,
 * request deduplication, circuit breaking, and observability.
 */

import { authService } from "./AuthService";

/* ── Request Config ────────────────────────────────────────────────── */

export interface RequestConfig {
  method?:         "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?:         Record<string, string | number | boolean | undefined>;
  body?:           unknown;
  headers?:        Record<string, string>;
  retries?:        number;           // default 3
  timeoutMs?:      number;           // default 30_000
  priority?:       "low" | "normal" | "high";
  idempotencyKey?: string;           // for POST mutation safety
  signal?:         AbortSignal;      // caller-controlled cancellation
}

export interface ApiResponse<T> {
  data:       T;
  status:     number;
  requestId:  string;
  duration:   number;               // ms
  cached:     boolean;
}

export interface PaginatedResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  pageSize:   number;
  hasMore:    boolean;
  cursor?:    string;               // cursor-based pagination option
}

export interface ApiError {
  code:       string;
  message:    string;
  requestId?: string;
  details?:   Record<string, unknown>;
  retryAfter?: number;              // seconds (for 429)
}

/* ── Circuit Breaker ───────────────────────────────────────────────── */

type CircuitState = "closed" | "open" | "half_open";

class CircuitBreaker {
  private state:        CircuitState = "closed";
  private failures:     number = 0;
  private lastFailure?: number;
  private successes:    number = 0;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs:   number = 30_000,
    private readonly halfOpenSuccesses: number = 2,
  ) {}

  isOpen(): boolean {
    if (this.state === "open") {
      if (Date.now() - (this.lastFailure ?? 0) > this.resetTimeoutMs) {
        this.state = "half_open";
        return false;
      }
      return true;
    }
    return false;
  }

  onSuccess(): void {
    this.failures = 0;
    if (this.state === "half_open") {
      this.successes++;
      if (this.successes >= this.halfOpenSuccesses) {
        this.state    = "closed";
        this.successes = 0;
      }
    }
  }

  onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state    = "open";
      this.successes = 0;
    }
  }
}

/* ── API Gateway ───────────────────────────────────────────────────── */

export class ApiGateway {
  private readonly baseUrl:        string;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly requestCache:   Map<string, { data: unknown; expires: number }> = new Map();
  private readonly inflight:       Map<string, Promise<unknown>> = new Map();

  constructor(baseUrl: string = "/api/v1") {
    this.baseUrl        = baseUrl;
    this.circuitBreaker = new CircuitBreaker();
  }

  /* ── Public API ──────────────────────────────────────────────────── */

  async get<T>(
    path: string,
    config: Omit<RequestConfig, "method" | "body"> & { cacheTtlMs?: number } = {},
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.buildCacheKey(path, config.params);

    // Return cached if fresh
    if (config.cacheTtlMs) {
      const cached = this.requestCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return { data: cached.data as T, status: 200, requestId: "cached", duration: 0, cached: true };
      }
    }

    // Deduplicate concurrent identical requests
    if (this.inflight.has(cacheKey)) {
      return this.inflight.get(cacheKey) as Promise<ApiResponse<T>>;
    }

    const request = this.execute<T>(path, { ...config, method: "GET" });
    this.inflight.set(cacheKey, request);

    try {
      const result = await request;
      if (config.cacheTtlMs) {
        this.requestCache.set(cacheKey, { data: result.data, expires: Date.now() + config.cacheTtlMs });
      }
      return result;
    } finally {
      this.inflight.delete(cacheKey);
    }
  }

  async post<T>(path: string, body: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.execute<T>(path, { ...config, method: "POST", body });
  }

  async put<T>(path: string, body: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.execute<T>(path, { ...config, method: "PUT", body });
  }

  async patch<T>(path: string, body: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.execute<T>(path, { ...config, method: "PATCH", body });
  }

  async delete<T = void>(path: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.execute<T>(path, { ...config, method: "DELETE" });
  }

  /* ── Streaming (SSE) ─────────────────────────────────────────────── */

  stream(path: string, onChunk: (chunk: string) => void, onDone: () => void, onError: (err: Error) => void): () => void {
    const token = authService.getAccessToken();
    const headers: Record<string, string> = {
      "Authorization":  `Bearer ${token}`,
      "X-Client-Version": import.meta.env.VITE_APP_VERSION ?? "dev",
    };

    const url = `${this.baseUrl}${path}`;
    let active = true;

    (async () => {
      try {
        const res = await fetch(url, { headers, credentials: "include" });
        if (!res.ok) throw new Error(`Stream error: ${res.status}`);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();

        while (active) {
          const { done, value } = await reader.read();
          if (done) { onDone(); break; }
          const text = decoder.decode(value, { stream: true });
          // Parse SSE format: "data: {...}\n\n"
          text.split("\n\n").filter(Boolean).forEach(event => {
            if (event.startsWith("data: ")) onChunk(event.slice(6));
          });
        }
      } catch (err) {
        if (active) onError(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    return () => { active = false; };
  }

  /* ── Internals ───────────────────────────────────────────────────── */

  private async execute<T>(path: string, config: RequestConfig): Promise<ApiResponse<T>> {
    if (this.circuitBreaker.isOpen()) {
      throw new GatewayError("CIRCUIT_OPEN", "Service temporarily unavailable");
    }

    const maxRetries = config.retries ?? 3;
    const timeoutMs  = config.timeoutMs ?? 30_000;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(1000 * 2 ** attempt + Math.random() * 1000, 30_000);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);
      const signal     = config.signal
        ? AbortSignal.any([controller.signal, config.signal])
        : controller.signal;

      try {
        const startMs  = Date.now();
        const token    = authService.isTokenExpired()
          ? await authService.refreshAccessToken()
          : authService.getAccessToken();

        const url = this.buildUrl(path, config.params);
        const res = await fetch(url, {
          method:      config.method ?? "GET",
          credentials: "include",
          signal,
          headers: {
            "Content-Type":        "application/json",
            "Accept":              "application/json",
            "Authorization":       token ? `Bearer ${token}` : "",
            "X-Request-Id":        crypto.randomUUID(),
            "X-Client-Version":    import.meta.env.VITE_APP_VERSION ?? "dev",
            "X-Idempotency-Key":   config.idempotencyKey ?? "",
            ...config.headers,
          },
          body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
        });

        clearTimeout(timeoutId);
        const duration  = Date.now() - startMs;
        const requestId = res.headers.get("X-Request-Id") ?? "";

        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5") * 1000;
          if (attempt < maxRetries) { await sleep(retryAfter); continue; }
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as ApiError;
          if (this.isRetryableStatus(res.status) && attempt < maxRetries) {
            lastError = new GatewayError(body.code ?? "HTTP_ERROR", body.message ?? res.statusText);
            continue;
          }
          this.circuitBreaker.onFailure();
          throw new GatewayError(body.code ?? "HTTP_ERROR", body.message ?? res.statusText, body);
        }

        this.circuitBreaker.onSuccess();
        const data = res.status === 204 ? (undefined as T) : await res.json() as T;
        return { data, status: res.status, requestId, duration, cached: false };

      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof GatewayError) throw err;
        if ((err as Error).name === "AbortError") throw new GatewayError("TIMEOUT", "Request timed out");
        lastError = err instanceof Error ? err : new Error(String(err));
        this.circuitBreaker.onFailure();
      }
    }

    throw lastError ?? new GatewayError("MAX_RETRIES", "Request failed after retries");
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }
    return url.toString();
  }

  private buildCacheKey(path: string, params?: Record<string, unknown>): string {
    return `${path}?${JSON.stringify(params ?? {})}`;
  }

  private isRetryableStatus(status: number): boolean {
    return [408, 429, 502, 503, 504].includes(status);
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) { this.requestCache.clear(); return; }
    for (const key of this.requestCache.keys()) {
      if (key.includes(pattern)) this.requestCache.delete(key);
    }
  }
}

export class GatewayError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: ApiError,
  ) { super(message); this.name = "GatewayError"; }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const apiGateway = new ApiGateway();
