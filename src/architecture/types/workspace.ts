/**
 * NexusAI — Workspace & Multi-Tenancy Types
 * Every resource in the system is scoped to a workspace (tenant).
 * Complete isolation: data, encryption keys, AI context, audit logs.
 */

export type WorkspaceStatus = "active" | "suspended" | "pending_setup" | "archived";
export type WorkspacePlan   = "starter" | "professional" | "enterprise" | "government";
export type MemberRole      = "owner" | "admin" | "compliance_officer" | "analyst" | "auditor" | "viewer";
export type InviteStatus    = "pending" | "accepted" | "expired" | "revoked";
export type ComplianceJurisdiction = "CA" | "US" | "EU" | "UK" | "APAC" | "GLOBAL";

/* ── Workspace (Tenant) ────────────────────────────────────────────── */

export interface Workspace {
  id:              string;         // UUID — primary tenant key
  slug:            string;         // URL-safe, unique, e.g. "rbc-aml"
  displayName:     string;
  legalName:       string;
  logoUrl?:        string;
  plan:            WorkspacePlan;
  status:          WorkspaceStatus;

  // Geography & Compliance
  jurisdiction:    ComplianceJurisdiction;
  dataResidency:   DataResidencyRegion;
  fintracEntityId?: string;        // FINTRAC reporting entity ID (Canadian)
  osifsEntityId?:  string;         // OSFI institution ID
  lei?:            string;         // Legal Entity Identifier (ISO 17442)

  // Contact
  primaryContactId:  string;      // userId
  billingContactId:  string;      // userId
  technicalContactId?: string;    // userId

  // Configuration
  settings:        WorkspaceSettings;
  featureFlags:    Record<string, boolean>;
  customDomain?:   string;

  // Infrastructure keys (encrypted at rest)
  encryptionKeyId: string;         // KMS key alias for this tenant
  signingKeyId:    string;         // HMAC key for webhooks

  createdAt:       string;
  updatedAt:       string;
  suspendedAt?:    string;
  suspendReason?:  string;
}

export type DataResidencyRegion =
  | "ca-central-1"               // Canada Central (primary for OSFI/FINTRAC)
  | "ca-west-1"                  // Canada West (BC only)
  | "us-east-1"                  // US East (cross-border banking)
  | "eu-west-1"                  // EU (GDPR)
  | "ap-southeast-1";            // APAC

export interface WorkspaceSettings {
  allowedAuthProviders:   ("email" | "saml" | "oidc" | "azure_ad" | "okta")[];
  mfaRequired:            boolean;
  mfaRequiredFor:         MemberRole[];          // e.g. all roles with "write" access
  sessionTimeoutMinutes:  number;                // default 480 (8h)
  idleTimeoutMinutes:     number;                // default 30
  ipAllowlist?:           string[];              // CIDR blocks
  ssoConfig?:             SSOConfig;
  passwordPolicy:         PasswordPolicy;
  dataRetentionDays:      number;                // audit log retention
  auditLogWebhook?:       string;                // SIEM integration URL
  alertNotificationEmails: string[];
}

export interface SSOConfig {
  provider:         "saml" | "oidc" | "azure_ad" | "okta";
  entityId?:        string;        // SAML entity ID
  metadataUrl?:     string;        // SAML metadata endpoint
  clientId?:        string;        // OIDC client ID
  discoveryUrl?:    string;        // OIDC discovery endpoint
  tenantId?:        string;        // Azure AD / Okta tenant
  attributeMapping: Record<string, string>;      // claim → field
  enforcedDomains:  string[];      // e.g. ["rbc.com", "rbc.ca"]
}

export interface PasswordPolicy {
  minLength:         number;       // 12+
  requireUppercase:  boolean;
  requireLowercase:  boolean;
  requireNumbers:    boolean;
  requireSymbols:    boolean;
  maxAgeDays:        number;       // 90 for financial services
  preventReuseCount: number;       // last N passwords
}

/* ── Workspace Members ─────────────────────────────────────────────── */

export interface WorkspaceMember {
  id:            string;
  workspaceId:   string;
  userId:        string;
  role:          MemberRole;
  customPerms?:  string[];         // additional permission codes
  departments:   string[];         // for department-scoped access
  invitedBy:     string;
  joinedAt:      string;
  lastActiveAt?: string;
  deactivatedAt?: string;
}

export interface WorkspaceInvite {
  id:          string;
  workspaceId: string;
  email:       string;
  role:        MemberRole;
  invitedBy:   string;
  token:       string;            // one-time secure token (expires in 72h)
  status:      InviteStatus;
  expiresAt:   string;
  acceptedAt?: string;
  createdAt:   string;
}

/* ── Workspace Audit ───────────────────────────────────────────────── */

export interface WorkspaceAuditEvent {
  id:          string;
  workspaceId: string;
  actorId:     string;            // userId
  actorRole:   MemberRole;
  action:      WorkspaceAction;
  resourceType: string;           // e.g. "alert", "sar", "rule"
  resourceId:  string;
  before?:     Record<string, unknown>;
  after?:      Record<string, unknown>;
  ipAddress:   string;
  sessionId:   string;
  timestamp:   string;            // immutable — append-only
  integrityHash: string;          // HMAC-SHA256 of event fields
}

export type WorkspaceAction =
  | "member.invite"     | "member.remove"     | "member.role_change"
  | "settings.update"   | "sso.configure"     | "api_key.create"
  | "alert.review"      | "alert.close"       | "alert.escalate"
  | "sar.draft"         | "sar.submit"        | "sar.approve"
  | "kyc.approve"       | "kyc.reject"        | "kyc.flag"
  | "rule.create"       | "rule.update"       | "rule.disable"
  | "model.configure"   | "workspace.suspend" | "data.export";
