/**
 * NexusAI — Permissions Service
 * Client-side permission evaluation from JWT claims + server-side checks
 * for sensitive operations. Zero-trust: verify on every action.
 */

import type { PermissionCode, AccessCheckResult, FeatureFlag } from "../types/permissions";
import type { AccessTokenPayload } from "../types/auth";
import { apiGateway } from "./ApiGateway";

export class PermissionsService {
  private tokenPayload?: AccessTokenPayload;
  private featureFlags:  Map<string, FeatureFlag> = new Map();
  private remoteCheckCache: Map<string, { result: AccessCheckResult; expires: number }> = new Map();
  private readonly CACHE_TTL_MS = 30_000;  // 30s cache for remote checks

  /* ── Load from access token ──────────────────────────────────────── */

  setTokenPayload(payload: AccessTokenPayload): void {
    this.tokenPayload = payload;
    this.remoteCheckCache.clear();    // invalidate cache on new token
  }

  /* ── Client-side permission check (from JWT claims) ─────────────── */

  can(permission: PermissionCode): boolean {
    if (!this.tokenPayload) return false;
    return (
      this.tokenPayload.perms.includes(permission) ||
      this.tokenPayload.perms.includes("admin.*") ||
      this.tokenPayload.roles.includes("owner")
    );
  }

  canAny(...permissions: PermissionCode[]): boolean {
    return permissions.some(p => this.can(p));
  }

  canAll(...permissions: PermissionCode[]): boolean {
    return permissions.every(p => this.can(p));
  }

  /* ── Server-side check for sensitive operations ──────────────────── */

  async checkServer(permission: PermissionCode, resourceId?: string): Promise<AccessCheckResult> {
    const cacheKey = `${permission}:${resourceId ?? ""}`;
    const cached   = this.remoteCheckCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.result;

    const { data } = await apiGateway.post<AccessCheckResult>("/auth/check", {
      permission,
      resourceId,
      workspaceId: this.tokenPayload?.wid,
    });

    this.remoteCheckCache.set(cacheKey, { result: data, expires: Date.now() + this.CACHE_TTL_MS });
    return data;
  }

  /* ── Feature flags ───────────────────────────────────────────────── */

  async loadFeatureFlags(workspaceId: string): Promise<void> {
    try {
      const { data } = await apiGateway.get<FeatureFlag[]>(
        `/workspaces/${workspaceId}/features`,
        { cacheTtlMs: 300_000 },   // 5 min
      );
      this.featureFlags = new Map(data.map(f => [f.id, f]));
    } catch { /* non-critical — defaults to all-off */ }
  }

  isFeatureEnabled(flagId: string): boolean {
    const flag = this.featureFlags.get(flagId);
    if (!flag) return false;
    if (!flag.enabled) return false;
    if (flag.rolloutPercent != null && flag.rolloutPercent < 100) {
      // Deterministic user-based rollout
      const hash = this.deterministicHash(`${this.tokenPayload?.sub}:${flagId}`);
      return (hash % 100) < flag.rolloutPercent;
    }
    return true;
  }

  /* ── Subscription tier checks ────────────────────────────────────── */

  getTier(): string {
    return this.tokenPayload?.tier ?? "starter";
  }

  isAtLeast(tier: "starter" | "professional" | "enterprise" | "government"): boolean {
    const hierarchy = { starter: 0, professional: 1, enterprise: 2, government: 2 };
    const current   = hierarchy[this.tokenPayload?.tier as keyof typeof hierarchy] ?? 0;
    const required  = hierarchy[tier] ?? 0;
    return current >= required;
  }

  isProfessionalOrAbove(): boolean { return this.isAtLeast("professional"); }
  isEnterpriseOrAbove():   boolean { return this.isAtLeast("enterprise"); }

  /* ── Role checks ─────────────────────────────────────────────────── */

  hasRole(role: string): boolean {
    return this.tokenPayload?.roles?.includes(role) ?? false;
  }

  isOwnerOrAdmin(): boolean {
    return this.hasRole("owner") || this.hasRole("admin");
  }

  isComplianceOfficer(): boolean {
    return this.hasRole("compliance_officer") || this.isOwnerOrAdmin();
  }

  /* ── Utilities ───────────────────────────────────────────────────── */

  getCurrentUserId():    string | undefined { return this.tokenPayload?.sub; }
  getCurrentWorkspace(): string | undefined { return this.tokenPayload?.wid; }
  getSessionId():        string | undefined { return this.tokenPayload?.sid; }

  private deterministicHash(input: string): number {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    }
    return Math.abs(hash);
  }
}

/* ── Permission Guard (HOC helper) ──────────────────────────────────── */

export interface PermissionGuardProps {
  permission: PermissionCode;
  fallback?:  React.ReactNode;
  children:   React.ReactNode;
}

export const permissionsService = new PermissionsService();
