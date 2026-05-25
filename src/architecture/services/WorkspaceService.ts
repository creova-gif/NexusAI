/**
 * NexusAI — WorkspaceService
 * Manages workspace CRUD, member management, settings, SSO configuration,
 * API keys, and billing. All calls are workspace-scoped.
 */

import type { Workspace, WorkspaceMember, WorkspaceInvite, WorkspaceSettings } from "../types/workspace";
import type { WorkspaceSubscription, WorkspaceUsageSummary, Invoice } from "../types/subscription";
import type { APIKey } from "../types/auth";
import { apiGateway } from "./ApiGateway";
import type { PaginatedResponse } from "./ApiGateway";

export class WorkspaceService {
  /* ── Workspace CRUD ──────────────────────────────────────────────── */

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const { data } = await apiGateway.get<Workspace>(`/workspaces/${workspaceId}`, { cacheTtlMs: 30_000 });
    return data;
  }

  async updateWorkspace(workspaceId: string, updates: Partial<Pick<Workspace, "displayName" | "logoUrl" | "settings" | "featureFlags">>): Promise<Workspace> {
    const { data } = await apiGateway.patch<Workspace>(`/workspaces/${workspaceId}`, updates);
    apiGateway.invalidateCache(`/workspaces/${workspaceId}`);
    return data;
  }

  async updateSettings(workspaceId: string, settings: Partial<WorkspaceSettings>): Promise<Workspace> {
    const { data } = await apiGateway.patch<Workspace>(`/workspaces/${workspaceId}/settings`, settings);
    apiGateway.invalidateCache(`/workspaces/${workspaceId}`);
    return data;
  }

  /* ── Members ─────────────────────────────────────────────────────── */

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data } = await apiGateway.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
    return data;
  }

  async inviteMember(workspaceId: string, email: string, role: WorkspaceMember["role"]): Promise<WorkspaceInvite> {
    const { data } = await apiGateway.post<WorkspaceInvite>(`/workspaces/${workspaceId}/invites`, { email, role });
    return data;
  }

  async revokeInvite(workspaceId: string, inviteId: string): Promise<void> {
    await apiGateway.delete(`/workspaces/${workspaceId}/invites/${inviteId}`);
  }

  async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceMember["role"]): Promise<WorkspaceMember> {
    const { data } = await apiGateway.patch<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}`, { role });
    return data;
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await apiGateway.delete(`/workspaces/${workspaceId}/members/${userId}`);
  }

  async listPendingInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
    const { data } = await apiGateway.get<WorkspaceInvite[]>(`/workspaces/${workspaceId}/invites?status=pending`);
    return data;
  }

  /* ── Subscription & Billing ──────────────────────────────────────── */

  async getSubscription(workspaceId: string): Promise<WorkspaceSubscription> {
    const { data } = await apiGateway.get<WorkspaceSubscription>(`/workspaces/${workspaceId}/subscription`, { cacheTtlMs: 60_000 });
    return data;
  }

  async getUsageSummary(workspaceId: string, billingPeriod?: string): Promise<WorkspaceUsageSummary> {
    const params = billingPeriod ? { period: billingPeriod } : undefined;
    const { data } = await apiGateway.get<WorkspaceUsageSummary>(`/workspaces/${workspaceId}/usage`, { params });
    return data;
  }

  async listInvoices(workspaceId: string, page = 1, pageSize = 10): Promise<PaginatedResponse<Invoice>> {
    const { data } = await apiGateway.get<PaginatedResponse<Invoice>>(
      `/workspaces/${workspaceId}/invoices`,
      { params: { page, pageSize } },
    );
    return data;
  }

  async updateBillingEmail(workspaceId: string, email: string): Promise<void> {
    await apiGateway.patch(`/workspaces/${workspaceId}/billing`, { email });
  }

  async upgradePlan(workspaceId: string, planCode: string, billingCycle: string): Promise<{ checkoutUrl: string }> {
    const { data } = await apiGateway.post<{ checkoutUrl: string }>(`/workspaces/${workspaceId}/subscription/upgrade`, { planCode, billingCycle });
    return data;
  }

  async cancelSubscription(workspaceId: string, reason: string): Promise<void> {
    await apiGateway.post(`/workspaces/${workspaceId}/subscription/cancel`, { reason });
  }

  /* ── API Keys ────────────────────────────────────────────────────── */

  async listAPIKeys(workspaceId: string): Promise<APIKey[]> {
    const { data } = await apiGateway.get<APIKey[]>(`/workspaces/${workspaceId}/api-keys`);
    return data;
  }

  async createAPIKey(workspaceId: string, params: Omit<APIKey, "id" | "workspaceId" | "createdByUser" | "keyHash" | "createdAt">): Promise<{ key: APIKey; rawKey: string }> {
    const { data } = await apiGateway.post<{ key: APIKey; rawKey: string }>(`/workspaces/${workspaceId}/api-keys`, params);
    return data;
  }

  async revokeAPIKey(workspaceId: string, keyId: string): Promise<void> {
    await apiGateway.delete(`/workspaces/${workspaceId}/api-keys/${keyId}`);
  }

  /* ── SSO ─────────────────────────────────────────────────────────── */

  async configureSSOSAML(workspaceId: string, config: { metadataUrl: string; enforcedDomains: string[] }): Promise<{ spEntityId: string; acsUrl: string }> {
    const { data } = await apiGateway.post<{ spEntityId: string; acsUrl: string }>(`/workspaces/${workspaceId}/sso/saml`, config);
    return data;
  }

  async configureSSOOIDC(workspaceId: string, config: { clientId: string; discoveryUrl: string; enforcedDomains: string[] }): Promise<void> {
    await apiGateway.post(`/workspaces/${workspaceId}/sso/oidc`, config);
  }

  async testSSOConnection(workspaceId: string): Promise<{ success: boolean; error?: string }> {
    const { data } = await apiGateway.post<{ success: boolean; error?: string }>(`/workspaces/${workspaceId}/sso/test`, {});
    return data;
  }

  async removeSSOConfig(workspaceId: string): Promise<void> {
    await apiGateway.delete(`/workspaces/${workspaceId}/sso`);
  }

  /* ── Audit Logs ──────────────────────────────────────────────────── */

  async getAuditLogs(workspaceId: string, params: {
    page?: number; pageSize?: number;
    actorId?: string; action?: string;
    from?: string; to?: string;
  } = {}): Promise<PaginatedResponse<WorkspaceAuditLogEntry>> {
    const { data } = await apiGateway.get<PaginatedResponse<WorkspaceAuditLogEntry>>(
      `/workspaces/${workspaceId}/audit`,
      { params: params as Record<string, string | number | boolean | undefined> },
    );
    return data;
  }

  async exportAuditLogs(workspaceId: string, format: "csv" | "jsonl", from: string, to: string): Promise<{ downloadUrl: string }> {
    const { data } = await apiGateway.post<{ downloadUrl: string }>(`/workspaces/${workspaceId}/audit/export`, { format, from, to });
    return data;
  }

  /* ── Encryption ──────────────────────────────────────────────────── */

  async rotateTenantKey(workspaceId: string): Promise<{ jobId: string; estimatedMinutes: number }> {
    const { data } = await apiGateway.post<{ jobId: string; estimatedMinutes: number }>(`/workspaces/${workspaceId}/encryption/rotate`, {});
    return data;
  }

  async enableBYOK(workspaceId: string, kmsKeyArn: string): Promise<void> {
    await apiGateway.post(`/workspaces/${workspaceId}/encryption/byok`, { kmsKeyArn });
  }
}

export interface WorkspaceAuditLogEntry {
  id:          string;
  actorId:     string;
  actorName:   string;
  action:      string;
  resourceType: string;
  resourceId:  string;
  ipAddress:   string;
  timestamp:   string;
  severity:    "low" | "medium" | "high" | "critical";
}

export const workspaceService = new WorkspaceService();
