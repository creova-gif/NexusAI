/**
 * NexusAI — Model Orchestrator
 * Central AI routing engine. Selects the optimal model for each task,
 * applies workspace routing rules, manages fallback chains, tracks costs,
 * and streams responses.
 */

import type {
  InferenceRequest, InferenceResponse, StreamChunk, AITask,
  RegisteredModel, ModelRoutingConfig, RoutingRule, RoutingCondition,
} from "../types/models";
import type { AccessTokenPayload } from "../types/auth";
import { apiGateway } from "./ApiGateway";
import { usageTracker } from "./UsageTracker";

/* ── Model Registry (static — sync'd from backend at startup) ────── */

export const MODEL_REGISTRY: Record<string, RegisteredModel> = {
  "gpt-4o": {
    id: "gpt-4o", provider: "openai", name: "gpt-4o", displayName: "GPT-4o",
    status: "active", tier: "premium",
    capabilities: ["chat", "function_calling", "vision", "streaming", "long_context"],
    contextWindow: 128_000, maxOutputTokens: 16_384,
    pricing: { inputPer1k: 0.0025, outputPer1k: 0.01, currency: "USD" },
    latencyProfile: { p50Ms: 1200, p95Ms: 3500, p99Ms: 6000, tpot: 18 },
    metadata: {},
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini", provider: "openai", name: "gpt-4o-mini", displayName: "GPT-4o Mini",
    status: "active", tier: "standard",
    capabilities: ["chat", "function_calling", "streaming"],
    contextWindow: 128_000, maxOutputTokens: 16_384,
    pricing: { inputPer1k: 0.00015, outputPer1k: 0.0006, currency: "USD" },
    latencyProfile: { p50Ms: 400, p95Ms: 1200, p99Ms: 2000, tpot: 6 },
    metadata: {},
  },
  "claude-3-7-sonnet": {
    id: "claude-3-7-sonnet", provider: "anthropic", name: "claude-3-7-sonnet-20250219",
    displayName: "Claude 3.7 Sonnet", status: "active", tier: "premium",
    capabilities: ["chat", "function_calling", "streaming", "long_context"],
    contextWindow: 200_000, maxOutputTokens: 128_000,
    pricing: { inputPer1k: 0.003, outputPer1k: 0.015, currency: "USD" },
    latencyProfile: { p50Ms: 1400, p95Ms: 4000, p99Ms: 7000, tpot: 20 },
    metadata: {},
  },
  "claude-3-5-haiku": {
    id: "claude-3-5-haiku", provider: "anthropic", name: "claude-3-5-haiku-20241022",
    displayName: "Claude 3.5 Haiku", status: "active", tier: "standard",
    capabilities: ["chat", "function_calling", "streaming"],
    contextWindow: 200_000, maxOutputTokens: 8_192,
    pricing: { inputPer1k: 0.0008, outputPer1k: 0.004, currency: "USD" },
    latencyProfile: { p50Ms: 350, p95Ms: 900, p99Ms: 1800, tpot: 5 },
    metadata: {},
  },
  "text-embedding-3-large": {
    id: "text-embedding-3-large", provider: "openai", name: "text-embedding-3-large",
    displayName: "Embedding v3 Large", status: "active", tier: "standard",
    capabilities: ["embedding"],
    contextWindow: 8_192, maxOutputTokens: 0,
    pricing: { inputPer1k: 0.00013, outputPer1k: 0, embedPer1k: 0.00013, currency: "USD" },
    latencyProfile: { p50Ms: 150, p95Ms: 400, p99Ms: 800, tpot: 0 },
    metadata: {},
  },
};

/* ── Default routing per task ───────────────────────────────────────── */

const TASK_DEFAULT_MODELS: Record<AITask, { standard: string; advanced: string; premium: string }> = {
  sar_generation:       { standard: "gpt-4o-mini",      advanced: "gpt-4o",            premium: "claude-3-7-sonnet" },
  alert_analysis:       { standard: "gpt-4o-mini",      advanced: "gpt-4o",            premium: "gpt-4o" },
  entity_extraction:    { standard: "gpt-4o-mini",      advanced: "gpt-4o-mini",       premium: "gpt-4o" },
  risk_explanation:     { standard: "gpt-4o-mini",      advanced: "gpt-4o",            premium: "claude-3-7-sonnet" },
  regulatory_qa:        { standard: "gpt-4o-mini",      advanced: "claude-3-5-haiku",  premium: "claude-3-7-sonnet" },
  transaction_narrative:{ standard: "gpt-4o-mini",      advanced: "gpt-4o-mini",       premium: "gpt-4o" },
  pep_research:         { standard: "gpt-4o-mini",      advanced: "gpt-4o",            premium: "claude-3-7-sonnet" },
  document_summary:     { standard: "gpt-4o-mini",      advanced: "gpt-4o-mini",       premium: "gpt-4o" },
  chat_assistant:       { standard: "gpt-4o-mini",      advanced: "gpt-4o",            premium: "claude-3-7-sonnet" },
  embedding:            { standard: "text-embedding-3-large", advanced: "text-embedding-3-large", premium: "text-embedding-3-large" },
};

/* ── Orchestrator ───────────────────────────────────────────────────── */

export class ModelOrchestrator {
  private routingConfig?: ModelRoutingConfig;

  /* ── Initialise with workspace routing config ─────────────────────── */

  async loadRoutingConfig(workspaceId: string, tierCode: string): Promise<void> {
    try {
      const { data } = await apiGateway.get<ModelRoutingConfig>(
        `/workspaces/${workspaceId}/model-config`,
        { cacheTtlMs: 60_000 },   // cache 1 min
      );
      this.routingConfig = data;
    } catch {
      // Fall back to default routing — no crash
      this.routingConfig = this.buildDefaultConfig(workspaceId, tierCode as "standard" | "advanced" | "premium");
    }
  }

  /* ── Select model for a task ─────────────────────────────────────── */

  selectModel(task: AITask, token: AccessTokenPayload, overrideModelId?: string): RegisteredModel {
    if (overrideModelId && MODEL_REGISTRY[overrideModelId]) {
      return MODEL_REGISTRY[overrideModelId];
    }

    const config = this.routingConfig;
    if (config) {
      // Evaluate routing rules in priority order
      const sortedRules = [...config.rules].sort((a, b) => a.priority - b.priority);
      for (const rule of sortedRules) {
        if (this.evaluateCondition(rule.condition, task, token)) {
          return MODEL_REGISTRY[rule.targetModel] ?? this.defaultModelForTask(task, token.tier);
        }
      }
    }

    return this.defaultModelForTask(task, token.tier);
  }

  /* ── Inference (single-turn, non-streaming) ──────────────────────── */

  async infer(request: InferenceRequest, token: AccessTokenPayload): Promise<InferenceResponse> {
    const model   = this.selectModel(request.task, token, request.model);
    const fallbacks = this.routingConfig?.fallbackChain ?? [];

    const toTry = [model.id, ...fallbacks.filter(id => id !== model.id)];

    let lastError: Error | undefined;
    for (const modelId of toTry) {
      try {
        const { data } = await apiGateway.post<InferenceResponse>(
          "/ai/infer",
          { ...request, model: modelId },
          { timeoutMs: 60_000, idempotencyKey: `${request.id}-${modelId}` },
        );
        // Track usage
        usageTracker.record(request.workspaceId, "ai_tokens_input",  data.usage.promptTokens,     { model: modelId });
        usageTracker.record(request.workspaceId, "ai_tokens_output", data.usage.completionTokens, { model: modelId });
        return data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Continue to next fallback
      }
    }
    throw lastError ?? new Error("All models exhausted");
  }

  /* ── Streaming inference ─────────────────────────────────────────── */

  stream(
    request: InferenceRequest,
    token: AccessTokenPayload,
    onChunk: (chunk: StreamChunk) => void,
    onDone:  (response: InferenceResponse) => void,
    onError: (err: Error) => void,
  ): () => void {
    const model = this.selectModel(request.task, token, request.model);

    return apiGateway.stream(
      `/ai/stream`,
      (raw) => {
        try { onChunk(JSON.parse(raw) as StreamChunk); } catch { /* skip malformed */ }
      },
      () => {
        // Usage tracked by the backend on stream completion
        apiGateway.get<InferenceResponse>(`/ai/stream/${request.id}/result`)
          .then(({ data }) => onDone(data))
          .catch(onError);
      },
      onError,
    );
  }

  /* ── Embeddings ──────────────────────────────────────────────────── */

  async embed(texts: string[], workspaceId: string): Promise<number[][]> {
    const { data } = await apiGateway.post<{ embeddings: number[][] }>("/ai/embed", { texts });
    usageTracker.record(workspaceId, "ai_tokens_input", texts.join("").length / 4); // approx tokens
    return data.embeddings;
  }

  /* ── Helpers ─────────────────────────────────────────────────────── */

  private evaluateCondition(condition: RoutingCondition, task: AITask, token: AccessTokenPayload): boolean {
    switch (condition.type) {
      case "task":           return condition.task === task;
      case "context_length": return true; // evaluated at call time
      case "user_role":      return token.roles.some(r => condition.roles.includes(r));
      case "feature_flag":   return false; // resolved server-side
      case "always":         return true;
    }
  }

  private defaultModelForTask(task: AITask, tier: string): RegisteredModel {
    const t = (["standard", "advanced", "premium"].includes(tier) ? tier : "standard") as "standard" | "advanced" | "premium";
    const id = TASK_DEFAULT_MODELS[task]?.[t] ?? "gpt-4o-mini";
    return MODEL_REGISTRY[id];
  }

  private buildDefaultConfig(workspaceId: string, tier: "standard" | "advanced" | "premium"): ModelRoutingConfig {
    return {
      workspaceId,
      defaultModel:  tier === "premium" ? "claude-3-7-sonnet" : "gpt-4o-mini",
      fallbackChain: ["gpt-4o", "gpt-4o-mini", "claude-3-5-haiku"],
      rules:         [],
      costOptimize:  tier === "standard",
      latencyTarget: 5000,
    };
  }
}

export const modelOrchestrator = new ModelOrchestrator();
