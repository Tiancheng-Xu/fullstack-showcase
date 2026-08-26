PRAGMA foreign_keys = OFF;

DROP INDEX IF EXISTS operations_project_requested_at;
DROP INDEX IF EXISTS project_state_expiry;

ALTER TABLE operations RENAME TO operations_v1;
ALTER TABLE project_state RENAME TO project_state_v1;

CREATE TABLE project_state (
  project_slug TEXT PRIMARY KEY,
  control_state TEXT NOT NULL CHECK (control_state IN ('stopped', 'starting', 'running', 'degraded', 'stopping', 'failed', 'cleanup_required', 'unknown')),
  data_mode TEXT NOT NULL CHECK (data_mode IN ('live', 'historical', 'unavailable')),
  generation INTEGER NOT NULL DEFAULT 0 CHECK (generation >= 0),
  operation_id TEXT,
  idempotency_key TEXT,
  workflow_run_id TEXT,
  cleanup_verified INTEGER NOT NULL DEFAULT 0 CHECK (cleanup_verified IN (0, 1)),
  expires_at TEXT,
  snapshot_sha256 TEXT,
  snapshot_key TEXT,
  legacy_snapshot_sha256 TEXT,
  estimated_cost_usd REAL NOT NULL DEFAULT 0.20 CHECK (estimated_cost_usd >= 0 AND estimated_cost_usd <= 0.20),
  updated_at TEXT NOT NULL,
  last_event_at TEXT
);

CREATE TABLE operations (
  operation_id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL REFERENCES project_state(project_slug),
  action TEXT NOT NULL CHECK (action IN ('start', 'stop')),
  idempotency_key TEXT NOT NULL,
  generation INTEGER NOT NULL CHECK (generation > 0),
  workflow_run_id TEXT,
  actor_subject_hash TEXT NOT NULL,
  snapshot_sha256 TEXT,
  estimated_cost_usd REAL NOT NULL DEFAULT 0.20 CHECK (estimated_cost_usd >= 0 AND estimated_cost_usd <= 0.20),
  result TEXT,
  cleanup_verified INTEGER CHECK (cleanup_verified IN (0, 1)),
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE (project_slug, idempotency_key)
);

INSERT INTO project_state (
  project_slug, control_state, data_mode, generation, operation_id,
  idempotency_key, workflow_run_id, cleanup_verified, expires_at,
  snapshot_sha256, snapshot_key, legacy_snapshot_sha256,
  estimated_cost_usd, updated_at, last_event_at
)
SELECT
  project_slug, 'unknown', 'unavailable',
  generation, NULL,
  NULL, NULL, 0, NULL,
  NULL, NULL, snapshot_sha256,
  0.20, updated_at, updated_at
FROM project_state_v1;

INSERT INTO operations (
  operation_id, project_slug, action, idempotency_key, generation,
  workflow_run_id, actor_subject_hash, snapshot_sha256, estimated_cost_usd,
  result, cleanup_verified, requested_at, completed_at
)
SELECT
  operation_id, project_slug, action, idempotency_key, generation,
  workflow_run_id, actor_subject_hash, NULL, 0.20,
  result, cleanup_verified, requested_at, completed_at
FROM operations_v1;

DROP TABLE operations_v1;
DROP TABLE project_state_v1;

CREATE INDEX operations_project_requested_at
  ON operations(project_slug, requested_at DESC);

CREATE INDEX project_state_expiry
  ON project_state(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE control_nonces (
  nonce TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  actor_subject_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  consumed_by_operation_id TEXT
);

CREATE INDEX control_nonces_expiry ON control_nonces(expires_at);

CREATE TABLE callback_deliveries (
  delivery_id TEXT PRIMARY KEY,
  body_sha256 TEXT NOT NULL CHECK (length(body_sha256) = 64),
  status TEXT NOT NULL CHECK (status IN ('processing', 'applied', 'failed')),
  claimed_at TEXT NOT NULL,
  applied_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts >= 1)
);

CREATE INDEX callback_deliveries_received_at
  ON callback_deliveries(claimed_at);

CREATE TABLE control_batch_guards (
  operation_id TEXT PRIMARY KEY,
  valid INTEGER NOT NULL CHECK (valid = 1)
);

PRAGMA foreign_keys = ON;
