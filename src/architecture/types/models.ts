/**
 * NexusAI — AI Model Registry & Orchestration Types
 * Defines every model the platform can route to, including fallback chains,
 * routing rules, cost tracking, and streaming interfaces.
 */

export type ModelProvider = "openai" | "anthropic" | "cohere" | "mistral" | "nexusai" | "azure_openai";
export type ModelCapability =
  | "chat"              // conversational completions
  | "completion"        // single-turn text completion
  | "embedding"         // vector embeddings
  | "function_calling"  // structured tool use
  | "vision"            // image understanding
  | "streaming"         // SSE streaming support
  | "fine_tunable"      // can be fine-tuned
  | "long_context";     // 100k+ context window

export type ModelStatus = "active" | "deprecated" | "beta" | "internal";

/* ── Model Registry ────────────────────────────────────────────────── */

export interface RegisteredModel {
  id:              string;         // e.g. "gpt-4o", "claude-3-7-sonnet"
  provider:        ModelProvider;
  name:            string;
  displayName:     string;
  status:          ModelStatus;
  capabilities:    ModelCapability[];
  contextWindow:   number;         // tokens
  maxOutputTokens: number;
  pricing:         ModelPricing;
  latencyProfile:  LatencyProfile;
  tier:            "standard" | "advanced" | "premium";
  region?:         string[];       // available regions
  deploymentId?:   string;         // Azure OpenAI deployment name
  metadata:        Record<string, unknown>;
}

export interface ModelPricing {
  inputPer1k:   number;            // USD per 1k input tokens
  outputPer1k:  number;            // USD per 1k output tokens
  embedPer1k?:  number;            // USD per 1k embedding tokens
  currency:     "USD";
}

export interface LatencyProfile {
  p50Ms:   number;
  p95Ms:   number;
  p99Ms:   number;
  tpot:    number;                 // time per output token (ms)
}

/* ── Model Router ──────────────────────────────────────────────────── */

export interface ModelRoutingConfig {
  workspaceId:   string;
  defaultModel:  string;           // model id
  fallbackChain: string[];         // ordered list, tried on error/capacity
  rules:         RoutingRule[];
  costOptimize:  boolean;          // auto-route cheap model for simple tasks
  latencyTarget: number;           // max acceptable p95 ms
}

export interface RoutingRule {
  id:          string;
  priority:    number;             // lower = higher priority
  condition:   RoutingCondition;
  targetModel: string;
  overrides?:  Partial<InferenceParams>;
}

export type RoutingCondition =
  | { type: "task"; task: AITask }
  | { type: "context_length"; minTokens: number; maxTokens?: number }
  | { type: "user_role"; roles: string[] }
  | { type: "feature_flag"; flag: string }
  | { type: "always" };

export type AITask =
  | "sar_generation"           // SAR report drafting
  | "alert_analysis"           // AML alert triage
  | "entity_extraction"        // NER for entities
  | "risk_explanation"         // XAI risk score explanation
  | "regulatory_qa"            // PCMLTFA / FINTRAC Q&A
  | "transaction_narrative"    // transaction summary
  | "pep_research"             // PEP/UBO research
  | "document_summary"         // doc ingestion summary
  | "chat_assistant"           // conversational help
  | "embedding";               // vector generation

/* ── Inference Request / Response ──────────────────────────────────── */

export interface InferenceRequest {
  id:           string;            // request correlation id
  workspaceId:  string;
  userId:       string;
  task:         AITask;
  model?:       string;            // override default routing
  messages:     ChatMessage[];
  tools?:       ToolDefinition[];
  params:       InferenceParams;
  ragContext?:  RAGContext;
  stream:       boolean;
  metadata:     InferenceMetadata;
}

export interface ChatMessage {
  role:      "system" | "user" | "assistant" | "tool";
  content:   string | ContentBlock[];
  name?:     string;
  toolCallId?: string;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };

export interface ToolDefinition {
  type:     "function";
  function: {
    name:        string;
    description: string;
    parameters:  Record<string, unknown>;  // JSON Schema
  };
}

export interface InferenceParams {
  temperature?:  number;           // 0.0–2.0
  topP?:         number;
  maxTokens?:    number;
  stop?:         string[];
  seed?:         number;           // for reproducibility
  responseFormat?: "text" | "json_object";
}

export interface RAGContext {
  namespaceId:    string;          // workspace vector namespace
  query:          string;
  topK:           number;
  minSimilarity:  number;          // e.g. 0.75
  filter?:        Record<string, unknown>;  // metadata filter
}

export interface InferenceMetadata {
  correlationId:  string;
  sessionId?:     string;
  featureId?:     string;         // which UI feature triggered this
  alertId?:       string;
  sarId?:         string;
  latencyBudgetMs?: number;
}

export interface InferenceResponse {
  id:            string;
  requestId:     string;
  model:         string;           // actual model used
  provider:      ModelProvider;
  choices:       InferenceChoice[];
  usage:         TokenUsage;
  ragSources?:   RAGSource[];
  latencyMs:     number;
  finishReason:  "stop" | "length" | "tool_calls" | "content_filter" | "error";
  cached:        boolean;
  cost:          ModelPricing;
  timestamp:     string;
}

export interface InferenceChoice {
  index:         number;
  message:       ChatMessage;
  toolCalls?:    ToolCall[];
  logprobs?:     unknown;
}

export interface ToolCall {
  id:       string;
  type:     "function";
  function: { name: string; arguments: string };
}

export interface TokenUsage {
  promptTokens:     number;
  completionTokens: number;
  totalTokens:      number;
  cachedTokens?:    number;
}

export interface RAGSource {
  documentId:   string;
  documentName: string;
  pageNumber?:  number;
  excerpt:      string;
  similarity:   number;           // cosine similarity score
  metadata:     Record<string, unknown>;
}

/* ── Streaming ─────────────────────────────────────────────────────── */

export interface StreamChunk {
  id:       string;
  type:     "delta" | "done" | "error";
  delta?:   { content?: string; toolCall?: Partial<ToolCall> };
  error?:   { code: string; message: string };
  usage?:   TokenUsage;            // final chunk only
}

/* ── Fine-Tuning ───────────────────────────────────────────────────── */

export interface FineTuneJob {
  id:           string;
  workspaceId:  string;
  baseModelId:  string;
  name:         string;
  status:       "queued" | "running" | "completed" | "failed" | "cancelled";
  datasetUrl:   string;            // S3 presigned URL
  sampleCount:  number;
  epochs:       number;
  resultModelId?: string;
  trainLoss?:   number;
  validLoss?:   number;
  createdAt:    string;
  completedAt?: string;
  costUSD?:     number;
}
