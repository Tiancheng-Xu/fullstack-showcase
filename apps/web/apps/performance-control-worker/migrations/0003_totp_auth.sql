CREATE TABLE IF NOT EXISTS totp_attempts (
  scope TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL CHECK (failure_count >= 0),
  window_started_at TEXT NOT NULL,
  locked_until TEXT
);

CREATE INDEX IF NOT EXISTS totp_attempts_locked_until
  ON totp_attempts(locked_until)
  WHERE locked_until IS NOT NULL;
