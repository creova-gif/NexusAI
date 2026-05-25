/**
 * NexusAI — Subscription, Billing & Usage Types
 * Defines tier capabilities, rate limits, usage metering, and billing records.
 */

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "paused";
export type BillingCycle       = "monthly" | "annual" | "multi_year" | "custom";
export type CurrencyCode       = "CAD" | "USD" | "EUR" | "GBP";
export type UsageMetric        =
  | "api_requests"        // all API calls
  | "ai_tokens_input"     // LLM prompt tokens
  | "ai_tokens_output"    // LLM completion tokens
  | "sar_generated"       // SAR reports generated
  | "kyc_checks"          // perpetual KYC checks run
  | "alert_processed"     // AML alerts processed
  | "document_pages"      // docs ingested for RAG
  | "vector_storage_mb"   // vector store size
  | "active_users"        // MAU
  | "api_key_calls"       // calls via API keys
  | "webhook_deliveries"; // outbound webhook calls

/* ── Plans ─────────────────────────────────────────────────────────── */

export interface SubscriptionPlan {
  id:              string;
  code:            "starter" | "professional" | "enterprise" | "government";
  name:            string;
  description:     string;
  basePrice:       MoneyAmount;
  billingCycle:    BillingCycle;
  seats:           SeatsConfig;
  limits:          PlanLimits;
  features:        PlanFeatures;
  models:          AllowedModels;
  support:         SupportConfig;
  sla:             SLAConfig;
  isPublic:        boolean;
  trialDays:       number;
}

export interface MoneyAmount {
  amount:   number;                // in cents / lowest denomination
  currency: CurrencyCode;
}

export interface SeatsConfig {
  included:   number;
  max:        number | "unlimited";
  perSeatPrice?: MoneyAmount;
}

export interface PlanLimits {
  apiRequestsPerMonth:     number | "unlimited";
  aiTokensPerMonth:        number | "unlimited";    // input + output combined
  sarPerMonth:             number | "unlimited";
  kycChecksPerMonth:       number | "unlimited";
  vectorStorageMB:         number | "unlimited";
  documentPagesPerMonth:   number | "unlimited";
  alertsPerMonth:          number | "unlimited";
  webhooksPerDay:          number | "unlimited";
  rateLimits:              RateLimitMatrix;
  dataRetentionDays:       number;
  apiKeys:                 number;
}

export interface RateLimitMatrix {
  requestsPerSecond:    number;
  requestsPerMinute:    number;
  requestsPerHour:      number;
  tokensPerMinute:      number;    // AI inference throughput
  concurrentRequests:   number;
  burstAllowed:         boolean;
}

export interface PlanFeatures {
  // Core AML
  amlAlertQueue:          boolean;
  riskScoring:            boolean;
  entityNetworkGraph:     boolean;
  transactionMonitoring:  boolean;

  // Reporting
  sarGenerator:           boolean;
  fintracReporting:       boolean;
  customReports:          boolean;
  exportCSV:              boolean;
  exportPDF:              boolean;

  // AI Features
  agenticInvestigator:    boolean;
  aiExplainability:       boolean;    // XAI — explain AI decisions
  federatedLearning:      boolean;    // contribute to federated model
  ragPipeline:            boolean;    // custom doc ingestion + RAG
  customEmbeddings:       boolean;    // BYO embedding model
  fineTunedModels:        boolean;    // workspace-specific fine-tunes

  // Compliance
  perpetualKyc:           boolean;
  sanctionsScreening:     boolean;
  pepScreening:           boolean;
  adverseMediaScreening:  boolean;
  uboDiscovery:           boolean;
  cryptoForensics:        boolean;

  // Governance
  rulesEngine:            boolean;
  customRules:            boolean;
  auditTrail:             boolean;
  immutableAuditExport:   boolean;    // write-once S3/WORM

  // Enterprise
  ssoSaml:                boolean;
  ssoOidc:                boolean;
  customDomain:           boolean;
  whiteLabel:             boolean;
  siem Integration:       boolean;    // SIEM webhook/syslog
  ipAllowlisting:         boolean;
  dedicatedInfra:         boolean;
  bringYourOwnKey:        boolean;    // BYOK encryption
}

export interface AllowedModels {
  primary:    ModelTier;            // default model
  fallback:   ModelTier;            // when primary is overloaded
  embedding:  EmbeddingModelCode;
  custom?:    string[];             // fine-tuned model IDs
}

export type ModelTier = "standard" | "advanced" | "premium" | "custom";
export type EmbeddingModelCode =
  | "text-embedding-3-small"
  | "text-embedding-3-large"
  | "cohere-embed-v4"
  | "custom";

export interface SupportConfig {
  responseTimeSLA:  string;         // e.g. "4h" | "1h" | "15min"
  channels:         ("email" | "chat" | "phone" | "dedicated_csm")[];
  onboarding:       "self_serve" | "guided" | "white_glove";
  trainingIncluded: boolean;
}

export interface SLAConfig {
  uptimePercent:    number;         // e.g. 99.9
  rpoHours:         number;         // Recovery Point Objective
  rtoHours:         number;         // Recovery Time Objective
  penaltyPolicy?:   string;
}

/* ── Subscription Instance ─────────────────────────────────────────── */

export interface WorkspaceSubscription {
  id:              string;
  workspaceId:     string;
  planId:          string;
  status:          SubscriptionStatus;
  billingCycle:    BillingCycle;
  seats:           number;
  startedAt:       string;
  currentPeriodStart: string;
  currentPeriodEnd:   string;
  trialEndsAt?:    string;
  canceledAt?:     string;
  pausedAt?:       string;
  nextBillingDate: string;
  customOverrides?: Partial<PlanLimits>; // sales negotiated terms
  paymentMethodId: string;
  invoiceEmail:    string;
  purchaseOrder?:  string;         // government/enterprise PO number
  notes?:          string;
}

/* ── Usage Tracking ────────────────────────────────────────────────── */

export interface UsageRecord {
  id:           string;
  workspaceId:  string;
  userId?:      string;
  metric:       UsageMetric;
  value:        number;
  metadata?:    Record<string, unknown>;  // model used, endpoint, etc.
  billingPeriod: string;           // "2026-05"
  timestamp:    string;
}

export interface WorkspaceUsageSummary {
  workspaceId:   string;
  billingPeriod: string;
  totals:        Record<UsageMetric, number>;
  limits:        Record<UsageMetric, number | "unlimited">;
  percentUsed:   Record<UsageMetric, number | null>;
  overages:      UsageOverage[];
  estimatedCost?: MoneyAmount;
}

export interface UsageOverage {
  metric:        UsageMetric;
  limitValue:    number;
  actualValue:   number;
  overageValue:  number;
  overagePrice?: MoneyAmount;
}

/* ── Billing ───────────────────────────────────────────────────────── */

export interface Invoice {
  id:            string;
  workspaceId:   string;
  subscriptionId: string;
  status:        "draft" | "open" | "paid" | "uncollectible" | "void";
  lineItems:     InvoiceLineItem[];
  subtotal:      MoneyAmount;
  tax:           MoneyAmount;
  total:         MoneyAmount;
  currency:      CurrencyCode;
  issuedAt:      string;
  dueAt:         string;
  paidAt?:       string;
  paymentMethod: string;
  downloadUrl?:  string;
}

export interface InvoiceLineItem {
  description:  string;
  quantity:     number;
  unitPrice:    MoneyAmount;
  total:        MoneyAmount;
  period?:      { start: string; end: string };
}
