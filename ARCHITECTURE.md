# NexusAI — System Architecture

**Intelligent Banking, Trusted Future.**
Version: 3.0 | Region: `ca-central-1` (primary) | Compliance: OSFI, FINTRAC, PCMLTFA, PIPEDA

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Authentication & Identity](#2-authentication--identity)
3. [Multi-Tenancy & Workspace Isolation](#3-multi-tenancy--workspace-isolation)
4. [Subscription, Permissions & RBAC](#4-subscription-permissions--rbac)
5. [API Gateway & Communication Layer](#5-api-gateway--communication-layer)
6. [Database Architecture](#6-database-architecture)
7. [AI Model Orchestration](#7-ai-model-orchestration)
8. [RAG Pipeline & Vector Store](#8-rag-pipeline--vector-store)
9. [Real-Time Pipeline](#9-real-time-pipeline)
10. [Usage Tracking & Billing](#10-usage-tracking--billing)
11. [Cloud Infrastructure](#11-cloud-infrastructure)
12. [Security Architecture](#12-security-architecture)
13. [Observability & Reliability](#13-observability--reliability)
14. [Deployment & CI/CD](#14-deployment--cicd)
15. [Compliance & Data Governance](#15-compliance--data-governance)
16. [Architecture Decision Records](#16-architecture-decision-records)

---

## 1. System Overview

NexusAI is a multi-tenant SaaS AML compliance platform purpose-built for Canadian financial institutions. Every feature — from alert triage to SAR generation — flows through a unified architecture that ties identity, permissions, AI inference, and regulatory audit together at the infrastructure level.

### High-Level Data Flow

```
Browser / Mobile
      │
      ▼
CloudFront CDN ──► WAF (OWASP rules + rate limiting)
      │
      ▼
API Gateway (Nginx Ingress + Kong)
      │  JWT validation · workspace injection · rate limit
      ▼
┌─────────────────────────────────────────────────┐
│              NexusAI API (EKS)                  │
│  Auth Service · Workspace Service · AML Engine  │
│  SAR Service · KYC Service · Rules Engine       │
│  AI Orchestrator · RAG Pipeline · Usage Meter   │
└──────┬──────────────┬───────────────┬───────────┘
       │              │               │
       ▼              ▼               ▼
  Aurora PG      ElastiCache     Pinecone
  (RLS+tenant)    Redis          Vector DB
                               (workspace NS)
       │              │               │
       ▼              ▼               ▼
  Audit Schema    Sessions        Embeddings
  (WORM)         Rate limits      RAG context
```

### Core Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Workspace isolation first** | Every DB row, vector namespace, S3 prefix, and Redis key is workspace-scoped |
| **Zero-trust** | Token validated on every request; permissions re-checked server-side for writes |
| **Canada-first data residency** | All data in `ca-central-1` by default; configurable per workspace |
| **AI as a first-class citizen** | Model routing, RAG, streaming, and usage metering built into the core, not bolted on |
| **Immutable audit trail** | Every state change is appended to a tamper-evident, append-only audit log |
| **Fail secure** | Circuit breakers, fallback chains, and soft-limit warnings prevent silent failures |

---

## 2. Authentication & Identity

### Authentication Flow

```
User enters credentials
        │
        ▼
POST /api/v1/auth/sign-in
        │
        ├── Hash + compare password (bcrypt, cost=12)
        │
        ├── [If SSO] SAML assertion / OIDC token exchange
        │
        ├── [If MFA required] Issue MFA challenge
        │       └── User submits TOTP / SMS OTP
        │
        ├── Create session record (PostgreSQL + Redis)
        │
        ├── Issue Access Token (JWT RS256, 15 min TTL)
        │       └── Payload: sub, sid, wid, roles, perms[], tier
        │
        └── Issue Refresh Token (opaque, HttpOnly cookie, 24h / 30d)
                └── Stored hashed (SHA-256) in refresh_tokens table
```

### Token Architecture

| Token | Algorithm | TTL | Storage | Purpose |
|-------|-----------|-----|---------|---------|
| Access Token | RS256 JWT | 15 min | Memory only | API authorization |
| Refresh Token | Opaque 256-bit | 24h (30d w/ remember) | HttpOnly cookie | Silent token renewal |
| API Key | Prefix + SHA-256 hash | Custom / no expiry | Database (hashed) | Service-to-service / integrations |
| MFA Challenge | TOTP / OTP | 10 min | Redis | Step-up authentication |

### Access Token Payload

```json
{
  "sub": "user-uuid",
  "sid": "session-id",
  "wid": "workspace-uuid",
  "roles": ["compliance_officer"],
  "perms": ["alerts.view", "alerts.triage", "sar.view", "sar.draft", "ai.chat"],
  "tier": "professional",
  "iat": 1748000000,
  "exp": 1748000900,
  "jti": "unique-token-id",
  "iss": "nexusai.ca",
  "aud": ["api.nexusai.ca", "ws.nexusai.ca"]
}
```

### Refresh Token Rotation (RTR)

- Every `/token/refresh` call **issues a new refresh token** and **invalidates the old one**
- Tokens are grouped into **families** by a shared UUID
- If a **used token is presented again**, the entire family is immediately revoked — detects token theft
- Absolute expiry (30 days) is never extended — forces re-login

### SSO (Enterprise / Government)

```
User clicks "Sign in with [Bank SSO]"
        │
        ▼
NexusAI redirects to IdP (SAML: ACS URL / OIDC: discovery endpoint)
        │
        ▼
IdP authenticates, returns SAML assertion / OIDC tokens
        │
        ▼
POST /api/v1/auth/sso/callback
  - Validate SAML signature / OIDC JWT
  - Map IdP attributes → NexusAI user (via attributeMapping config)
  - Enforce allowedDomains check
  - Issue NexusAI access + refresh tokens
```

### MFA Enforcement

- Configurable per workspace: `mfaRequiredFor: ["owner", "admin", "compliance_officer"]`
- Supported methods: TOTP (Authenticator app), SMS OTP, Email OTP, Hardware key (WebAuthn)
- Sudo mode: sensitive operations (key rotation, SSO config) trigger re-authentication even within active session

---

## 3. Multi-Tenancy & Workspace Isolation

Every resource in NexusAI belongs to exactly one **workspace** (tenant). Isolation is enforced at four independent layers:

### Layer 1 — Database: Row-Level Security

```sql
-- Set on every request by the API server
SET LOCAL app.current_workspace_id = 'workspace-uuid';
SET LOCAL app.current_user_id = 'user-uuid';

-- Applied to every table:
CREATE POLICY workspace_isolation ON alerts
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid);
```

No query can return rows from another workspace, even if the application layer has a bug.

### Layer 2 — Vector Store: Namespaced Indexes

Every workspace gets an isolated Pinecone namespace: `ws-{workspaceId}`. Queries are always scoped to the namespace — cross-workspace retrieval is architecturally impossible.

### Layer 3 — Object Storage: S3 Prefixes + Bucket Policies

```
nexusai-documents-ca-central-1/
  workspaces/{workspaceId}/documents/{documentId}
  workspaces/{workspaceId}/reports/{reportId}
```

IAM policies restrict the API's role to `s3:GetObject` only within the authenticated workspace prefix.

### Layer 4 — Encryption: Per-Tenant KMS Keys

Each workspace has a dedicated AWS KMS Customer Managed Key (CMK):
- `alias/nexusai-ws-{workspaceId}`
- Used to encrypt: database field-level PII, S3 objects, Redis session data
- Enterprise / Government tier supports **BYOK** (Bring Your Own Key): customer provides their own KMS key ARN

### Data Residency

| Region | Code | Used For |
|--------|------|---------|
| Canada Central | `ca-central-1` | Default for all Canadian FIs (OSFI/FINTRAC) |
| Canada West | `ca-west-1` | BC-specific entities; DR |
| US East | `us-east-1` | Cross-border banking, US MSBs |
| EU West | `eu-west-1` | EU clients (GDPR) |

Workspace `dataResidency` field is immutable after provisioning.

---

## 4. Subscription, Permissions & RBAC

### Subscription Tiers

| Tier | Price (CAD/mo) | API Reqs | AI Tokens | Key Features |
|------|---------------|----------|-----------|-------------|
| Starter | $2,999 | 50k | 2M | Core AML, SAR, Sanctions |
| Professional | $9,999 | 500k | 20M | + AI Agent, RAG, Perpetual KYC, SIEM |
| Enterprise | $49,999+ | Unlimited | Unlimited | + Fine-tuning, BYOK, Dedicated infra, White-label |
| Government | Custom | Unlimited | Unlimited | + Sovereign model, 10yr retention, 99.999% SLA |

### RBAC Model

```
Owner
 └── Admin
      └── Compliance Officer
           └── Analyst
                └── Auditor
                     └── Viewer
```

Roles inherit downward. Each role maps to an explicit `PermissionCode[]` list stored in the JWT `perms` claim.

**Permission categories:** `alerts.*`, `sar.*`, `kyc.*`, `graph.*`, `rules.*`, `ai.*`, `audit.*`, `reports.*`, `settings.*`, `members.*`, `admin.*`

### Permission Evaluation

1. **Client-side** (instant, from JWT `perms` claim) — used for UI rendering
2. **Server-side** (authoritative, per request) — used for all write operations and sensitive reads
3. **Resource-level ACL** — individual resources can have additional per-user/role entries

### Feature Flag System

Feature flags gate capabilities at three levels:
1. **Subscription tier** — `allowedTiers: ["professional", "enterprise"]`
2. **Workspace allowlist** — explicit workspace IDs for beta access
3. **Percentage rollout** — deterministic hash of `userId:flagId` for gradual rollout

---

## 5. API Gateway & Communication Layer

### Request Lifecycle

```
Incoming Request
      │
      ├─► CloudFront (CDN + WAF)
      │
      ├─► Kong API Gateway
      │     - JWT validation (RS256, JWKS endpoint)
      │     - Rate limiting (workspace + user + IP)
      │     - Request logging (structured)
      │     - Idempotency key dedup (Redis)
      │
      ├─► Route to service (Kubernetes service mesh)
      │
      ├─► Service: SET LOCAL RLS vars
      │
      └─► Response (with X-Request-Id, X-RateLimit-* headers)
```

### Rate Limiting Architecture

Rate limits are enforced at three independent levels:

| Level | Implementation | Granularity |
|-------|---------------|-------------|
| Platform-wide | Kong + Redis | Per IP |
| Workspace | Kong + Redis | Per workspace-id in JWT |
| Per-user | Redis sliding window | Per user + endpoint |
| AI tokens | Custom middleware | Per workspace per minute |

### Client-Side Resilience (ApiGateway service)

| Pattern | Implementation |
|---------|---------------|
| Retry with exponential backoff | 3 retries, max 30s delay, jitter |
| Circuit breaker | 5-failure threshold, 30s reset, half-open probe |
| Request deduplication | In-flight Map keyed by path + params |
| Response caching | TTL-based Map, invalidated on mutation |
| Timeout | 30s default, configurable per call |
| Streaming (SSE) | ReadableStream parser, auto-reconnect |

---

## 6. Database Architecture

### PostgreSQL (Aurora) Schema Overview

```
public schema (application data — RLS enforced)
├── users
├── password_credentials
├── sso_credentials
├── sessions
├── refresh_tokens
├── mfa_devices
├── api_keys
├── workspaces
├── workspace_members
├── workspace_invites
├── subscriptions
├── usage_records          ← partitioned by month
├── alerts                 ← partitioned by created_at
├── sars
├── kyc_records
├── rules
├── conversation_threads
└── user_memory

audit schema (immutable — append-only)
├── events                 ← partitioned by month, WORM
└── integrity_chain        ← HMAC chain for tamper detection

archive schema (cold data)
└── alerts_archive         ← moved after retention period
```

### Key Design Decisions

**Partitioning:** `usage_records` and `audit.events` are range-partitioned by `timestamp` (monthly). `pg_partman` manages automatic partition creation and archiving.

**RLS:** All application tables have `ENABLE ROW LEVEL SECURITY`. The database role used by the application has no `BYPASSRLS` privilege. The `audit` schema role has `INSERT` only.

**Connection pooling:** PgBouncer in transaction mode (not session) — supports 1,000 concurrent connections from a pool of 100 actual PG connections.

**Indexes:** All queries filter by `workspace_id` first. Composite indexes: `(workspace_id, status)`, `(workspace_id, created_at DESC)`, `(workspace_id, risk_score DESC)`.

---

## 7. AI Model Orchestration

### Model Registry

| Model | Provider | Tier | Context | Use Cases |
|-------|----------|------|---------|-----------|
| GPT-4o | OpenAI | Premium | 128k | Alert analysis, risk explanation |
| GPT-4o Mini | OpenAI | Standard | 128k | Entity extraction, summaries |
| Claude 3.7 Sonnet | Anthropic | Premium | 200k | SAR drafting, regulatory Q&A |
| Claude 3.5 Haiku | Anthropic | Standard | 200k | Fast chat, simple classification |
| text-embedding-3-large | OpenAI | Standard | 8k | RAG embeddings (3072-dim) |

### Model Routing Decision Tree

```
Incoming InferenceRequest
        │
        ├─► User specified model? → Use it (if allowed by plan)
        │
        ├─► Evaluate routing rules (priority-ordered)
        │     - Task match?
        │     - Role match?
        │     - Feature flag?
        │     - Always rule (catch-all)?
        │
        ├─► Default: task × tier lookup
        │     e.g., sar_generation × professional → GPT-4o
        │
        └─► Execute with fallback chain
              Primary fails? → try fallback[0] → fallback[1] → error
```

### Streaming Architecture

```
Client calls POST /api/v1/ai/stream
        │
        ├─► API creates inference job, returns job-id
        │
        └─► Client opens SSE: GET /api/v1/ai/stream/{job-id}/events
                │
                ├─► Backend calls provider streaming API
                │
                ├─► Chunks forwarded as SSE: data: {"delta": "..."}\n\n
                │
                └─► Final: data: {"done": true, "usage": {...}}\n\n
```

### Fine-Tuning Pipeline

1. Compliance team uploads labelled training data (JSONL) → S3
2. Fine-tune job queued → SQS → Worker picks up → calls provider fine-tuning API
3. Resulting model ID stored in workspace's `custom_model_ids`
4. Routed via ModelOrchestrator when `planFeatures.fineTunedModels = true`

---

## 8. RAG Pipeline & Vector Store

### Document Ingestion Pipeline

```
User uploads document (PDF, DOCX, CSV, etc.)
        │
        ▼
POST /rag/{workspaceId}/upload-url
  ← Returns: presigned S3 PUT URL (15 min TTL)
        │
        ▼
Browser → PUT directly to S3 (never through API)
        │
        ▼
POST /rag/{workspaceId}/ingest
  ← Job created, returns jobId
        │
        ▼
SQS ingestion queue
        │
        ▼
Worker pulls job:
  1. parse   – extract text (Unstructured.io / PDFMiner)
  2. chunk   – split to ~512-token chunks with 50-token overlap
  3. embed   – batch embed via text-embedding-3-large
  4. index   – upsert to Pinecone (workspace namespace)
  5. verify  – confirm vector count
        │
        ▼
SSE stream notifies client of stage progress
```

### Retrieval & Augmentation

```
User query (e.g., "What are FINTRAC STR thresholds?")
        │
        ▼
Embed query → float32[3072]
        │
        ▼
Pinecone query (namespace=workspaceId, topK=6, minSimilarity=0.72)
  + Optional: hybrid search (cosine + BM25 keyword)
  + Optional: reranking (Cohere Rerank v3)
        │
        ▼
Top-K chunks assembled into context block
        │
        ▼
Injected into system prompt:
  "### Relevant Context\n[chunk1]\n---\n[chunk2]\n..."
        │
        ▼
LLM inference → response with [1][2][3] citations
```

### Memory Architecture

| Scope | TTL | Storage | Use |
|-------|-----|---------|-----|
| Session | Session end | Redis | In-progress investigation context |
| Workspace | 90 days | PostgreSQL + Pinecone | Institutional knowledge, preferences |
| Global | Permanent | PostgreSQL + Pinecone | Regulatory facts, model instructions |

---

## 9. Real-Time Pipeline

### WebSocket Architecture

```
Client WebSocket connects to:
  wss://api.nexusai.ca/ws/v1?workspace={id}&token={jwt}
        │
        ├─► JWT validated on connect (401 closes)
        │
        ├─► Workspace join → subscribe to Redis pub/sub channel
        │     Channel: nexusai:ws:{workspaceId}
        │
        └─► Messages forwarded to client as they arrive
```

### Event Types & Sources

| Event | Source | Consumers |
|-------|--------|-----------|
| `alert.created` | Transaction monitoring engine | Alert queue UI |
| `alert.updated` | AML analyst action | Alert detail |
| `sar.status_changed` | Compliance workflow | SAR dashboard |
| `kyc.completed` | KYC worker | KYC review queue |
| `model.stream_chunk` | AI inference worker | Chat UI |
| `rule.triggered` | Rules engine | Rules audit log |
| `workspace.settings_changed` | Admin action | All clients (reload settings) |

### Reconnection Strategy

Client implements exponential backoff with jitter:
- Attempt 1: 1s, Attempt 2: 2s, Attempt 3: 4s, ... max 30s
- Sequence numbers detect message gaps → requests replay
- Max 10 reconnect attempts before showing "connection lost" UI

---

## 10. Usage Tracking & Billing

### Metering Architecture

```
Action occurs (API call, AI inference, SAR generated)
        │
        ▼
UsageTracker.record(workspaceId, metric, value)
        │
        ▼
Client buffer (max 500 records)
        │
        ├─► Every 10 seconds: flush to POST /api/v1/usage/batch
        │
        └─► On page unload: navigator.sendBeacon (guaranteed delivery)
```

### Rate Limit Enforcement (Two Layers)

**Layer 1 — Client-side shadow (immediate feedback):**
- Mirrors server windows in memory
- Prevents request from being sent if limit is hit
- Shows UI warning with retry countdown

**Layer 2 — Server-side enforcement (authoritative):**
- Redis sliding window counters
- Returns `429 Too Many Requests` with `Retry-After` header
- Workspace and user-level counters

### Soft Limit Warnings

At **85% usage**: yellow banner warning in UI
At **95% usage**: red banner with upgrade CTA
At **100%**: requests blocked, hard-limit error returned

### Billing Integration (Stripe)

```
End of billing period (or usage trigger)
        │
        ▼
Usage summarized from usage_records table
        │
        ▼
Stripe Usage Record API → Line items on invoice
        │
        ▼
Invoice finalized → email to billing contact
        │
        └─► On payment: subscription.status = "active" (webhook)
            On failure:  subscription.status = "past_due"
                         → grace period 7 days → suspend
```

---

## 11. Cloud Infrastructure

### Multi-Region Topology

```
Primary: ca-central-1 (Montreal)
├── EKS cluster (API, workers, embeddings, GPU inference)
├── Aurora PostgreSQL (multi-AZ)
├── ElastiCache Redis (cluster mode, 3 shards)
├── S3 buckets (versioned, KMS encrypted)
├── SQS FIFO queues
└── CloudFront distribution

DR: ca-west-1 (Calgary)
├── Aurora Global Database (replica, < 1s replication lag)
├── S3 cross-region replication
└── EKS cluster (warm standby, scales up on failover)
```

### Kubernetes Workload Tiers

| Node Group | Instance | Purpose | Auto-scale |
|------------|----------|---------|------------|
| API | m7i.2xlarge | HTTP request handling | 3–20 nodes |
| Workers | m7i.xlarge | Queue processing, ingestion | 2–30 nodes |
| Embeddings | c7i.4xlarge | High-throughput embedding | 2–8 nodes |
| Inference | g5.2xlarge | Local model serving (future) | 2–10 nodes |

### Scaling Triggers

- **HPA** on CPU (70%) and memory (80%)
- **KEDA** on SQS queue depth (scale-to-zero workers when idle)
- **Cluster Autoscaler** for node-level scaling

---

## 12. Security Architecture

### Encryption

| Layer | Standard | Key Management |
|-------|----------|---------------|
| Data at rest (DB) | AES-256-GCM | AWS KMS, per-workspace CMK |
| Data at rest (S3) | AES-256-GCM | AWS KMS, per-bucket key |
| Data in transit | TLS 1.3 only | ACM certificates, HSTS |
| Field-level PII | AES-256-GCM | KMS data keys (envelope encryption) |
| Token signing | RS256 (2048-bit) | KMS, rotated daily |
| Webhook signatures | HMAC-SHA256 | Per-workspace signing key |

### Secret Management

All secrets (DB passwords, API keys, KMS ARNs) managed via:
1. **AWS Secrets Manager** (rotation enabled)
2. **External Secrets Operator** (syncs to Kubernetes Secrets)
3. **Never in environment variables or code**

### WAF Rules

```
AWSManagedRulesCommonRuleSet     ← OWASP Top 10
AWSManagedRulesSQLiRuleSet       ← SQL injection
AWSManagedRulesKnownBadInputsRuleSet
NexusAI-RateLimiting             ← Custom: 1000 req/min per IP
NexusAI-GeoBlocking              ← Allowed: CA, US, GB, IE, DE, FR, AU, SG
NexusAI-FinancialDataProtection  ← Block suspicious patterns in query params
```

### Security Headers (all responses)

```
Content-Security-Policy: default-src 'self'; connect-src 'self' wss://api.nexusai.ca
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 13. Observability & Reliability

### Observability Stack

| Signal | Tool | Retention |
|--------|------|-----------|
| Logs | CloudWatch Logs (structured JSON) | 90 days |
| Metrics | CloudWatch Metrics | 15 months |
| Traces | AWS X-Ray (5% sampling, 100% for errors) | 30 days |
| Uptime | Route53 Health Checks + Pingdom | External |
| APM | CloudWatch Application Signals | 30 days |
| Errors | Sentry (frontend + backend) | 90 days |

### Alerting Runbook

| Severity | Trigger | Response |
|----------|---------|---------|
| P0 Critical | Error rate > 1%, P99 > 5s, DB down | PagerDuty → on-call → 5min |
| P1 High | Error rate > 0.5%, queue depth > 10k | PagerDuty → on-call → 15min |
| P2 Medium | Error rate > 0.1%, memory > 85% | Email → ops team → 1h |
| P3 Low | Non-critical, informational | Slack #nexusai-alerts |

### SLOs

| SLO | Target | Measurement |
|-----|--------|-------------|
| API availability | 99.9% | 30-day rolling window |
| API P95 latency | < 500ms | Excluding AI inference |
| AI inference P95 | < 5s | Including streaming first-token |
| WebSocket uptime | 99.9% | Connection established rate |
| Ingestion pipeline | < 5min end-to-end | Document → queryable |

---

## 14. Deployment & CI/CD

### Pipeline (GitHub Actions + ArgoCD)

```
git push → GitHub Actions
        │
        ├─► lint + typecheck (5min)
        ├─► unit tests + coverage check (10min)   ← 80% threshold
        ├─► integration tests (15min)
        ├─► security scan: trivy + semgrep (10min)
        │
        ├─► Build + push Docker image (ghcr.io/nexusai-ca/api:{sha})
        │
        ├─► Auto-deploy → staging (ArgoCD sync)
        │       └─► Smoke tests + load tests
        │
        └─► Manual approval → production (ArgoCD canary)
                ├─► 5% traffic → monitor error rate + latency
                ├─► Auto-promote if healthy after 10min
                └─► Auto-rollback if error rate > 1% or P99 > 2s
```

### Environment Promotion

`feature/* → develop → staging (release/*) → production (release/v*)`

**Government sovereign** builds follow a separate pipeline with additional security review gate and air-gapped deployment to GC Region infrastructure.

### Zero-Downtime Deployment

- **Rolling updates** with `maxUnavailable: 0`, `maxSurge: 25%`
- **PodDisruptionBudget**: minimum 60% pods available during node drain
- **Readiness gates**: pods not added to load balancer until `/health/ready` returns 200
- **Database migrations**: backwards-compatible only; never drop columns in same release as code change

---

## 15. Compliance & Data Governance

### Canadian Regulatory Framework

| Regulation | Requirement | NexusAI Implementation |
|------------|-------------|----------------------|
| PCMLTFA | Transaction monitoring, SAR filing, record-keeping | AML engine, FINTRAC integration, 7yr retention |
| OSFI B-10 | Third-party risk, data governance, audit trails | Immutable audit log, WORM S3, contractual controls |
| PIPEDA / Law 25 | PII protection, consent, data residency | Field encryption, `ca-central-1` default, consent flags |
| FINTRAC guidelines | STR/STTR thresholds, EFT reporting | Rules engine pre-loaded with current thresholds |

### Data Retention Policy

| Data Type | Retention | Storage | After Retention |
|-----------|-----------|---------|----------------|
| Transaction records | 7 years | PostgreSQL → S3 Glacier | Secure deletion |
| SAR records | 7 years | PostgreSQL → S3 Glacier | Secure deletion |
| Audit logs | 10 years (government) / 7 years (enterprise) | S3 WORM | Retained permanently |
| Session data | 30 days | PostgreSQL + Redis | Auto-deleted |
| AI conversation threads | 90 days (configurable) | PostgreSQL | Soft-deleted |
| Documents (RAG) | Workspace-configured | S3 | Soft-deleted + vector purge |

### Audit Trail Integrity

```
Each audit event:
  integrity_hash = HMAC-SHA256(
    previous_hash + workspace_id + actor_id + action + resource_id + timestamp
  )
```

This creates a **hash chain** — any tampering with a historical record invalidates all subsequent hashes. The chain root is stored in AWS Certificate Manager Transparency log.

---

## 16. Architecture Decision Records

### ADR-001: JWT + Refresh Token Rotation (vs. session-only)
**Decision:** RS256 JWT access tokens (15min) + opaque refresh tokens (RTR)
**Rationale:** Stateless access tokens reduce DB load on every API call. RTR prevents token theft. HttpOnly cookies for refresh tokens prevent XSS theft. RS256 allows public key verification at API gateway without DB round-trip.

### ADR-002: PostgreSQL RLS over application-layer filtering
**Decision:** Row-Level Security enforced at the database layer
**Rationale:** Defense-in-depth — even if a bug in the application layer passes the wrong workspace_id, RLS blocks the query. Financial services require this level of isolation guarantee.

### ADR-003: Pinecone for vector storage (vs. pgvector)
**Decision:** Pinecone serverless for vector storage
**Rationale:** At scale (100M+ vectors across tenants), pgvector performance degrades and requires significant operational overhead. Pinecone's namespace model maps perfectly to our per-workspace isolation requirement. pgvector remains viable for starter tier if cost is a concern.

### ADR-004: Refresh token in HttpOnly cookie (vs. localStorage)
**Decision:** Refresh tokens sent as HttpOnly, Secure, SameSite=Strict cookies
**Rationale:** localStorage is accessible to JavaScript (XSS risk). HttpOnly cookies are invisible to JS. SameSite=Strict prevents CSRF. This is the industry standard for high-security financial applications.

### ADR-005: Multi-model fallback chains (vs. single provider)
**Decision:** Support OpenAI + Anthropic with automatic fallback
**Rationale:** Single-provider dependency is an unacceptable risk for financial services. Fallback chains ensure 99.9%+ AI availability. Cost optimization by routing cheaper tasks to more cost-effective models.

### ADR-006: Canada-first data residency (`ca-central-1`)
**Decision:** All data defaults to `ca-central-1` with explicit opt-out
**Rationale:** OSFI expects Canadian financial institutions' data to remain in Canada. FINTRAC reporting infrastructure is Canada-based. This is a compliance requirement, not a choice.

---

*This document is the authoritative architecture reference for the NexusAI platform. All implementation decisions should be consistent with the principles and patterns described here. Questions: architecture@nexusai.ca*
