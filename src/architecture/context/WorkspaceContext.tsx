/**
 * NexusAI — Workspace Context & Provider
 * Provides workspace metadata, subscription, usage, and realtime alerts
 * to the React tree. Depends on AuthContext being present above it.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { Workspace, WorkspaceMember } from "../types/workspace";
import type { WorkspaceSubscription, WorkspaceUsageSummary, PlanLimits } from "../types/subscription";
import { workspaceService } from "../services/WorkspaceService";
import { usageTracker, type SoftLimitWarning } from "../services/UsageTracker";
import { realtimePipeline } from "../services/RealtimePipeline";
import { getPlan } from "../config/subscription.config";
import { useAuthContext } from "./AuthContext";

/* ── Context Shape ───────────────────────────────────────────────────── */

export interface WorkspaceContextValue {
  workspace:        Workspace | null;
  subscription:     WorkspaceSubscription | null;
  usageSummary:     WorkspaceUsageSummary | null;
  planLimits:       PlanLimits | null;
  members:          WorkspaceMember[];
  softLimitWarnings: SoftLimitWarning[];
  isLoading:        boolean;
  error:            string | null;

  // Actions
  refreshWorkspace:    () => Promise<void>;
  refreshUsage:        () => Promise<void>;
  updateSettings:      (settings: Partial<Workspace["settings"]>) => Promise<void>;
}

/* ── Context ─────────────────────────────────────────────────────────── */

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/* ── Provider ────────────────────────────────────────────────────────── */

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { currentWorkspaceId, isAuthenticated } = useAuthContext();

  const [workspace,          setWorkspace]          = useState<Workspace | null>(null);
  const [subscription,       setSubscription]       = useState<WorkspaceSubscription | null>(null);
  const [usageSummary,       setUsageSummary]       = useState<WorkspaceUsageSummary | null>(null);
  const [planLimits,         setPlanLimits]         = useState<PlanLimits | null>(null);
  const [members,            setMembers]            = useState<WorkspaceMember[]>([]);
  const [softLimitWarnings,  setSoftLimitWarnings]  = useState<SoftLimitWarning[]>([]);
  const [isLoading,          setIsLoading]          = useState(false);
  const [error,              setError]              = useState<string | null>(null);
  const usageRefreshTimer = useRef<ReturnType<typeof setInterval>>();

  /* ── Load workspace data ─────────────────────────────────────── */

  const loadWorkspaceData = useCallback(async (workspaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [ws, sub, usage, mems] = await Promise.all([
        workspaceService.getWorkspace(workspaceId),
        workspaceService.getSubscription(workspaceId),
        workspaceService.getUsageSummary(workspaceId),
        workspaceService.listMembers(workspaceId),
      ]);

      const plan   = getPlan(ws.plan);
      const limits = plan.limits;

      setWorkspace(ws);
      setSubscription(sub);
      setUsageSummary(usage);
      setPlanLimits(limits);
      setMembers(mems);

      // Push to usage tracker for client-side rate limit enforcement
      usageTracker.setUsageSummary(usage);
      usageTracker.setPlanLimits(limits);
      setSoftLimitWarnings(usageTracker.checkSoftLimits());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ── Boot on workspaceId change ──────────────────────────────── */

  useEffect(() => {
    if (!isAuthenticated || !currentWorkspaceId) return;
    loadWorkspaceData(currentWorkspaceId);

    // Refresh usage every 5 minutes
    usageRefreshTimer.current = setInterval(() => refreshUsage(), 5 * 60_000);

    // Subscribe to realtime workspace events
    const handles = [
      realtimePipeline.on("workspace.settings_changed", async () => {
        if (currentWorkspaceId) {
          const ws = await workspaceService.getWorkspace(currentWorkspaceId);
          setWorkspace(ws);
        }
      }),
    ];

    return () => {
      clearInterval(usageRefreshTimer.current);
      handles.forEach(h => h.unsubscribe());
    };
  }, [currentWorkspaceId, isAuthenticated, loadWorkspaceData]);

  /* ── Actions ─────────────────────────────────────────────────── */

  const refreshWorkspace = useCallback(async () => {
    if (currentWorkspaceId) await loadWorkspaceData(currentWorkspaceId);
  }, [currentWorkspaceId, loadWorkspaceData]);

  const refreshUsage = useCallback(async () => {
    if (!currentWorkspaceId) return;
    try {
      const usage = await workspaceService.getUsageSummary(currentWorkspaceId);
      setUsageSummary(usage);
      usageTracker.setUsageSummary(usage);
      setSoftLimitWarnings(usageTracker.checkSoftLimits());
    } catch { /* non-critical */ }
  }, [currentWorkspaceId]);

  const updateSettings = useCallback(async (settings: Partial<Workspace["settings"]>) => {
    if (!currentWorkspaceId || !workspace) return;
    const updated = await workspaceService.updateSettings(currentWorkspaceId, settings);
    setWorkspace(updated);
  }, [currentWorkspaceId, workspace]);

  const value: WorkspaceContextValue = {
    workspace, subscription, usageSummary, planLimits, members,
    softLimitWarnings, isLoading, error,
    refreshWorkspace, refreshUsage, updateSettings,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

/* ── Hook ────────────────────────────────────────────────────────────── */

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used within <WorkspaceProvider>");
  return ctx;
}
