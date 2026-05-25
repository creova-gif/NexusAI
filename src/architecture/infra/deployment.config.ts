/**
 * NexusAI — Deployment & CI/CD Configuration Reference
 * Documents the full deployment pipeline from commit to production.
 * Managed by GitHub Actions + ArgoCD (GitOps).
 */

/* ── Environments ───────────────────────────────────────────────────── */

export const ENVIRONMENTS = {
  development: {
    name:       "development",
    branch:     "main",
    auto:       true,                 // auto-deploy on push
    approval:   false,
    region:     "ca-central-1",
    replicas:   1,
    debugMode:  true,
  },
  staging: {
    name:       "staging",
    branch:     "release/*",
    auto:       true,
    approval:   false,
    region:     "ca-central-1",
    replicas:   2,
    smokeTests: true,
    loadTests:  true,
  },
  production: {
    name:         "production",
    branch:       "release/v*",
    auto:          false,
    approval:      ["engineering-lead", "security"],
    region:        "ca-central-1",
    drRegion:      "ca-west-1",
    replicas:      5,
    canaryPercent: 5,               // start 5% traffic, auto-promote
    rollbackOn:    { errorRate: 0.01, p99LatencyMs: 2000 },
  },
  governmentSovereign: {
    name:       "gov-sovereign",
    branch:     "release/gov-*",
    auto:       false,
    approval:   ["engineering-lead", "security", "compliance"],
    region:     "ca-central-1",     // GC Region — Government of Canada cloud
    isolated:   true,               // air-gap from main infra
    replicas:   3,
    auditLevel: "full",
  },
} as const;

/* ── CI/CD Pipeline ─────────────────────────────────────────────────── */

export const PIPELINE_STAGES = [
  {
    name:    "lint-and-typecheck",
    tools:   ["eslint", "tsc --noEmit"],
    timeout: "5m",
    parallel: true,
  },
  {
    name:    "unit-tests",
    tools:   ["vitest run --coverage"],
    threshold: { coverage: 80, branchCoverage: 75 },
    timeout: "10m",
  },
  {
    name:    "integration-tests",
    tools:   ["vitest run --config vitest.integration.ts"],
    timeout: "15m",
  },
  {
    name:    "security-scan",
    tools:   ["trivy fs .", "semgrep --config=auto", "npm audit --production"],
    failOn:  "HIGH",
    timeout: "10m",
    parallel: true,
  },
  {
    name:    "container-build",
    tools:   ["docker buildx build --platform linux/amd64,linux/arm64"],
    push:    true,
    registry: "ghcr.io/nexusai-ca",
    timeout: "15m",
  },
  {
    name:    "deploy-staging",
    tool:    "argocd app sync nexusai-staging",
    timeout: "10m",
    waitFor: "healthy",
  },
  {
    name:    "smoke-tests",
    tools:   ["k6 run smoke.js"],
    timeout: "5m",
  },
  {
    name:    "load-tests",
    tools:   ["k6 run load.js --vus 100 --duration 5m"],
    timeout: "10m",
    environments: ["staging"],
  },
  {
    name:    "deploy-production",
    tool:    "argocd app sync nexusai-prod --strategy canary",
    timeout: "30m",
    approval: true,
    waitFor: "healthy",
  },
] as const;

/* ── Kubernetes Manifests Reference ──────────────────────────────────── */

export const K8S_CONFIG = {
  API_DEPLOYMENT: {
    image:           "ghcr.io/nexusai-ca/api:${GIT_SHA}",
    replicas:        5,
    resources: {
      requests: { cpu: "500m",   memory: "1Gi"  },
      limits:   { cpu: "2000m",  memory: "4Gi"  },
    },
    readinessProbe: { httpGet: "/health/ready",  initialDelaySeconds: 10, periodSeconds: 5  },
    livenessProbe:  { httpGet: "/health/live",   initialDelaySeconds: 30, periodSeconds: 10 },
    env: [
      "DATABASE_URL",        "REDIS_URL",
      "PINECONE_API_KEY",    "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",   "AWS_KMS_KEY_ID",
      "JWT_PRIVATE_KEY",     "STRIPE_SECRET_KEY",
    ],
    podDisruptionBudget: { minAvailable: "60%" },
  },

  INGRESS: {
    class:            "nginx",
    annotations: {
      "nginx.ingress.kubernetes.io/ssl-redirect":        "true",
      "nginx.ingress.kubernetes.io/use-regex":           "true",
      "nginx.ingress.kubernetes.io/limit-rps":           "100",
      "cert-manager.io/cluster-issuer":                  "letsencrypt-prod",
    },
    tls:              true,
    host:             "api.nexusai.ca",
  },
} as const;

/* ── Disaster Recovery ───────────────────────────────────────────────── */

export const DISASTER_RECOVERY = {
  strategy:        "active-passive",
  primaryRegion:   "ca-central-1",
  drRegion:        "ca-west-1",
  rpo:             "1 hour",          // Recovery Point Objective
  rto:             "30 minutes",      // Recovery Time Objective
  databaseSync:    "aurora-global-db",
  s3Replication:   "cross-region-replication",
  failoverTrigger: "manual",          // automated available if approved
  runbookUrl:      "https://docs.nexusai.ca/runbooks/dr",
  drDrills:        "quarterly",
} as const;

/* ── Feature Flags / Release Toggles ────────────────────────────────── */

export const FEATURE_FLAGS_SYSTEM = {
  provider:        "launchdarkly",    // or Unleash for self-hosted
  sdkKey:          "LAUNCHDARKLY_SDK_KEY",
  targetingRules: [
    "workspace_id",
    "plan_tier",
    "user_role",
    "region",
    "percentage_rollout",
  ],
  evaluationMode:  "client-side",    // JWT claims cached in token
  fallback:        "disabled",       // safe default
} as const;
