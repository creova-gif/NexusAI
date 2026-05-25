/**
 * NexusAI — useUsage Hook
 * Provides usage summary, limit warnings, and billing period info.
 */

import { useWorkspaceContext } from "../context/WorkspaceContext";
import type { UsageMetric } from "../types/subscription";

export interface UseUsageReturn {
  summary:       ReturnType<typeof useWorkspaceContext>["usageSummary"];
  warnings:      ReturnType<typeof useWorkspaceContext>["softLimitWarnings"];
  refresh:       () => Promise<void>;
  getPercent:    (metric: UsageMetric) => number | null;
  isNearLimit:   (metric: UsageMetric, threshold?: number) => boolean;
  isOverLimit:   (metric: UsageMetric) => boolean;
}

export function useUsage(): UseUsageReturn {
  const { usageSummary, softLimitWarnings, refreshUsage } = useWorkspaceContext();

  const getPercent = (metric: UsageMetric): number | null =>
    usageSummary?.percentUsed[metric] ?? null;

  const isNearLimit = (metric: UsageMetric, threshold = 0.85): boolean => {
    const pct = getPercent(metric);
    return pct !== null && pct >= threshold;
  };

  const isOverLimit = (metric: UsageMetric): boolean => {
    const pct = getPercent(metric);
    return pct !== null && pct >= 1.0;
  };

  return {
    summary:     usageSummary,
    warnings:    softLimitWarnings,
    refresh:     refreshUsage,
    getPercent,
    isNearLimit,
    isOverLimit,
  };
}
