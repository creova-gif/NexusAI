/**
 * NexusAI — Infrastructure Configuration
 * Defines multi-region cloud topology, service endpoints, scaling policies,
 * caching layers, queue configurations, and observability settings.
 * Production values injected via environment variables at runtime.
 */

/* ── Regions ────────────────────────────────────────────────────────── */

export const REGIONS = {
  PRIMARY:   "ca-central-1",          // Montreal — OSFI/FINTRAC data residency
  SECONDARY: "ca-west-1",             // Calgary — DR / BC entities
  US_EAST:   "us-east-1",             // Cross-border banking (PCMLTFA s.9)
  EU_WEST:   "eu-west-1",             // EU clients / GDPR
} as const;

export const ACTIVE_REGION = import.meta.env.VITE_REGION ?? REGIONS.PRIMARY;

/* ── Service Endpoints ──────────────────────────────────────────────── */

export const ENDPOINTS = {
  API:        import.meta.env.VITE_API_URL       ?? "https://api.nexusai.ca",
  WS:         import.meta.env.VITE_WS_URL        ?? "wss://api.nexusai.ca/ws/v1",
  CDN:        import.meta.env.VITE_CDN_URL        ?? "https://cdn.nexusai.ca",
  VECTOR_DB:  import.meta.env.VITE_VECTOR_URL     ?? "https://vec.nexusai.ca",
  DOCS:       import.meta.env.VITE_DOCS_URL       ?? "https://docs.nexusai.ca",
  STATUS:     "https://status.nexusai.ca",
} as const;

/* ── API Gateway ────────────────────────────────────────────────────── */

export const API_GATEWAY = {
  BASE_PATH:         "/api/v1",
  TIMEOUT_MS:        30_000,
  MAX_RETRIES:       3,
  RATE_LIMIT_HEADER: "X-RateLimit-Remaining",
  REQUEST_ID_HEADER: "X-Request-Id",
  VERSION_HEADER:    "X-Client-Version",

  // Route prefixes
  ROUTES: {
    AUTH:         "/auth",
    USERS:        "/users",
    WORKSPACES:   "/workspaces",
    ALERTS:       "/alerts",
    SAR:          "/sar",
    KYC:          "/kyc",
    GRAPH:        "/graph",
    RULES:        "/rules",
    AI:           "/ai",
    RAG:          "/rag",
    MEMORY:       "/memory",
    USAGE:        "/usage",
    BILLING:      "/billing",
    WEBHOOKS:     "/webhooks",
    AUDIT:        "/audit",
    REPORTS:      "/reports",
    HEALTH:       "/health",
  },
} as const;

/* ── Database ───────────────────────────────────────────────────────── */

export const DATABASE = {
  // Aurora PostgreSQL — multi-AZ, auto-scaling
  POSTGRES: {
    ENGINE:         "aurora-postgresql",
    VERSION:        "16.2",
    INSTANCE_CLASS: "db.r7g.2xlarge",            // primary
    READ_REPLICAS:  2,                            // one per AZ
    MAX_CONNECTIONS: 1_000,
    POOL_MIN:        5,
    POOL_MAX:        100,
    STATEMENT_TIMEOUT_MS: 30_000,
    IDLE_TIMEOUT_MS:      600_000,
    SSL_MODE:        "verify-full",
    TIMEZONE:        "UTC",
    SCHEMAS: {
      PUBLIC:  "public",
      AUDIT:   "audit",          // immutable append-only
      ARCHIVE: "archive",        // cold storage
    },
  },

  // ElastiCache Redis — clustered, encryption in transit + at rest
  REDIS: {
    ENGINE:         "redis",
    VERSION:        "7.2",
    NODE_TYPE:      "cache.r7g.large",
    CLUSTER_MODE:   true,
    NUM_SHARDS:     3,
    REPLICAS_PER_SHARD: 1,
    TTL_DEFAULTS: {
      SESSION:      86_400,       // 24h
      ACCESS_TOKEN: 900,          // 15min
      RATE_LIMIT:   60,           // 1min window
      FEATURE_FLAG: 300,          // 5min
      MODEL_CONFIG: 60,           // 1min
    },
    PREFIXES: {
      SESSION:      "sess:",
      RATE_LIMIT:   "rl:",
      DEDUP:        "dedup:",
      LOCK:         "lock:",
      CACHE:        "cache:",
    },
  },

  // Vector Store — Pinecone serverless (per-workspace namespace)
  VECTOR_STORE: {
    PROVIDER:       "pinecone",
    ENVIRONMENT:    "aws-ca-central-1",
    INDEX_NAME:     "nexusai-prod",
    DIMENSIONS:     {
      "text-embedding-3-large":  3_072,
      "text-embedding-3-small":  1_536,
      "cohere-embed-v4":         1_024,
    },
    METRIC:         "cosine",
    REPLICAS:       2,
    PODS:           "p2.x1",
  },
} as const;

/* ── Object Storage ─────────────────────────────────────────────────── */

export const STORAGE = {
  // S3 — versioned, lifecycle policies, server-side encryption
  S3: {
    REGION:           REGIONS.PRIMARY,
    BUCKETS: {
      DOCUMENTS:      `nexusai-documents-${ACTIVE_REGION}`,   // RAG uploads
      REPORTS:        `nexusai-reports-${ACTIVE_REGION}`,     // generated PDFs
      AUDIT_EXPORTS:  `nexusai-audit-${ACTIVE_REGION}`,       // WORM audit logs
      MODELS:         `nexusai-models-${ACTIVE_REGION}`,      // fine-tune artifacts
      BACKUPS:        `nexusai-backups-${ACTIVE_REGION}`,     // DB snapshots
    },
    ENCRYPTION:       "aws:kms",
    VERSIONING:       true,
    MFA_DELETE:       true,                                    // audit bucket
    LIFECYCLE: {
      DOCUMENTS_DAYS:    365,
      REPORTS_DAYS:      2_555,   // 7 years
      AUDIT_DAYS:        3_650,   // 10 years (WORM)
    },
    PRESIGNED_URL_TTL: 900,       // 15 min for uploads
    DOWNLOAD_URL_TTL:  3_600,     // 1h for report downloads
  },
} as const;

/* ── Message Queues ─────────────────────────────────────────────────── */

export const QUEUES = {
  // AWS SQS — FIFO queues with DLQ
  INGESTION:    "nexusai-ingestion.fifo",       // document processing
  INFERENCE:    "nexusai-inference.fifo",       // async AI jobs
  NOTIFICATIONS:"nexusai-notifications",         // email/webhook delivery
  AUDIT:        "nexusai-audit.fifo",           // immutable audit events
  WEBHOOKS:     "nexusai-webhooks",             // outbound webhook delivery
  DLQ_SUFFIX:   "-dlq",

  VISIBILITY_TIMEOUT_S: 300,        // 5min — max processing time
  MAX_RECEIVE_COUNT:    5,          // before DLQ
  MESSAGE_RETENTION_S:  86_400,     // 24h
  FIFO_THROUGHPUT:      "high",     // 3_000 msg/s
} as const;

/* ── Compute / EKS ──────────────────────────────────────────────────── */

export const COMPUTE = {
  EKS: {
    VERSION: "1.30",
    NODE_GROUPS: {
      API:         { instance: "m7i.2xlarge",  min: 3,  max: 20,  desired: 5  },
      INFERENCE:   { instance: "g5.2xlarge",   min: 2,  max: 10,  desired: 2  },  // GPU for local models
      WORKERS:     { instance: "m7i.xlarge",   min: 2,  max: 30,  desired: 4  },
      EMBEDDINGS:  { instance: "c7i.4xlarge",  min: 2,  max: 8,   desired: 2  },
    },
    HPA: {
      CPU_TARGET:    70,
      MEMORY_TARGET: 80,
      SCALE_UP_STABILIZATION_S:   60,
      SCALE_DOWN_STABILIZATION_S: 300,
    },
  },
  LAMBDA: {
    RUNTIME:     "nodejs20.x",
    MEMORY_MB:   1_024,
    TIMEOUT_S:   300,
    USES: ["auth-webhook", "stripe-webhook", "fintrac-submit", "scheduled-reports"],
  },
} as const;

/* ── CDN / CloudFront ───────────────────────────────────────────────── */

export const CDN = {
  PROVIDER:          "cloudfront",
  PRICE_CLASS:       "PriceClass_100",   // NA + EU
  COMPRESS:          true,
  CACHE_TTL_S:       86_400,             // 24h for static assets
  API_CACHE_TTL_S:   0,                  // no CDN cache for API
  WAF_ENABLED:       true,
  SHIELD_ENABLED:    true,               // DDoS protection
  GEO_RESTRICTION:   ["CA", "US", "GB", "IE", "DE", "FR", "AU", "SG"],
} as const;

/* ── Observability ──────────────────────────────────────────────────── */

export const OBSERVABILITY = {
  TRACING: {
    PROVIDER:       "aws-xray",
    SAMPLING_RATE:  0.05,              // 5% — adjust per environment
    ALWAYS_SAMPLE:  ["error", "slow"], // conditions for 100% sampling
  },
  METRICS: {
    PROVIDER:       "cloudwatch",
    CUSTOM_NAMESPACE: "NexusAI/Production",
    FLUSH_INTERVAL_S: 60,
    KEY_METRICS: [
      "api.request.duration",         "api.request.count",
      "api.error.rate",               "ai.inference.latency",
      "ai.tokens.used",               "db.query.duration",
      "ws.connections.active",        "queue.depth",
      "rag.retrieval.latency",        "auth.login.count",
    ],
  },
  LOGGING: {
    PROVIDER:       "cloudwatch",
    RETENTION_DAYS: 90,
    STRUCTURED:     true,
    LOG_LEVEL:      import.meta.env.VITE_LOG_LEVEL ?? "info",
    REDACT_FIELDS:  ["password", "token", "secret", "key", "authorization", "ssn", "sin"],
  },
  ALERTS: {
    SNS_TOPIC:      "nexusai-ops-alerts",
    PAGERDUTY_KEY:  import.meta.env.VITE_PAGERDUTY_KEY ?? "",
    CHANNELS: {
      P0_CRITICAL:  ["pagerduty", "slack:nexusai-oncall"],
      P1_HIGH:      ["pagerduty", "email:ops@nexusai.ca"],
      P2_MEDIUM:    ["email:ops@nexusai.ca"],
      P3_LOW:       ["slack:nexusai-alerts"],
    },
  },
} as const;

/* ── Security ───────────────────────────────────────────────────────── */

export const SECURITY = {
  ENCRYPTION: {
    AT_REST:          "AES-256-GCM",
    IN_TRANSIT:       "TLS 1.3",
    KMS_KEY_ROTATION: 365,            // days
    FIELD_ENCRYPTION: ["sin", "ssn", "passport", "phone", "email"], // PII fields
  },
  JWT: {
    ALGORITHM:           "RS256",     // asymmetric — public key verification
    ACCESS_TTL_S:        900,         // 15 min
    REFRESH_TTL_S:       86_400,      // 24h (30d if remember=true)
    ISSUER:              "https://auth.nexusai.ca",
    AUDIENCE:            ["api.nexusai.ca", "ws.nexusai.ca"],
    JWKS_URL:            "https://auth.nexusai.ca/.well-known/jwks.json",
    ROTATION_INTERVAL_S: 86_400,      // rotate signing keys daily
  },
  CORS: {
    ALLOWED_ORIGINS: [
      "https://app.nexusai.ca",
      "https://api.nexusai.ca",
      ...(import.meta.env.DEV ? ["http://localhost:5000", "http://localhost:3000"] : []),
    ],
    ALLOWED_METHODS: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    MAX_AGE_S:       3_600,
  },
  HEADERS: {
    CSP:             "default-src 'self'; connect-src 'self' wss://api.nexusai.ca; img-src 'self' data: cdn.nexusai.ca;",
    HSTS:            "max-age=31536000; includeSubDomains; preload",
    X_FRAME:         "DENY",
    X_CONTENT_TYPE:  "nosniff",
    REFERRER:        "strict-origin-when-cross-origin",
  },
  WAF_RULES: [
    "AWSManagedRulesCommonRuleSet",
    "AWSManagedRulesKnownBadInputsRuleSet",
    "AWSManagedRulesSQLiRuleSet",
    "NexusAI-RateLimiting",
    "NexusAI-GeoBlocking",
  ],
} as const;
