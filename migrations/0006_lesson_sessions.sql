-- Phase 6: lesson execution engine (sessions, attempts, minimal progress).
-- Content vs execution stays split: this migration adds nothing to the
-- Phase 5 content tables (modules/lessons/learning_items/grammar_patterns/
-- lesson_items) — it only adds the runtime state for a user going through
-- a lesson. See docs/lesson-engine.md.

PRAGMA foreign_keys = ON;

CREATE TABLE learning_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons (id),
  session_type TEXT NOT NULL DEFAULT 'lesson' CHECK (session_type IN ('lesson')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  current_position INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  -- The full, server-generated activity plan for this session (JSON array
  -- of internal activity objects, answer keys included). Generated once
  -- at session creation so the sequence — and any retry insertions — stay
  -- stable across resumes. Never sent to the client wholesale; only the
  -- single current activity is ever exposed, with its answer key stripped.
  activities_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_learning_sessions_user_lesson ON learning_sessions (user_id, lesson_id, status);

CREATE TABLE exercise_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES learning_sessions (id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  activity_index INTEGER NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('learning_item', 'grammar_pattern')),
  target_id TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (
    exercise_type IN ('info_card', 'grammar_card', 'multiple_choice', 'fill_gap_choice', 'typed_recall', 'sentence_build')
  ),
  -- The user's actual submitted answer — never the correct answer.
  answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  response_time_ms INTEGER,
  -- Client-generated idempotency key (the request's `attemptId`).
  attempt_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, attempt_key)
);

CREATE INDEX idx_exercise_attempts_session ON exercise_attempts (session_id);

CREATE TABLE user_lesson_progress (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TEXT,
  completed_at TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_session_id TEXT REFERENCES learning_sessions (id),
  accuracy INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id)
);
