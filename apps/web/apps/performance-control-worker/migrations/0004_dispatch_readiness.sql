CREATE TABLE IF NOT EXISTS dispatch_readiness (
  project_slug TEXT PRIMARY KEY NOT NULL,
  state TEXT NOT NULL CHECK (
    state IN (
      'ready',
      'workflow_disabled',
      'workflow_missing',
      'app_unavailable',
      'permission_denied'
    )
  ),
  reason TEXT NOT NULL CHECK (
    reason IN (
      'fixed_workflow_active',
      'fixed_workflow_not_active',
      'fixed_workflow_not_found',
      'github_app_unavailable',
      'github_app_permission_denied',
      'github_response_invalid'
    )
  ),
  checked_at TEXT NOT NULL,
  fresh_until TEXT NOT NULL,
  probe_generation INTEGER NOT NULL DEFAULT 1 CHECK (probe_generation > 0),
  probe_token TEXT NOT NULL,
  FOREIGN KEY (project_slug) REFERENCES project_state(project_slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dispatch_readiness_fresh_until
  ON dispatch_readiness(fresh_until);
