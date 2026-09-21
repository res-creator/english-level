-- Phase 2: application session storage for Telegram Mini App authentication.
-- See docs/authentication.md for the session lifecycle this supports.

PRAGMA foreign_keys = ON;

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- SHA-256 hex digest of the raw session token. The raw token is only ever
  -- held by the client (in an HttpOnly cookie) and this process's memory
  -- for the request that issued it — it is never stored in plaintext.
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  last_used_at TEXT
);
