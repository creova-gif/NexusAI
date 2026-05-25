/**
 * NexusAI — Architecture Barrel Export
 * Single entry point for all architecture modules.
 *
 * Usage:
 *   import { authService, usePermissions, SUBSCRIPTION_PLANS } from "@/architecture";
 */

// Types
export * from "./types/index";

// Services (singletons)
export { authService, AuthService, AuthError }        from "./services/AuthService";
export { apiGateway, ApiGateway, GatewayError }       from "./services/ApiGateway";
export { modelOrchestrator, ModelOrchestrator, MODEL_REGISTRY } from "./services/ModelOrchestrator";
export { usageTracker, UsageTracker }                 from "./services/UsageTracker";
export { permissionsService, PermissionsService }     from "./services/PermissionsService";
export { ragPipeline, RAGPipelineService }            from "./services/RAGPipeline";
export { realtimePipeline, RealtimePipeline }         from "./services/RealtimePipeline";
export { workspaceService, WorkspaceService }         from "./services/WorkspaceService";

// Config
export { SUBSCRIPTION_PLANS, getPlan, isFeatureAllowed, getLimitValue } from "./config/subscription.config";
export { REGIONS, ENDPOINTS, API_GATEWAY, DATABASE, STORAGE, QUEUES, COMPUTE, CDN, OBSERVABILITY, SECURITY } from "./config/infrastructure.config";

// Database schema reference
export { SCHEMA, RLS_POLICIES, INDEX_STRATEGY }      from "./db/schema";

// Infrastructure
export { ENVIRONMENTS, PIPELINE_STAGES, DISASTER_RECOVERY } from "./infra/deployment.config";

// React Context
export { AuthProvider, useAuthContext }               from "./context/AuthContext";
export { WorkspaceProvider, useWorkspaceContext }     from "./context/WorkspaceContext";

// React Hooks
export { usePermissions, usePermissionGuard }         from "./hooks/usePermissions";
export { useModelAccess }                             from "./hooks/useModelAccess";
export { useRealtime, useAlertStream, useSARStatusStream, useRealtimeStatus } from "./hooks/useRealtime";
export { useUsage }                                   from "./hooks/useUsage";

// Observability
export { logger, reportWebVital, reportError }        from "./infra/observability";
