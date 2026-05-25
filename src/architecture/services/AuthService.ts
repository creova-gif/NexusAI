/**
 * NexusAI — AuthService
 * Production-grade authentication orchestrator. Handles sign-in, token lifecycle,
 * MFA, SSO, session management, and security events.
 *
 * In production this calls the NexusAI Identity API (Node/Go backend).
 * This module defines the complete interface and client-side contract.
 */

import type {
  UserIdentity, Session, AccessTokenPayload, RefreshTokenRecord,
  APIKey, MFADevice, MFAChallenge, AuthEvent, AuthEventType, AuthProvider,
} from "../types/auth";

/* ── Auth API Contract ─────────────────────────────────────────────── */

export interface SignInRequest {
  email:       string;
  password:    string;
  deviceId:    string;
  remember?:   boolean;          // extend refresh token to 30d
}

export interface SignInResponse {
  accessToken:  string;          // JWT, 15 min TTL
  refreshToken: string;          // opaque, HttpOnly cookie
  session:      Session;
  user:         UserIdentity;
  mfaRequired?: { challengeId: string; method: string };
  workspaces:   WorkspaceSummary[];
}

export interface WorkspaceSummary {
  id:        string;
  slug:      string;
  name:      string;
  role:      string;
  plan:      string;
  logoUrl?:  string;
  isDefault: boolean;
}

export interface SSOInitRequest {
  provider:    AuthProvider;
  workspaceId: string;
  redirectUri: string;
  state:       string;           // CSRF token
  nonce?:      string;           // OIDC nonce
}

export interface TokenRefreshRequest {
  refreshToken: string;          // sent as HttpOnly cookie in production
  deviceId:     string;
}

export interface TokenRefreshResponse {
  accessToken:  string;
  expiresIn:    number;          // seconds
  session:      Pick<Session, "id" | "expiresAt" | "lastActivityAt">;
}

export interface MFAVerifyRequest {
  challengeId: string;
  code:        string;
  trustDevice?: boolean;
}

/* ── AuthService Implementation ────────────────────────────────────── */

export class AuthService {
  private readonly baseUrl: string;
  private readonly tokenRefreshThresholdMs = 2 * 60 * 1000; // refresh 2min before expiry
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(baseUrl: string = "/api/v1/auth") {
    this.baseUrl = baseUrl;
  }

  /* ── Sign In ─────────────────────────────────────────────────────── */

  async signIn(request: SignInRequest): Promise<SignInResponse> {
    const response = await this.post<SignInResponse>("/sign-in", {
      ...request,
      fingerprint: await this.getDeviceFingerprint(),
    });
    this.storeTokens(response.accessToken);
    this.scheduleTokenRefresh(response.accessToken);
    return response;
  }

  async signInWithSSO(provider: AuthProvider, workspaceSlug: string): Promise<void> {
    const state    = this.generateCSRFToken();
    const nonce    = this.generateNonce();
    sessionStorage.setItem("oauth_state",  state);
    sessionStorage.setItem("oauth_nonce",  nonce);
    sessionStorage.setItem("oauth_workspace", workspaceSlug);

    const { redirectUrl } = await this.post<{ redirectUrl: string }>("/sso/initiate", {
      provider,
      workspaceSlug,
      redirectUri: `${window.location.origin}/auth/callback`,
      state,
      nonce,
    });

    window.location.href = redirectUrl;
  }

  async handleSSOCallback(code: string, state: string): Promise<SignInResponse> {
    const storedState = sessionStorage.getItem("oauth_state");
    if (state !== storedState) throw new AuthError("CSRF_MISMATCH", "Invalid OAuth state");

    const response = await this.post<SignInResponse>("/sso/callback", {
      code,
      state,
      redirectUri: `${window.location.origin}/auth/callback`,
      workspaceSlug: sessionStorage.getItem("oauth_workspace"),
      nonce: sessionStorage.getItem("oauth_nonce"),
    });

    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_nonce");
    sessionStorage.removeItem("oauth_workspace");

    this.storeTokens(response.accessToken);
    this.scheduleTokenRefresh(response.accessToken);
    return response;
  }

  /* ── MFA ─────────────────────────────────────────────────────────── */

  async verifyMFA(request: MFAVerifyRequest): Promise<SignInResponse> {
    const response = await this.post<SignInResponse>("/mfa/verify", request);
    this.storeTokens(response.accessToken);
    this.scheduleTokenRefresh(response.accessToken);
    return response;
  }

  async enrollMFADevice(method: MFADevice["method"], name: string): Promise<{
    secret?: string;             // TOTP QR URI
    qrCodeUrl?: string;
    phoneNumber?: string;
    backupCodes: string[];
  }> {
    return this.post("/mfa/enroll", { method, name });
  }

  async confirmMFAEnrollment(deviceId: string, code: string): Promise<void> {
    await this.post("/mfa/enroll/confirm", { deviceId, code });
  }

  async listMFADevices(): Promise<MFADevice[]> {
    return this.get("/mfa/devices");
  }

  async removeMFADevice(deviceId: string, confirmCode: string): Promise<void> {
    await this.delete(`/mfa/devices/${deviceId}`, { confirmCode });
  }

  /* ── Token Management ────────────────────────────────────────────── */

  async refreshAccessToken(): Promise<string> {
    const response = await this.post<TokenRefreshResponse>("/token/refresh", {
      deviceId: await this.getDeviceId(),
    }, { includeCredentials: true });   // sends HttpOnly refresh cookie

    this.storeTokens(response.accessToken);
    this.scheduleTokenRefresh(response.accessToken);
    return response.accessToken;
  }

  getAccessToken(): string | undefined {
    return this.accessToken;
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  parseTokenPayload(): AccessTokenPayload | null {
    if (!this.accessToken) return null;
    try {
      const payload = this.accessToken.split(".")[1];
      return JSON.parse(atob(payload));
    } catch { return null; }
  }

  private storeTokens(accessToken: string): void {
    this.accessToken = accessToken;
    const payload = this.parseTokenPayload();
    this.tokenExpiry = payload ? payload.exp * 1000 : undefined;
    // Refresh token is stored in HttpOnly cookie by the server — never in JS
  }

  private scheduleTokenRefresh(accessToken: string): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);

    const payload = JSON.parse(atob(accessToken.split(".")[1])) as AccessTokenPayload;
    const expiresInMs = payload.exp * 1000 - Date.now();
    const refreshInMs = Math.max(0, expiresInMs - this.tokenRefreshThresholdMs);

    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken().catch(() => {
        // Silent fail — UI will detect expired token and redirect to login
      });
    }, refreshInMs);
  }

  /* ── Sessions ────────────────────────────────────────────────────── */

  async listActiveSessions(): Promise<Session[]> {
    return this.get("/sessions");
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.delete(`/sessions/${sessionId}`);
  }

  async revokeAllOtherSessions(): Promise<void> {
    await this.delete("/sessions/others");
  }

  async signOut(): Promise<void> {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    try { await this.post("/sign-out", {}); } finally {
      this.accessToken  = undefined;
      this.tokenExpiry  = undefined;
    }
  }

  /* ── API Keys ────────────────────────────────────────────────────── */

  async createAPIKey(params: Pick<APIKey, "name" | "scopes" | "rateLimit" | "allowedIPs" | "expiresAt">): Promise<{ key: APIKey; rawKey: string }> {
    // rawKey shown ONCE — never stored server-side in plaintext
    return this.post("/api-keys", params);
  }

  async listAPIKeys(): Promise<APIKey[]>             { return this.get("/api-keys"); }
  async revokeAPIKey(keyId: string): Promise<void>   { await this.delete(`/api-keys/${keyId}`); }

  /* ── Auth Events ─────────────────────────────────────────────────── */

  async getAuthEvents(limit = 50, offset = 0): Promise<AuthEvent[]> {
    return this.get(`/events?limit=${limit}&offset=${offset}`);
  }

  /* ── Utilities ───────────────────────────────────────────────────── */

  private async getDeviceFingerprint(): Promise<string> {
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width, screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join("|");
    const encoded = new TextEncoder().encode(data);
    const hash    = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private async getDeviceId(): Promise<string> {
    let id = localStorage.getItem("nexusai_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("nexusai_device_id", id);
    }
    return id;
  }

  private generateCSRFToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  private generateNonce(): string { return this.generateCSRFToken(); }

  /* ── HTTP Helpers ────────────────────────────────────────────────── */

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      credentials: "include",
      headers: this.buildHeaders(),
    });
    return this.handleResponse<T>(res);
  }

  private async post<T>(path: string, body: unknown, opts: { includeCredentials?: boolean } = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method:      "POST",
      credentials: "include",
      headers:     this.buildHeaders(),
      body:        JSON.stringify(body),
    });
    return this.handleResponse<T>(res);
  }

  private async delete<T = void>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method:      "DELETE",
      credentials: "include",
      headers:     this.buildHeaders(),
      body:        body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type":     "application/json",
      "X-Client-Version": import.meta.env.VITE_APP_VERSION ?? "dev",
    };
    if (this.accessToken) headers["Authorization"] = `Bearer ${this.accessToken}`;
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 401) throw new AuthError("UNAUTHORIZED",   "Session expired");
    if (res.status === 403) throw new AuthError("FORBIDDEN",      "Access denied");
    if (res.status === 429) throw new AuthError("RATE_LIMITED",   "Too many requests");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new AuthError(err.code ?? "SERVER_ERROR", err.message ?? "Unknown error");
    }
    return res.status === 204 ? (undefined as T) : res.json();
  }
}

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) { super(message); this.name = "AuthError"; }
}

export const authService = new AuthService();
