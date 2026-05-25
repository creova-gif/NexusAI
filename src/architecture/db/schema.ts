/**
 * NexusAI — Database Schema Reference
 * PostgreSQL (Aurora) table definitions with column types, constraints,
 * indexes, and partitioning strategies. Managed by Drizzle ORM migrations.
 *
 * Schemas:
 *   public  — application data (RLS enforced)
 *   audit   — immutable append-only event log
 *   archive — cold data older than retention policy
 */

/* ── Schema Reference (documentation format) ─────────────────────────
 * Actual DDL is in /backend/drizzle/migrations/*.sql
 * This file is the authoritative design reference used by all teams.
 ─────────────────────────────────────────────────────────────────────── */

export const SCHEMA = {

  /* ── Identity ─────────────────────────────────────────────────── */

  users: {
    table:      "public.users",
    columns: {
      id:               "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      email:            "text NOT NULL UNIQUE",
      email_verified:   "boolean NOT NULL DEFAULT false",
      display_name:     "text NOT NULL",
      avatar_url:       "text",
      phone_number:     "text",                          // encrypted
      locale:           "text NOT NULL DEFAULT 'en-CA'",
      timezone:         "text NOT NULL DEFAULT 'America/Toronto'",
      created_at:       "timestamptz NOT NULL DEFAULT now()",
      updated_at:       "timestamptz NOT NULL DEFAULT now()",
      last_login_at:    "timestamptz",
      deleted_at:       "timestamptz",
    },
    indexes: [
      "CREATE UNIQUE INDEX users_email_idx ON users(lower(email))",
      "CREATE INDEX users_deleted_at_idx ON users(deleted_at) WHERE deleted_at IS NOT NULL",
    ],
  },

  password_credentials: {
    table:   "public.password_credentials",
    columns: {
      user_id:           "uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE",
      password_hash:     "text NOT NULL",                // bcrypt cost=12
      salt:              "text NOT NULL",
      changed_at:        "timestamptz NOT NULL DEFAULT now()",
      must_rotate:       "boolean NOT NULL DEFAULT false",
      previous_hashes:   "text[] NOT NULL DEFAULT '{}'",
    },
  },

  sso_credentials: {
    table:   "public.sso_credentials",
    columns: {
      id:            "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      user_id:       "uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE",
      provider:      "text NOT NULL",
      external_id:   "text NOT NULL",
      tenant_id:     "text",
      raw_profile:   "jsonb NOT NULL DEFAULT '{}'",
      linked_at:     "timestamptz NOT NULL DEFAULT now()",
    },
    indexes: [
      "CREATE UNIQUE INDEX sso_creds_provider_external_idx ON sso_credentials(provider, external_id)",
    ],
  },

  sessions: {
    table:   "public.sessions",
    columns: {
      id:               "text PRIMARY KEY",              // 256-bit opaque token
      user_id:          "uuid NOT NULL REFERENCES users(id)",
      workspace_id:     "uuid NOT NULL REFERENCES workspaces(id)",
      status:           "text NOT NULL DEFAULT 'active'",
      ip_address:       "inet NOT NULL",
      user_agent:       "text NOT NULL",
      device_id:        "text NOT NULL",
      country:          "char(2)",
      mfa_verified:     "boolean NOT NULL DEFAULT false",
      elevated_until:   "timestamptz",
      created_at:       "timestamptz NOT NULL DEFAULT now()",
      last_activity_at: "timestamptz NOT NULL DEFAULT now()",
      expires_at:       "timestamptz NOT NULL",
      revoked_at:       "timestamptz",
    },
    indexes: [
      "CREATE INDEX sessions_user_id_idx ON sessions(user_id)",
      "CREATE INDEX sessions_expires_at_idx ON sessions(expires_at)",
      "CREATE INDEX sessions_status_idx ON sessions(status) WHERE status = 'active'",
    ],
    notes: "Rows are deleted by a nightly job after 30d expiry. Active sessions cached in Redis.",
  },

  refresh_tokens: {
    table:   "public.refresh_tokens",
    columns: {
      id:              "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      user_id:         "uuid NOT NULL REFERENCES users(id)",
      session_id:      "text NOT NULL REFERENCES sessions(id)",
      token_hash:      "text NOT NULL UNIQUE",            // SHA-256
      family:          "uuid NOT NULL",                   // rotation family
      rotation_count:  "integer NOT NULL DEFAULT 0",
      absolute_exp:    "timestamptz NOT NULL",
      created_at:      "timestamptz NOT NULL DEFAULT now()",
      used_at:         "timestamptz",
      revoked_at:      "timestamptz",
    },
    indexes: [
      "CREATE INDEX refresh_tokens_family_idx ON refresh_tokens(family)",
    ],
    notes: "RTR (Refresh Token Rotation): on reuse of used token, entire family is revoked.",
  },

  mfa_devices: {
    table:   "public.mfa_devices",
    columns: {
      id:           "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      user_id:      "uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE",
      method:       "text NOT NULL",
      name:         "text NOT NULL",
      secret:       "text",                              // AES-256 encrypted TOTP secret
      phone_number: "text",                              // encrypted
      verified:     "boolean NOT NULL DEFAULT false",
      is_primary:   "boolean NOT NULL DEFAULT false",
      last_used_at: "timestamptz",
      created_at:   "timestamptz NOT NULL DEFAULT now()",
    },
  },

  api_keys: {
    table:   "public.api_keys",
    columns: {
      id:              "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      workspace_id:    "uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE",
      created_by_user: "uuid NOT NULL REFERENCES users(id)",
      name:            "text NOT NULL",
      key_prefix:      "char(8) NOT NULL",
      key_hash:        "text NOT NULL UNIQUE",            // SHA-256
      scopes:          "text[] NOT NULL",
      rate_limit:      "jsonb NOT NULL",
      allowed_ips:     "cidr[]",
      last_used_at:    "timestamptz",
      expires_at:      "timestamptz",
      revoked_at:      "timestamptz",
      created_at:      "timestamptz NOT NULL DEFAULT now()",
    },
  },

  /* ── Multi-Tenancy ────────────────────────────────────────────── */

  workspaces: {
    table:   "public.workspaces",
    columns: {
      id:                  "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      slug:                "text NOT NULL UNIQUE",
      display_name:        "text NOT NULL",
      legal_name:          "text NOT NULL",
      logo_url:            "text",
      plan:                "text NOT NULL DEFAULT 'starter'",
      status:              "text NOT NULL DEFAULT 'active'",
      jurisdiction:        "char(2) NOT NULL DEFAULT 'CA'",
      data_residency:      "text NOT NULL DEFAULT 'ca-central-1'",
      fintrac_entity_id:   "text",
      lei:                 "char(20)",
      primary_contact_id:  "uuid REFERENCES users(id)",
      billing_contact_id:  "uuid REFERENCES users(id)",
      settings:            "jsonb NOT NULL DEFAULT '{}'",
      feature_flags:       "jsonb NOT NULL DEFAULT '{}'",
      custom_domain:       "text UNIQUE",
      encryption_key_id:   "text NOT NULL",
      signing_key_id:      "text NOT NULL",
      created_at:          "timestamptz NOT NULL DEFAULT now()",
      updated_at:          "timestamptz NOT NULL DEFAULT now()",
      suspended_at:        "timestamptz",
      suspend_reason:      "text",
    },
    rls: "ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY",
  },

  workspace_members: {
    table:   "public.workspace_members",
    columns: {
      id:             "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      workspace_id:   "uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE",
      user_id:        "uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE",
      role:           "text NOT NULL",
      custom_perms:   "text[]",
      departments:    "text[] NOT NULL DEFAULT '{}'",
      invited_by:     "uuid NOT NULL REFERENCES users(id)",
      joined_at:      "timestamptz NOT NULL DEFAULT now()",
      last_active_at: "timestamptz",
      deactivated_at: "timestamptz",
    },
    indexes: [
      "CREATE UNIQUE INDEX wm_workspace_user_idx ON workspace_members(workspace_id, user_id) WHERE deactivated_at IS NULL",
    ],
  },

  /* ── Subscriptions & Billing ──────────────────────────────────── */

  subscriptions: {
    table:   "public.subscriptions",
    columns: {
      id:                    "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      workspace_id:          "uuid NOT NULL REFERENCES workspaces(id)",
      plan_id:               "text NOT NULL",
      status:                "text NOT NULL DEFAULT 'trialing'",
      billing_cycle:         "text NOT NULL",
      seats:                 "integer NOT NULL DEFAULT 1",
      started_at:            "timestamptz NOT NULL",
      current_period_start:  "timestamptz NOT NULL",
      current_period_end:    "timestamptz NOT NULL",
      trial_ends_at:         "timestamptz",
      canceled_at:           "timestamptz",
      next_billing_date:     "timestamptz NOT NULL",
      custom_overrides:      "jsonb",
      payment_method_id:     "text NOT NULL",
      invoice_email:         "text NOT NULL",
      purchase_order:        "text",
    },
    indexes: [
      "CREATE UNIQUE INDEX sub_workspace_active_idx ON subscriptions(workspace_id) WHERE canceled_at IS NULL",
    ],
  },

  usage_records: {
    table:   "public.usage_records",
    columns: {
      id:             "uuid NOT NULL DEFAULT gen_random_uuid()",
      workspace_id:   "uuid NOT NULL REFERENCES workspaces(id)",
      user_id:        "uuid REFERENCES users(id)",
      metric:         "text NOT NULL",
      value:          "numeric NOT NULL",
      metadata:       "jsonb",
      billing_period: "char(7) NOT NULL",                // "2026-05"
      timestamp:      "timestamptz NOT NULL DEFAULT now()",
    },
    partitioning: "PARTITION BY RANGE (timestamp)",
    partitions:   "Monthly partitions, auto-created by pg_partman",
    indexes: [
      "CREATE INDEX ur_workspace_period_idx ON usage_records(workspace_id, billing_period)",
      "CREATE INDEX ur_metric_idx ON usage_records(metric, billing_period)",
    ],
    notes: "High-volume table. Partitioned monthly. Aggregated to usage_summaries for billing.",
  },

  /* ── AML Core ─────────────────────────────────────────────────── */

  alerts: {
    table:   "public.alerts",
    columns: {
      id:           "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      workspace_id: "uuid NOT NULL REFERENCES workspaces(id)",
      external_id:  "text",                              // source system ID
      type:         "text NOT NULL",
      risk_level:   "text NOT NULL",
      risk_score:   "numeric(5,2) NOT NULL",
      status:       "text NOT NULL DEFAULT 'NEW'",
      entity_id:    "text",
      entity_type:  "text",
      detail:       "text NOT NULL",
      amount:       "numeric(20,2)",
      currency:     "char(3)",
      assigned_to:  "uuid REFERENCES users(id)",
      ai_analysis:  "jsonb",
      metadata:     "jsonb NOT NULL DEFAULT '{}'",
      created_at:   "timestamptz NOT NULL DEFAULT now()",
      updated_at:   "timestamptz NOT NULL DEFAULT now()",
      closed_at:    "timestamptz",
    },
    rls:     "Workspace isolation: workspace_id = current_workspace()",
    indexes: [
      "CREATE INDEX alerts_workspace_status_idx ON alerts(workspace_id, status)",
      "CREATE INDEX alerts_risk_score_idx ON alerts(workspace_id, risk_score DESC)",
      "CREATE INDEX alerts_created_at_idx ON alerts(workspace_id, created_at DESC)",
    ],
  },

  sars: {
    table:   "public.sars",
    columns: {
      id:              "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      workspace_id:    "uuid NOT NULL REFERENCES workspaces(id)",
      alert_id:        "uuid REFERENCES alerts(id)",
      fintrac_ref:     "text UNIQUE",                    // FINTRAC submission ID
      subject_entity:  "text NOT NULL",
      type:            "text NOT NULL",
      status:          "text NOT NULL DEFAULT 'DRAFT'",
      risk_level:      "text NOT NULL",
      draft:           "text",
      submitted_at:    "timestamptz",
      approved_by:     "uuid REFERENCES users(id)",
      approved_at:     "timestamptz",
      created_by:      "uuid NOT NULL REFERENCES users(id)",
      created_at:      "timestamptz NOT NULL DEFAULT now()",
      updated_at:      "timestamptz NOT NULL DEFAULT now()",
    },
  },

  kyc_records: {
    table:   "public.kyc_records",
    columns: {
      id:             "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      workspace_id:   "uuid NOT NULL REFERENCES workspaces(id)",
      entity_id:      "text NOT NULL",
      entity_type:    "text NOT NULL",
      status:         "text NOT NULL DEFAULT 'PENDING'",
      risk_rating:    "text NOT NULL",
      documents:      "jsonb NOT NULL DEFAULT '[]'",
      watchlist_hits: "jsonb NOT NULL DEFAULT '[]'",
      pep_matches:    "jsonb NOT NULL DEFAULT '[]'",
      sanctions_hits: "jsonb NOT NULL DEFAULT '[]'",
      ai_assessment:  "jsonb",
      reviewed_by:    "uuid REFERENCES users(id)",
      reviewed_at:    "timestamptz",
      next_review_at: "timestamptz",
      created_at:     "timestamptz NOT NULL DEFAULT now()",
      updated_at:     "timestamptz NOT NULL DEFAULT now()",
    },
  },

  /* ── Audit (Immutable) ────────────────────────────────────────── */

  audit_events: {
    table:   "audit.events",                           // separate schema
    columns: {
      id:             "uuid NOT NULL DEFAULT gen_random_uuid()",
      workspace_id:   "uuid NOT NULL",
      actor_id:       "uuid",
      actor_role:     "text",
      action:         "text NOT NULL",
      resource_type:  "text NOT NULL",
      resource_id:    "text NOT NULL",
      before_state:   "jsonb",
      after_state:    "jsonb",
      ip_address:     "inet",
      session_id:     "text",
      timestamp:      "timestamptz NOT NULL DEFAULT now()",
      integrity_hash: "text NOT NULL",                  // HMAC-SHA256
    },
    partitioning:  "PARTITION BY RANGE (timestamp)",
    partitions:    "Monthly, never dropped — WORM-equivalent via revoked DELETE grants",
    rls:           "NO DELETE, NO UPDATE grants to application role",
    notes:         "Append-only. integrity_hash chains events for tamper detection.",
  },

  /* ── AI Memory ────────────────────────────────────────────────── */

  user_memory: {
    table:   "public.user_memory",
    columns: {
      id:           "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      workspace_id: "uuid NOT NULL REFERENCES workspaces(id)",
      user_id:      "uuid NOT NULL REFERENCES users(id)",
      scope:        "text NOT NULL",
      type:         "text NOT NULL",
      content:      "text NOT NULL",
      importance:   "real NOT NULL DEFAULT 0.5",
      expires_at:   "timestamptz",
      created_at:   "timestamptz NOT NULL DEFAULT now()",
      updated_at:   "timestamptz NOT NULL DEFAULT now()",
    },
    notes: "Embeddings stored in Pinecone, not PostgreSQL (cost + performance).",
  },

  conversation_threads: {
    table:   "public.conversation_threads",
    columns: {
      id:              "uuid PRIMARY KEY DEFAULT gen_random_uuid()",
      workspace_id:    "uuid NOT NULL REFERENCES workspaces(id)",
      user_id:         "uuid NOT NULL REFERENCES users(id)",
      title:           "text",
      summary:         "text",
      message_count:   "integer NOT NULL DEFAULT 0",
      token_count:     "integer NOT NULL DEFAULT 0",
      related_alerts:  "uuid[]",
      related_sars:    "uuid[]",
      created_at:      "timestamptz NOT NULL DEFAULT now()",
      last_message_at: "timestamptz NOT NULL DEFAULT now()",
      archived_at:     "timestamptz",
    },
  },

} as const;

/* ── Row-Level Security Policies ────────────────────────────────────── */

export const RLS_POLICIES = {
  workspace_isolation: `
    CREATE POLICY workspace_isolation ON {table}
      USING (workspace_id = current_setting('app.current_workspace_id')::uuid)
      WITH CHECK (workspace_id = current_setting('app.current_workspace_id')::uuid);
  `,
  role_based_read: `
    CREATE POLICY role_read ON {table}
      FOR SELECT
      USING (
        workspace_id = current_setting('app.current_workspace_id')::uuid
        AND EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_id = current_setting('app.current_workspace_id')::uuid
          AND user_id = current_setting('app.current_user_id')::uuid
          AND deactivated_at IS NULL
        )
      );
  `,
  audit_append_only: `
    CREATE POLICY audit_insert_only ON audit.events
      FOR INSERT WITH CHECK (true);
    -- No SELECT/UPDATE/DELETE policies — app role lacks those grants
  `,
} as const;

/* ── Indexes Summary ────────────────────────────────────────────────── */

export const INDEX_STRATEGY = {
  primary_keys:    "UUID v4 — no sequential guessing",
  workspace_scope: "All queries filtered by workspace_id first",
  time_series:     "Timestamptz DESC indexes for alert/audit feeds",
  search:          "pg_trgm GIN indexes on text fields for ILIKE search",
  partitioning:    "Range partitioning on timestamp for usage_records and audit.events",
  vector:          "Pinecone HNSW — not in PostgreSQL",
} as const;
