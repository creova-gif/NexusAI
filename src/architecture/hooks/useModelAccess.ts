/**
 * NexusAI — useModelAccess Hook
 * Provides typed access to AI inference, streaming, and RAG pipeline
 * from React components. Handles rate limit checks, usage tracking,
 * and optimistic streaming state.
 */

import { useState, useCallback, useRef } from "react";
import type { InferenceRequest, InferenceResponse, StreamChunk, AITask, ChatMessage } from "../types/models";
import type { RAGPipelineConfig } from "../types/pipeline";
import { modelOrchestrator } from "../services/ModelOrchestrator";
import { ragPipeline } from "../services/RAGPipeline";
import { usageTracker } from "../services/UsageTracker";
import { useAuthContext } from "../context/AuthContext";
import { usePermissions } from "./usePermissions";

export interface UseModelAccessReturn {
  // Single-turn inference
  infer: (params: InferModelParams) => Promise<InferenceResponse | null>;

  // Streaming inference
  stream: (params: InferModelParams, onChunk: (text: string) => void) => Promise<InferenceResponse | null>;
  stopStream: () => void;

  // RAG-augmented inference
  inferWithRAG: (params: InferModelParams & { contextQuery?: string }) => Promise<InferenceResponse | null>;

  // Embeddings
  embed: (texts: string[]) => Promise<number[][]>;

  // State
  isLoading:   boolean;
  isStreaming:  boolean;
  error:        string | null;
  lastResponse: InferenceResponse | null;
  rateLimitHit: boolean;
  clearError:   () => void;
}

export interface InferModelParams {
  task:        AITask;
  messages:    ChatMessage[];
  model?:      string;
  systemPrompt?: string;
  maxTokens?:  number;
  temperature?: number;
  useRAG?:     boolean;
  ragOptions?: Partial<RAGPipelineConfig>;
}

let requestCounter = 0;

export function useModelAccess(): UseModelAccessReturn {
  const { tokenPayload, currentWorkspaceId } = useAuthContext();
  const { can } = usePermissions();

  const [isLoading,    setIsLoading]    = useState(false);
  const [isStreaming,  setIsStreaming]  = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<InferenceResponse | null>(null);
  const [rateLimitHit, setRateLimitHit] = useState(false);

  const stopFnRef = useRef<(() => void) | undefined>(undefined);

  /* ── Build request ───────────────────────────────────────────── */

  const buildRequest = useCallback((params: InferModelParams): InferenceRequest => {
    const messages = params.systemPrompt
      ? [{ role: "system" as const, content: params.systemPrompt }, ...params.messages]
      : params.messages;

    return {
      id:          `req-${++requestCounter}-${Date.now()}`,
      workspaceId: currentWorkspaceId ?? "",
      userId:      tokenPayload?.sub ?? "",
      task:        params.task,
      model:       params.model,
      messages,
      params: {
        maxTokens:   params.maxTokens,
        temperature: params.temperature,
      },
      stream:      false,
      metadata: {
        correlationId: crypto.randomUUID(),
        sessionId:     tokenPayload?.sid,
        featureId:     params.task,
      },
    };
  }, [currentWorkspaceId, tokenPayload]);

  /* ── Pre-flight checks ───────────────────────────────────────── */

  const preflightCheck = useCallback((): boolean => {
    if (!can("ai.chat")) {
      setError("Your plan does not include AI features.");
      return false;
    }
    const rl = usageTracker.checkRateLimit();
    if (!rl.allowed) {
      setRateLimitHit(true);
      setError(`Rate limit reached. Retry in ${Math.ceil(rl.retryAfterMs / 1000)}s.`);
      setTimeout(() => setRateLimitHit(false), rl.retryAfterMs);
      return false;
    }
    return true;
  }, [can]);

  /* ── Infer (blocking) ────────────────────────────────────────── */

  const infer = useCallback(async (params: InferModelParams): Promise<InferenceResponse | null> => {
    if (!preflightCheck() || !tokenPayload) return null;
    setIsLoading(true);
    setError(null);
    try {
      const request  = buildRequest(params);
      const response = await modelOrchestrator.infer(request, tokenPayload);
      setLastResponse(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI inference failed");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [preflightCheck, buildRequest, tokenPayload]);

  /* ── Stream ──────────────────────────────────────────────────── */

  const stream = useCallback(async (
    params: InferModelParams,
    onChunk: (text: string) => void,
  ): Promise<InferenceResponse | null> => {
    if (!preflightCheck() || !tokenPayload) return null;
    setIsStreaming(true);
    setError(null);

    return new Promise((resolve) => {
      const request = buildRequest({ ...params, model: params.model });

      stopFnRef.current = modelOrchestrator.stream(
        request,
        tokenPayload,
        (chunk: StreamChunk) => {
          if (chunk.type === "delta" && chunk.delta?.content) {
            onChunk(chunk.delta.content);
          }
        },
        (response) => {
          setLastResponse(response);
          setIsStreaming(false);
          resolve(response);
        },
        (err) => {
          setError(err.message);
          setIsStreaming(false);
          resolve(null);
        },
      );
    });
  }, [preflightCheck, buildRequest, tokenPayload]);

  const stopStream = useCallback(() => {
    stopFnRef.current?.();
    setIsStreaming(false);
  }, []);

  /* ── RAG-augmented inference ─────────────────────────────────── */

  const inferWithRAG = useCallback(async (
    params: InferModelParams & { contextQuery?: string },
  ): Promise<InferenceResponse | null> => {
    if (!preflightCheck() || !tokenPayload) return null;
    setIsLoading(true);
    setError(null);
    try {
      let request = buildRequest(params);
      if (params.contextQuery) {
        request = await ragPipeline.augmentRequest(request, params.contextQuery);
      }
      const response = await modelOrchestrator.infer(request, tokenPayload);
      setLastResponse(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : "RAG inference failed");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [preflightCheck, buildRequest, tokenPayload]);

  /* ── Embeddings ──────────────────────────────────────────────── */

  const embed = useCallback(async (texts: string[]): Promise<number[][]> => {
    if (!currentWorkspaceId) return [];
    return modelOrchestrator.embed(texts, currentWorkspaceId);
  }, [currentWorkspaceId]);

  return {
    infer, stream, stopStream, inferWithRAG, embed,
    isLoading, isStreaming, error, lastResponse, rateLimitHit,
    clearError: () => setError(null),
  };
}
