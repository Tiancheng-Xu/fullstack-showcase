CREATE TABLE IF NOT EXISTS project_state (
  project_slug TEXT PRIMARY KEY,
  control_state TEXT NOT NULL CHECK (control_state IN ('stopped', 'starting', 'running', 'stopping', 'failed')),
  data_mode TEXT NOT NULL CHECK (data_mode IN ('live', 'historical', 'unavailable')),
  generation INTEGER NOT NULL DEFAULT 0 CHECK (generation >= 0),
  operation_id TEXT,
  idempotency_key TEXT,
  workflow_run_id TEXT,
  cleanup_verified INTEGER NOT NULL DEFAULT 1 CHECK (cleanup_verified IN (0, 1)),
  expires_at TEXT,
  snapshot_sha256 TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS operations (
  operation_id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL REFERENCES project_state(project_slug),
  action TEXT NOT NULL CHECK (action IN ('start', 'stop')),
  idempotency_key TEXT NOT NULL,
  generation INTEGER NOT NULL CHECK (generation > 0),
  workflow_run_id TEXT,
  actor_subject_hash TEXT NOT NULL,
  result TEXT,
  cleanup_verified INTEGER CHECK (cleanup_verified IN (0, 1)),
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE (project_slug, idempotency_key)
);

CREATE INDEX IF NOT EXISTS operations_project_requested_at
  ON operations(project_slug, requested_at DESC);

CREATE INDEX IF NOT EXISTS project_state_expiry
  ON project_state(expires_at)
  WHERE expires_at IS NOT NULL;
