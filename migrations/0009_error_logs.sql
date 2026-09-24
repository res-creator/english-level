-- ---------------------------------------------------------------------------
-- Phase: pilot error visibility.
--
-- The project has no third-party error-tracking service. This is the
-- entire monitoring story for the pilot: every unhandled exception a
-- request or the daily cron run hits gets one row here, and a plain
-- `wrangler d1 execute ... SELECT * FROM error_logs` is how it gets read.
-- Deliberately not a general-purpose logging table — no arbitrary levels,
-- no free-form tags. If this needs to grow into more than "what broke and
-- for whom", that is the point to bring in a real service instead of
-- growing this one.
-- ---------------------------------------------------------------------------

CREATE TABLE error_logs (
  id TEXT PRIMARY KEY,
  -- Null for the cron run (no request) or when the request never
  -- resolved a user (auth itself failing, a malformed body, ...).
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  -- "cron" for the scheduled reminder run; otherwise the HTTP method.
  source TEXT NOT NULL,
  path TEXT,
  message TEXT NOT NULL,
  stack TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_error_logs_created ON error_logs (created_at);
