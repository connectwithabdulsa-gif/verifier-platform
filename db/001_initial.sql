PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS verification_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  original_address TEXT NOT NULL,
  normalized_address TEXT,
  profile TEXT NOT NULL,
  state TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS evidence_events (
  id TEXT PRIMARY KEY,
  verification_id TEXT NOT NULL REFERENCES verification_requests(id),
  observed_at TEXT NOT NULL,
  source_class TEXT NOT NULL,
  source_identity TEXT NOT NULL,
  method TEXT NOT NULL,
  method_version TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  command_stage TEXT,
  normalized_result TEXT NOT NULL,
  details_json TEXT NOT NULL,
  quality REAL NOT NULL,
  scope_json TEXT NOT NULL,
  expires_at TEXT,
  schema_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS evidence_by_verification
  ON evidence_events(verification_id, observed_at);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  verification_id TEXT NOT NULL REFERENCES verification_requests(id),
  evidence_cutoff_at TEXT NOT NULL,
  deliverability TEXT NOT NULL,
  confidence REAL NOT NULL,
  properties_json TEXT NOT NULL,
  risk_json TEXT NOT NULL,
  reasons_json TEXT NOT NULL,
  evidence_ids_json TEXT NOT NULL,
  specification_version TEXT NOT NULL,
  ruleset_version TEXT NOT NULL,
  model_version TEXT NOT NULL,
  computed_at TEXT NOT NULL,
  recommended_reverify_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS assessments_by_verification
  ON assessments(verification_id, computed_at);

CREATE TABLE IF NOT EXISTS verification_results (
  verification_id TEXT PRIMARY KEY REFERENCES verification_requests(id),
  result_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_results (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES assessments(id),
  recommendation TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  reasons_json TEXT NOT NULL,
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_jobs (
  id TEXT PRIMARY KEY,
  verification_id TEXT NOT NULL REFERENCES verification_requests(id),
  kind TEXT NOT NULL,
  state TEXT NOT NULL,
  available_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bulk_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  state TEXT NOT NULL,
  profile TEXT NOT NULL,
  total INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  webhook_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bulk_items (
  job_id TEXT NOT NULL REFERENCES bulk_jobs(id),
  ordinal INTEGER NOT NULL,
  email TEXT NOT NULL,
  state TEXT NOT NULL,
  verification_id TEXT,
  result_json TEXT,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TEXT NOT NULL,
  PRIMARY KEY(job_id, ordinal)
);
CREATE INDEX IF NOT EXISTS bulk_items_ready ON bulk_items(state, available_at);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('beta','active','suspended')),
  plan TEXT NOT NULL,
  monthly_quota INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_digest TEXT NOT NULL UNIQUE,
  scopes_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS usage_ledger (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  quantity INTEGER NOT NULL,
  kind TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  UNIQUE(tenant_id, kind, reference_id)
);
CREATE INDEX IF NOT EXISTS usage_by_tenant_time ON usage_ledger(tenant_id, occurred_at);
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_by_tenant_time ON audit_events(tenant_id, occurred_at);
CREATE TABLE IF NOT EXISTS billing_events (
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_digest TEXT NOT NULL,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  PRIMARY KEY(provider, external_id)
);
