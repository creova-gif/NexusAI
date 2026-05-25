/**
 * NexusAI — AI Pipeline, RAG & Data Flow Types
 * Defines the complete lifecycle of AI workflows: ingestion → embedding →
 * retrieval → inference → post-processing → output → audit.
 */

import type { InferenceRequest, InferenceResponse, RAGSource } from "./models";

export type PipelineStatus = "idle" | "queued" | "running" | "completed" | "failed" | "retrying";
export type DocumentMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "text/plain" | "text/csv" | "text/html"
  | "image/png" | "image/jpeg" | "image/tiff"  // OCR
  | "application/json" | "application/xml";

/* ── Document Ingestion Pipeline ───────────────────────────────────── */

export interface DocumentIngestionJob {
  id:            string;
  workspaceId:   string;
  uploadedBy:    string;
  filename:      string;
  mimeType:      DocumentMimeType;
  sizeBytes:     number;
  storageKey:    string;           // S3 object key (workspace-namespaced)
  status:        PipelineStatus;
  stages:        IngestionStage[];
  chunkCount?:   number;
  vectorCount?:  number;
  pageCount?:    number;
  errorMsg?:     string;
  retryCount:    number;
  createdAt:     string;
  completedAt?:  string;
  metadata:      DocumentMetadata;
}

export interface IngestionStage {
  name:       "upload" | "parse" | "chunk" | "embed" | "index" | "verify";
  status:     PipelineStatus;
  startedAt?: string;
  doneAt?:    string;
  error?:     string;
  details?:   Record<string, unknown>;
}

export interface DocumentMetadata {
  title?:       string;
  author?:      string;
  source?:      string;           // "regulatory" | "internal" | "client"
  language?:    string;
  tags:         string[];
  category?:    "regulation" | "guideline" | "policy" | "case_file" | "sar" | "kyc";
  jurisdiction?: string;
  effectiveDate?: string;
  expiryDate?:  string;
}

/* ── Vector Store ──────────────────────────────────────────────────── */

export interface VectorNamespace {
  id:           string;           // = workspaceId (per-tenant isolation)
  workspaceId:  string;
  vectorCount:  number;
  storageBytes: number;
  embeddingModel: string;
  dimensions:   number;           // e.g. 1536 for text-embedding-3-large
  indexType:    "hnsw" | "ivfflat";
  metric:       "cosine" | "euclidean" | "dotproduct";
  createdAt:    string;
  updatedAt:    string;
}

export interface VectorRecord {
  id:          string;
  namespaceId: string;
  documentId:  string;
  chunkIndex:  number;
  text:        string;            // original chunk text (stored alongside vector)
  embedding:   number[];          // float32 vector
  metadata:    DocumentMetadata & { pageNumber?: number; charOffset?: number };
  createdAt:   string;
}

/* ── RAG Pipeline ──────────────────────────────────────────────────── */

export interface RAGPipelineConfig {
  workspaceId:       string;
  retrievalStrategy: "similarity" | "mmr" | "hybrid";  // hybrid = similarity + BM25
  topK:              number;      // chunks to retrieve
  minSimilarity:     number;      // filter threshold
  rerankEnabled:     boolean;
  rerankModel?:      string;
  contextWindow:     number;      // max chars to inject into prompt
  citationsEnabled:  boolean;
  chunkSize:         number;      // tokens per chunk
  chunkOverlap:      number;      // overlap tokens
}

export interface RAGQuery {
  id:           string;
  workspaceId:  string;
  userId:       string;
  query:        string;
  embeddedQuery: number[];
  config:       Partial<RAGPipelineConfig>;
  results:      RAGSource[];
  latencyMs:    number;
  timestamp:    string;
}

/* ── AI Workflow Orchestration ─────────────────────────────────────── */

export interface AIWorkflow {
  id:           string;
  workspaceId:  string;
  name:         string;
  trigger:      WorkflowTrigger;
  steps:        WorkflowStep[];
  status:       PipelineStatus;
  variables:    Record<string, unknown>;
  createdBy:    string;
  createdAt:    string;
  lastRunAt?:   string;
  runCount:     number;
}

export type WorkflowTrigger =
  | { type: "alert_created"; conditions: Record<string, unknown> }
  | { type: "sar_status_change"; fromStatus: string; toStatus: string }
  | { type: "schedule"; cron: string; timezone: string }
  | { type: "api"; endpoint: string }
  | { type: "manual" };

export interface WorkflowStep {
  id:       string;
  order:    number;
  type:     WorkflowStepType;
  name:     string;
  config:   Record<string, unknown>;
  retryPolicy: RetryPolicy;
  onSuccess?: string;             // next step id
  onFailure?: string;             // step id or "stop"
}

export type WorkflowStepType =
  | "ai_inference"               // call LLM
  | "rag_retrieval"              // vector search
  | "data_lookup"                // DB query
  | "external_api"               // REST call
  | "condition"                  // if/else branch
  | "transform"                  // data mapping
  | "notification"               // email/webhook
  | "human_review"               // pause for approval
  | "loop";                      // iterate over collection

export interface RetryPolicy {
  maxAttempts: number;
  backoffType: "fixed" | "exponential";
  initialDelayMs: number;
  maxDelayMs:     number;
}

/* ── Pipeline Run ──────────────────────────────────────────────────── */

export interface PipelineRun {
  id:          string;
  workflowId:  string;
  workspaceId: string;
  triggeredBy: string;           // userId or "system"
  status:      PipelineStatus;
  inputs:      Record<string, unknown>;
  outputs?:    Record<string, unknown>;
  stepResults: StepResult[];
  startedAt:   string;
  completedAt?: string;
  durationMs?: number;
  tokenUsage?: { input: number; output: number };
  cost?:       number;           // USD
  error?:      string;
}

export interface StepResult {
  stepId:      string;
  status:      PipelineStatus;
  input:       Record<string, unknown>;
  output?:     Record<string, unknown>;
  inference?:  { request: InferenceRequest; response: InferenceResponse };
  ragResults?: RAGSource[];
  startedAt:   string;
  completedAt?: string;
  attempt:     number;
  error?:      string;
}

/* ── Memory & Context ──────────────────────────────────────────────── */

export interface UserMemory {
  id:          string;
  workspaceId: string;
  userId:      string;
  scope:       "session" | "workspace" | "global";
  type:        "fact" | "preference" | "context" | "instruction";
  content:     string;
  embedding?:  number[];
  metadata:    Record<string, unknown>;
  importance:  number;           // 0.0–1.0 for retrieval ranking
  expiresAt?:  string;
  createdAt:   string;
  updatedAt:   string;
}

export interface ConversationThread {
  id:          string;
  workspaceId: string;
  userId:      string;
  title?:      string;
  summary?:    string;           // auto-generated thread summary
  messageCount: number;
  tokenCount:   number;
  relatedAlerts?: string[];
  relatedSARs?:   string[];
  createdAt:   string;
  lastMessageAt: string;
  archivedAt?: string;
}
