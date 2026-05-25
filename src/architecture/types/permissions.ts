/**
 * NexusAI — Permissions, RBAC & Access Control Types
 * Fine-grained permission system with role inheritance, department scoping,
 * and resource-level access control lists.
 */

/* ── Permission Codes ──────────────────────────────────────────────── */

export type PermissionCode =
  // Alert Management
  | "alerts.view"          | "alerts.triage"       | "alerts.close"
  | "alerts.escalate"      | "alerts.assign"        | "alerts.bulk_action"
  // SAR
  | "sar.view"             | "sar.draft"            | "sar.edit"
  | "sar.submit"           | "sar.approve"          | "sar.void"
  // KYC
  | "kyc.view"             | "kyc.initiate"         | "kyc.approve"
  | "kyc.reject"           | "kyc.override"
  // Entity Graph
  | "graph.view"           | "graph.annotate"       | "graph.export"
  // Rules Engine
  | "rules.view"           | "rules.create"         | "rules.update"
  | "rules.delete"         | "rules.enable"         | "rules.backtest"
  // AI Features
  | "ai.chat"              | "ai.investigate"       | "ai.sar_draft"
  | "ai.model_config"      | "ai.fine_tune"         | "ai.rag_upload"
  // Audit
  | "audit.view_own"       | "audit.view_all"       | "audit.export"
  // Reports
  | "reports.view"         | "reports.create"       | "reports.export"
  | "reports.schedule"
  // Settings
  | "settings.view"        | "settings.billing"     | "settings.security"
  | "settings.integrations"
  // Members
  | "members.view"         | "members.invite"       | "members.remove"
  | "members.roles"
  // Admin
  | "admin.workspace"      | "admin.api_keys"       | "admin.sso"
  | "admin.encryption"     | "admin.suspend";

/* ── Role Definitions ──────────────────────────────────────────────── */

export interface RoleDefinition {
  id:           string;
  name:         string;
  displayName:  string;
  description:  string;
  permissions:  PermissionCode[];
  inheritsFrom?: string[];          // role IDs to inherit from
  isSystem:     boolean;            // cannot be deleted
  isCustom:     boolean;            // workspace-created
}

export type SystemRole =
  | "owner"
  | "admin"
  | "compliance_officer"
  | "analyst"
  | "auditor"
  | "viewer";

export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRole, PermissionCode[]> = {
  owner: [
    "alerts.view", "alerts.triage", "alerts.close", "alerts.escalate", "alerts.assign", "alerts.bulk_action",
    "sar.view", "sar.draft", "sar.edit", "sar.submit", "sar.approve", "sar.void",
    "kyc.view", "kyc.initiate", "kyc.approve", "kyc.reject", "kyc.override",
    "graph.view", "graph.annotate", "graph.export",
    "rules.view", "rules.create", "rules.update", "rules.delete", "rules.enable", "rules.backtest",
    "ai.chat", "ai.investigate", "ai.sar_draft", "ai.model_config", "ai.fine_tune", "ai.rag_upload",
    "audit.view_own", "audit.view_all", "audit.export",
    "reports.view", "reports.create", "reports.export", "reports.schedule",
    "settings.view", "settings.billing", "settings.security", "settings.integrations",
    "members.view", "members.invite", "members.remove", "members.roles",
    "admin.workspace", "admin.api_keys", "admin.sso", "admin.encryption", "admin.suspend",
  ],
  admin: [
    "alerts.view", "alerts.triage", "alerts.close", "alerts.escalate", "alerts.assign", "alerts.bulk_action",
    "sar.view", "sar.draft", "sar.edit", "sar.submit", "sar.approve",
    "kyc.view", "kyc.initiate", "kyc.approve", "kyc.reject",
    "graph.view", "graph.annotate", "graph.export",
    "rules.view", "rules.create", "rules.update", "rules.enable", "rules.backtest",
    "ai.chat", "ai.investigate", "ai.sar_draft", "ai.model_config",
    "audit.view_own", "audit.view_all", "audit.export",
    "reports.view", "reports.create", "reports.export", "reports.schedule",
    "settings.view", "settings.billing", "settings.security", "settings.integrations",
    "members.view", "members.invite", "members.remove", "members.roles",
    "admin.workspace", "admin.api_keys", "admin.sso",
  ],
  compliance_officer: [
    "alerts.view", "alerts.triage", "alerts.close", "alerts.escalate", "alerts.assign",
    "sar.view", "sar.draft", "sar.edit", "sar.submit", "sar.approve",
    "kyc.view", "kyc.initiate", "kyc.approve", "kyc.reject",
    "graph.view", "graph.annotate",
    "rules.view", "rules.create", "rules.update", "rules.enable",
    "ai.chat", "ai.investigate", "ai.sar_draft",
    "audit.view_own", "audit.view_all",
    "reports.view", "reports.create", "reports.export",
    "settings.view",
    "members.view",
  ],
  analyst: [
    "alerts.view", "alerts.triage", "alerts.escalate", "alerts.assign",
    "sar.view", "sar.draft", "sar.edit",
    "kyc.view", "kyc.initiate",
    "graph.view", "graph.annotate",
    "rules.view",
    "ai.chat", "ai.investigate", "ai.sar_draft",
    "audit.view_own",
    "reports.view", "reports.create",
    "settings.view",
    "members.view",
  ],
  auditor: [
    "alerts.view",
    "sar.view",
    "kyc.view",
    "graph.view",
    "rules.view",
    "audit.view_own", "audit.view_all", "audit.export",
    "reports.view", "reports.export",
    "settings.view",
    "members.view",
  ],
  viewer: [
    "alerts.view",
    "sar.view",
    "kyc.view",
    "graph.view",
    "rules.view",
    "audit.view_own",
    "reports.view",
    "settings.view",
    "members.view",
  ],
};

/* ── Access Control ────────────────────────────────────────────────── */

export interface AccessCheckRequest {
  userId:       string;
  workspaceId:  string;
  permission:   PermissionCode;
  resourceType?: string;
  resourceId?:  string;
}

export interface AccessCheckResult {
  granted:   boolean;
  reason?:   "no_permission" | "suspended" | "ip_blocked" | "rate_limited" | "feature_disabled";
  grantedBy?: "role" | "custom_permission" | "override";
}

/* ── Resource-Level ACL ────────────────────────────────────────────── */

export interface ResourceACL {
  resourceType: string;
  resourceId:   string;
  workspaceId:  string;
  entries:      ACLEntry[];
}

export interface ACLEntry {
  principalType: "user" | "role" | "team";
  principalId:   string;
  permissions:   PermissionCode[];
  grantedAt:     string;
  grantedBy:     string;
  expiresAt?:    string;
}

/* ── Feature Flags ─────────────────────────────────────────────────── */

export interface FeatureFlag {
  id:            string;
  name:          string;
  description:   string;
  enabled:       boolean;
  rolloutPercent?: number;         // 0–100 gradual rollout
  allowedTiers?: string[];         // subscription tier gates
  allowedWorkspaces?: string[];    // explicit workspace allowlist
  metadata:      Record<string, unknown>;
}
