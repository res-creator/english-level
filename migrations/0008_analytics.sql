-- ---------------------------------------------------------------------------
-- Phase: pilot analytics.
--
-- One append-only event log. It exists to answer one question during the
-- pilot: where does a real learner actually stop. It is deliberately not a
-- general-purpose analytics platform — a fixed, small catalog of events
-- (enforced in application code, not here) rather than free-text names, so
-- the log can never accumulate junk or drift into something that needs its
-- own schema migrations every time a screen changes.
--
-- `user_id` is nullable: the hook and the 48-second demo run before an
-- account exists, so those events are recorded against `anonymous_id`
-- only. `anonymous_id` is also kept on authenticated events when the
-- client has one, so a pilot funnel can be read end to end — demo, through
-- signup, through the first Mission — without pretending the join is
-- exact identity resolution.
--
-- Never touched by the preview account reset: the reset clears what a
-- learner *knows*, not the record of what they *did*, and pilot analysis
-- needs the latter to survive a reset test run.
-- ---------------------------------------------------------------------------

CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  anonymous_id TEXT,
  event_name TEXT NOT NULL,
  -- Small, flat, JSON-encoded: {"episodeId": "...", "accuracy": 80}.
  -- Validated and size-capped by the service that writes it, never by a
  -- CHECK here — the event catalog is application logic, not schema.
  properties_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_name ON analytics_events (event_name, created_at);
CREATE INDEX idx_analytics_events_user ON analytics_events (user_id, created_at);
CREATE INDEX idx_analytics_events_anon ON analytics_events (anonymous_id, created_at);
