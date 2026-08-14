CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip_address TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  blocked_until INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_blocked_until
ON admin_login_attempts(blocked_until);
