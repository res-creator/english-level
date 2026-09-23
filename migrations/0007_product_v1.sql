-- Speak in English V1: the product model on top of the Phase 5/6 engine.
--
-- Everything here is additive. No table is rebuilt, no column is dropped and
-- no row is deleted, so applying this to an existing database (preview or
-- production) cannot lose data.
--
-- Vocabulary mapping between what the learner sees and what the schema
-- already calls things:
--
--   Chapter  = modules       (unchanged)
--   Episode  = lessons       (+ the situation metadata added below)
--   Session  = a deterministic slice of an episode's activity plan
--              (computed, not stored as content — see episodePlan.ts)
--   Mission  = a learning_sessions row with session_kind = 'mission'
--   Review   = review_sessions (spans episodes, so it has no lesson_id)

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Episode (situation) metadata. Nullable: legacy lessons without a situation
-- framing keep working and simply fall back to their plain title.
-- ---------------------------------------------------------------------------

ALTER TABLE lessons ADD COLUMN situation_title TEXT;
ALTER TABLE lessons ADD COLUMN scene TEXT;
ALTER TABLE lessons ADD COLUMN capability TEXT;
ALTER TABLE lessons ADD COLUMN teaser TEXT;

-- ---------------------------------------------------------------------------
-- Sessions: which slice of an episode a run covers, and whether it is a
-- normal session or the episode's Mission. Defaults keep every existing row
-- valid as an ordinary first session.
-- ---------------------------------------------------------------------------

ALTER TABLE learning_sessions ADD COLUMN session_kind TEXT NOT NULL DEFAULT 'lesson';
ALTER TABLE learning_sessions ADD COLUMN session_index INTEGER NOT NULL DEFAULT 1;

-- ---------------------------------------------------------------------------
-- Capability state per episode: LEARNING -> CAN DO -> CONSOLIDATED.
-- This is the single source of truth for episode progression; the older
-- user_lesson_progress stays as the engine's own per-run bookkeeping.
-- ---------------------------------------------------------------------------

CREATE TABLE user_capabilities (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'learning' CHECK (state IN ('learning', 'can_do', 'consolidated')),
  -- How many of the episode's sessions the learner has finished.
  sessions_done INTEGER NOT NULL DEFAULT 0,
  -- How many sessions this episode turned out to have, recorded when the
  -- learner first starts it so lists don't have to rebuild the plan.
  sessions_total INTEGER NOT NULL DEFAULT 0,
  mission_attempts INTEGER NOT NULL DEFAULT 0,
  can_do_at TEXT,
  consolidated_at TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX idx_user_capabilities_state ON user_capabilities (user_id, state);

-- ---------------------------------------------------------------------------
-- Spaced review. One row per (user, content item). Box drives the interval:
-- 1 -> next day, 2 -> +3 days, 3 -> +7 days, then 16 and 35 once those
-- intervals are wanted. Kept deliberately simple so it can evolve without a
-- migration: only `box` and `due_at` carry scheduling meaning.
-- ---------------------------------------------------------------------------

CREATE TABLE user_item_memory (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('learning_item', 'grammar_pattern')),
  target_id TEXT NOT NULL,
  -- The episode this item was learned in — lets a successful review promote
  -- that episode's capability to CONSOLIDATED.
  lesson_id TEXT REFERENCES lessons (id) ON DELETE SET NULL,
  box INTEGER NOT NULL DEFAULT 1,
  due_at TEXT NOT NULL,
  last_result TEXT CHECK (last_result IN ('correct', 'wrong')),
  correct_streak INTEGER NOT NULL DEFAULT 0,
  reviews INTEGER NOT NULL DEFAULT 0,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE INDEX idx_user_item_memory_due ON user_item_memory (user_id, due_at);

-- ---------------------------------------------------------------------------
-- Review runs. Structurally a sibling of learning_sessions, but review spans
-- episodes so it deliberately has no lesson_id.
-- ---------------------------------------------------------------------------

CREATE TABLE review_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  current_position INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  activities_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_sessions_user ON review_sessions (user_id, status);

-- ---------------------------------------------------------------------------
-- Companion. One per user, chosen after the first completed session — never
-- during onboarding. No needs, no health, no decay: this table holds a
-- choice, nothing else.
-- ---------------------------------------------------------------------------

CREATE TABLE user_companion (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  companion_id TEXT NOT NULL,
  selected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Rewards. The catalogue itself is content (see rewardCatalog.ts) — only what
-- a specific user has unlocked lives in the database. PK makes unlocking
-- idempotent: the same reward can never be granted twice.
-- ---------------------------------------------------------------------------

CREATE TABLE user_rewards (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('episode', 'mission', 'consolidated', 'chapter', 'milestone', 'shared')
  ),
  source_id TEXT,
  unlocked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, reward_id)
);

-- ---------------------------------------------------------------------------
-- Friends: one invite link, one connection, nothing else. No groups, no
-- leaderboard, no feed.
-- ---------------------------------------------------------------------------

CREATE TABLE friend_invites (
  code TEXT PRIMARY KEY,
  inviter_user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  accepted_by_user_id TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at TEXT
);

CREATE INDEX idx_friend_invites_inviter ON friend_invites (inviter_user_id);

-- Stored symmetrically (two rows per pair) so "who are my friends" is a
-- single indexed lookup in either direction.
CREATE TABLE friendships (
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  friend_user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, friend_user_id)
);
