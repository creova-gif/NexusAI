/**
 * NexusAI — Authentication & Identity Types
 * Production-grade definitions for auth, sessions, tokens, and MFA.
 */

export type AuthProvider = "email" | "saml" | "oidc" | "azure_ad" | "okta";
export type MFAMethod   = "totp" | "sms" | "email_otp" | "hardware_key" | "push";
export type SessionStatus = "active" | "idle" | "expired" | "revoked";
export type TokenType   = "access" | "refresh" | "api_key" | "service";

/* ── User Identity ─────────────────────────────────────────────────── */

export interface UserIdentity {
  id:             string;          // UUID v4
  email:          string;
  emailVerified:  boolean;
  displayName:    string;
  avatarUrl?:     string;
  phoneNumber?:   string;
  locale:         string;          // e.g. "en-CA"
  timezone:       string;          // e.g. "America/Toronto"
  createdAt:      string;          // ISO 8601
  lastLoginAt?:   string;
  deletedAt?:     string;          // soft-delete
}

/* ── Auth Credentials ──────────────────────────────────────────────── */

export interface PasswordCredential {
  userId:        string;
  passwordHash:  string;           // bcrypt, cost=12
  salt:          string;
  iterations:    number;
  changedAt:     string;
  mustRotate:    boolean;
  previousHashes: string[];        // last 5, prevent reuse
}

export interface SSOCredential {
  userId:      string;
  provider:    AuthProvider;
  externalId:  string;             // provider-side sub/uid
  tenantId?:   string;             // Azure AD / Okta tenant
  rawProfile:  Record<string, unknown>;
  linkedAt:    string;
}

/* ── Session ───────────────────────────────────────────────────────── */

export interface Session {
  id:              string;         // session token (opaque, 256-bit)
  userId:          string;
  workspaceId:     string;
  status:          SessionStatus;
  ipAddress:       string;
  userAgent:       string;
  deviceId:        string;         // stable fingerprint
  country?:        string;
  region?:         string;
  mfaVerified:     boolean;
  elevatedUntil?:  string;         // for re-auth prompts (sudo mode)
  createdAt:       string;
  lastActivityAt:  string;
  expiresAt:       string;
  revokedAt?:      string;
  revokeReason?:   string;
}

/* ── JWT ───────────────────────────────────────────────────────────── */

export interface AccessTokenPayload {
  sub:    string;                  // userId
  sid:    string;                  // sessionId
  wid:    string;                  // workspaceId
  roles:  string[];
  perms:  string[];                // pre-computed permission codes
  tier:   SubscriptionTierCode;
  iat:    number;
  exp:    number;
  jti:    string;                  // unique token id (for revocation)
  iss:    "nexusai.ca";
  aud:    string[];
}

export type SubscriptionTierCode = "starter" | "professional" | "enterprise" | "government";

export interface RefreshTokenRecord {
  id:           string;
  userId:       string;
  sessionId:    string;
  tokenHash:    string;            // SHA-256 of raw token
  family:       string;            // rotation family (detect token reuse)
  rotationCount: number;
  absoluteExp:  string;            // max 30 days, never renewed
  createdAt:    string;
  usedAt?:      string;
  revokedAt?:   string;
}

/* ── API Keys ──────────────────────────────────────────────────────── */

export interface APIKey {
  id:            string;
  workspaceId:   string;
  createdByUser: string;
  name:          string;
  keyPrefix:     string;           // first 8 chars, shown in UI
  keyHash:       string;           // SHA-256 of full key
  scopes:        APIKeyScope[];
  rateLimit:     RateLimitConfig;
  allowedIPs?:   string[];         // CIDR notation
  lastUsedAt?:   string;
  expiresAt?:    string;
  revokedAt?:    string;
  createdAt:     string;
}

export type APIKeyScope =
  | "alerts:read"  | "alerts:write"
  | "sar:read"     | "sar:write"
  | "kyc:read"     | "kyc:write"
  | "rules:read"   | "rules:write"
  | "reports:read" | "admin:*";

export interface RateLimitConfig {
  requestsPerMinute:  number;
  requestsPerHour:    number;
  requestsPerDay:     number;
  tokensPerMinute?:   number;      // AI inference rate limit
  burstMultiplier:    number;      // e.g. 1.5× for short bursts
}

/* ── MFA ───────────────────────────────────────────────────────────── */

export interface MFADevice {
  id:          string;
  userId:      string;
  method:      MFAMethod;
  name:        string;             // e.g. "Authy App"
  secret?:     string;            // encrypted TOTP secret
  phoneNumber?: string;           // for SMS OTP
  verified:    boolean;
  isPrimary:   boolean;
  lastUsedAt?: string;
  createdAt:   string;
}

export interface MFAChallenge {
  id:          string;
  userId:      string;
  deviceId:    string;
  method:      MFAMethod;
  codeHash?:   string;            // hashed OTP for TOTP/SMS
  expiresAt:   string;
  attemptCount: number;
  maxAttempts:  number;
  resolvedAt?: string;
}

/* ── Audit ─────────────────────────────────────────────────────────── */

export interface AuthEvent {
  id:          string;
  userId?:     string;
  workspaceId?: string;
  sessionId?:  string;
  eventType:   AuthEventType;
  provider?:   AuthProvider;
  ipAddress:   string;
  userAgent:   string;
  country?:    string;
  success:     boolean;
  failReason?: string;
  metadata:    Record<string, unknown>;
  timestamp:   string;
}

export type AuthEventType =
  | "login"       | "logout"      | "token_refresh"
  | "mfa_enroll"  | "mfa_verify"  | "mfa_fail"
  | "password_change" | "password_reset"
  | "api_key_create"  | "api_key_revoke"
  | "session_revoke"  | "suspicious_activity"
  | "saml_assertion"  | "oidc_exchange";
