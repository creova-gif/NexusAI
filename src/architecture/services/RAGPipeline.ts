/**
 * NexusAI — RAG Pipeline Service
 * Manages document ingestion, embedding, vector storage, and retrieval.
 * Per-workspace namespace isolation — no cross-tenant data leakage.
 */

import type {
  DocumentIngestionJob, DocumentMimeType, RAGPipelineConfig, RAGQuery,
  VectorNamespace, UserMemory,
} from "../types/pipeline";
import type { RAGSource, InferenceRequest } from "../types/models";
import { apiGateway } from "./ApiGateway";
import { modelOrchestrator } from "./ModelOrchestrator";
import { usageTracker } from "./UsageTracker";

export class RAGPipelineService {
  private config?: RAGPipelineConfig;
  private namespace?: VectorNamespace;

  /* ── Initialise for a workspace ──────────────────────────────────── */

  async init(workspaceId: string): Promise<void> {
    const [configRes, nsRes] = await Promise.all([
      apiGateway.get<RAGPipelineConfig>(`/rag/${workspaceId}/config`, { cacheTtlMs: 60_000 }),
      apiGateway.get<VectorNamespace>(`/rag/${workspaceId}/namespace`, { cacheTtlMs: 60_000 }),
    ]);
    this.config    = configRes.data;
    this.namespace = nsRes.data;
  }

  /* ── Document Ingestion ──────────────────────────────────────────── */

  async ingestDocument(
    workspaceId: string,
    file: File,
    metadata: Partial<DocumentIngestionJob["metadata"]> = {},
  ): Promise<DocumentIngestionJob> {
    // 1. Get presigned S3 upload URL
    const { data: { uploadUrl, storageKey, jobId } } = await apiGateway.post<{
      uploadUrl: string; storageKey: string; jobId: string;
    }>(`/rag/${workspaceId}/upload-url`, {
      filename:  file.name,
      mimeType:  file.type as DocumentMimeType,
      sizeBytes: file.size,
      metadata,
    });

    // 2. Upload directly to S3 (never through our servers)
    const uploadRes = await fetch(uploadUrl, {
      method:  "PUT",
      body:    file,
      headers: { "Content-Type": file.type },
    });
    if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`);

    // 3. Trigger ingestion pipeline
    const { data: job } = await apiGateway.post<DocumentIngestionJob>(
      `/rag/${workspaceId}/ingest`,
      { jobId, storageKey, metadata },
    );

    usageTracker.record(workspaceId, "document_pages", job.pageCount ?? 1);
    return job;
  }

  /* ── Poll ingestion job status ───────────────────────────────────── */

  async pollIngestionJob(workspaceId: string, jobId: string): Promise<DocumentIngestionJob> {
    const { data } = await apiGateway.get<DocumentIngestionJob>(
      `/rag/${workspaceId}/jobs/${jobId}`,
    );
    return data;
  }

  watchIngestionJob(
    workspaceId: string,
    jobId: string,
    onUpdate: (job: DocumentIngestionJob) => void,
  ): () => void {
    return apiGateway.stream(
      `/rag/${workspaceId}/jobs/${jobId}/stream`,
      (raw) => {
        try { onUpdate(JSON.parse(raw) as DocumentIngestionJob); } catch { /* skip */ }
      },
      () => { /* done */ },
      () => { /* error — caller polling fallback */ },
    );
  }

  /* ── Semantic Retrieval ──────────────────────────────────────────── */

  async retrieve(workspaceId: string, query: string, options: Partial<RAGPipelineConfig> = {}): Promise<RAGSource[]> {
    const cfg = { ...this.config, ...options };
    const { data } = await apiGateway.post<RAGQuery>(`/rag/${workspaceId}/retrieve`, {
      query,
      topK:          cfg.topK          ?? 6,
      minSimilarity: cfg.minSimilarity ?? 0.72,
      rerankEnabled: cfg.rerankEnabled ?? true,
      filter:        options,
    });
    return data.results;
  }

  /* ── Augment inference request with RAG context ──────────────────── */

  async augmentRequest(
    request: InferenceRequest,
    contextQuery: string,
  ): Promise<InferenceRequest> {
    if (!this.config) return request;

    const sources = await this.retrieve(request.workspaceId, contextQuery);
    if (sources.length === 0) return request;

    const contextText = sources
      .map((s, i) => `[${i + 1}] ${s.documentName} (similarity: ${s.similarity.toFixed(2)})\n${s.excerpt}`)
      .join("\n\n---\n\n");

    const systemMessage = request.messages.find(m => m.role === "system");
    const ragInjection  = `\n\n### Relevant Context from Knowledge Base\n${contextText}\n\n`;

    if (systemMessage) {
      const updated = request.messages.map(m =>
        m.role === "system" ? { ...m, content: (m.content as string) + ragInjection } : m,
      );
      return { ...request, messages: updated, ragContext: { namespaceId: this.namespace?.id ?? workspaceId(request), query: contextQuery, topK: sources.length, minSimilarity: 0.72 } };
    }

    return {
      ...request,
      messages: [{ role: "system", content: `You are NexusAI, a specialist AML compliance assistant.${ragInjection}` }, ...request.messages],
    };
  }

  /* ── User Memory ─────────────────────────────────────────────────── */

  async saveMemory(memory: Omit<UserMemory, "id" | "createdAt" | "updatedAt" | "embedding">): Promise<UserMemory> {
    const { data } = await apiGateway.post<UserMemory>(`/memory`, memory);
    return data;
  }

  async recallMemory(workspaceId: string, userId: string, query: string, limit = 5): Promise<UserMemory[]> {
    const { data } = await apiGateway.post<UserMemory[]>(`/memory/recall`, {
      workspaceId, userId, query, limit,
    });
    return data;
  }

  async clearSessionMemory(workspaceId: string, userId: string): Promise<void> {
    await apiGateway.delete(`/memory/session?workspaceId=${workspaceId}&userId=${userId}`);
  }

  /* ── Document Management ─────────────────────────────────────────── */

  async listDocuments(workspaceId: string, page = 1, pageSize = 20): Promise<DocumentIngestionJob[]> {
    const { data } = await apiGateway.get<{ items: DocumentIngestionJob[] }>(
      `/rag/${workspaceId}/documents?page=${page}&pageSize=${pageSize}`,
    );
    return data.items;
  }

  async deleteDocument(workspaceId: string, documentId: string): Promise<void> {
    await apiGateway.delete(`/rag/${workspaceId}/documents/${documentId}`);
  }

  getNamespaceStats(): VectorNamespace | undefined {
    return this.namespace;
  }
}

// Helper to extract workspaceId from request
function workspaceId(req: InferenceRequest): string { return req.workspaceId; }

export const ragPipeline = new RAGPipelineService();
