/**
 * NexusAI — usePermissions Hook
 * Provides permission checking, feature flags, tier access, and role checks
 * at the component level. Reads from the pre-loaded JWT claims — zero latency.
 */

import { useCallback } from "react";
import type { PermissionCode } from "../types/permissions";
import { permissionsService } from "../services/PermissionsService";
import { useAuthContext } from "../context/AuthContext";

export interface UsePermissionsReturn {
  // Permission checks (from JWT — instant)
  can:     (permission: PermissionCode) => boolean;
  canAny:  (...permissions: PermissionCode[]) => boolean;
  canAll:  (...permissions: PermissionCode[]) => boolean;

  // Server-validated check (async — for sensitive ops)
  checkServer: (permission: PermissionCode, resourceId?: string) => Promise<boolean>;

  // Feature flags
  isFeatureEnabled: (flagId: string) => boolean;

  // Tier checks
  tier:                  string;
  isAtLeast:             (tier: "starter" | "professional" | "enterprise" | "government") => boolean;
  isProfessionalOrAbove: boolean;
  isEnterpriseOrAbove:   boolean;

  // Role checks
  hasRole:             (role: string) => boolean;
  isOwnerOrAdmin:      boolean;
  isComplianceOfficer: boolean;

  // Current identity
  currentUserId:    string | undefined;
  currentWorkspace: string | undefined;
}

export function usePermissions(): UsePermissionsReturn {
  const { isAuthenticated } = useAuthContext();

  const can     = useCallback((p: PermissionCode) => isAuthenticated && permissionsService.can(p), [isAuthenticated]);
  const canAny  = useCallback((...ps: PermissionCode[]) => isAuthenticated && permissionsService.canAny(...ps), [isAuthenticated]);
  const canAll  = useCallback((...ps: PermissionCode[]) => isAuthenticated && permissionsService.canAll(...ps), [isAuthenticated]);

  const checkServer = useCallback(async (permission: PermissionCode, resourceId?: string): Promise<boolean> => {
    if (!isAuthenticated) return false;
    const result = await permissionsService.checkServer(permission, resourceId);
    return result.granted;
  }, [isAuthenticated]);

  const isFeatureEnabled = useCallback((flagId: string) => permissionsService.isFeatureEnabled(flagId), []);
  const isAtLeast = useCallback((tier: "starter" | "professional" | "enterprise" | "government") => permissionsService.isAtLeast(tier), []);

  return {
    can, canAny, canAll, checkServer,
    isFeatureEnabled,
    tier:                  permissionsService.getTier(),
    isAtLeast,
    isProfessionalOrAbove: permissionsService.isProfessionalOrAbove(),
    isEnterpriseOrAbove:   permissionsService.isEnterpriseOrAbove(),
    hasRole:               useCallback((r: string) => permissionsService.hasRole(r), []),
    isOwnerOrAdmin:        permissionsService.isOwnerOrAdmin(),
    isComplianceOfficer:   permissionsService.isComplianceOfficer(),
    currentUserId:         permissionsService.getCurrentUserId(),
    currentWorkspace:      permissionsService.getCurrentWorkspace(),
  };
}

/* ── Permission Guard component helper ──────────────────────────────── */

export function usePermissionGuard(
  permission: PermissionCode,
  options: { redirectTo?: string; silent?: boolean } = {},
): { allowed: boolean } {
  const { can } = usePermissions();
  const allowed = can(permission);

  if (!allowed && options.redirectTo && typeof window !== "undefined") {
    if (!options.silent) {
      // In a real app: navigate to options.redirectTo
    }
  }

  return { allowed };
}
