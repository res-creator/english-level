-- Phase 1: database foundation.
-- Entities: levels, users, user_settings, user_acquisition.
-- See docs/database.md for the rationale behind this shape.

PRAGMA foreign_keys = ON;

CREATE TABLE levels (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

INSERT INTO levels (id, code, name, order_index, description, is_active) VALUES
  ('lvl_a1', 'A1', 'Beginner', 1, 'Basic everyday expressions and simple phrases.', 1),
  ('lvl_a2', 'A2', 'Elementary', 2, 'Simple, routine communication on familiar topics.', 1),
  ('lvl_b1', 'B1', 'Intermediate', 3, 'Can handle most everyday situations while traveling or working.', 1),
  ('lvl_b2', 'B2', 'Upper Intermediate', 4, 'Can interact fluently and spontaneously with native speakers.', 1),
  ('lvl_c1', 'C1', 'Advanced', 5, 'Can use language flexibly and effectively for complex purposes.', 1);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  telegram_user_id INTEGER NOT NULL,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  interface_language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT,
  current_cefr_level TEXT REFERENCES levels (code),
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at TEXT
);

-- telegram_user_id is not the primary key (internal `id` is), but must be unique.
CREATE UNIQUE INDEX idx_users_telegram_user_id ON users (telegram_user_id);

CREATE TABLE user_settings (
  -- One row per user: user_id as the primary key both enforces that and is the FK.
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  daily_minutes INTEGER NOT NULL DEFAULT 10 CHECK (daily_minutes IN (5, 10, 15)),
  learning_goals_json TEXT NOT NULL DEFAULT '[]',
  preferred_accent TEXT NOT NULL DEFAULT 'us',
  interface_language TEXT NOT NULL DEFAULT 'en',
  daily_reminder_enabled INTEGER NOT NULL DEFAULT 1,
  daily_reminder_period TEXT,
  review_notifications INTEGER NOT NULL DEFAULT 1,
  streak_notifications INTEGER NOT NULL DEFAULT 1,
  duo_notifications INTEGER NOT NULL DEFAULT 1,
  weekly_report_notifications INTEGER NOT NULL DEFAULT 1,
  quiet_hours_enabled INTEGER NOT NULL DEFAULT 0,
  quiet_start TEXT,
  quiet_end TEXT,
  show_level_to_duo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_acquisition (
  -- One first-touch record per user: user_id as the primary key enforces that.
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  source TEXT,
  campaign TEXT,
  content TEXT,
  referrer_user_id TEXT REFERENCES users (id),
  first_touch_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
