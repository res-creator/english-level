-- Phase 3: onboarding preference-collection state.
--
-- self_reported_cefr_level is the user's own self-assessment collected
-- during onboarding step 3 — NOT a verified level. Phase 1's
-- users.current_cefr_level remains NULL until a future placement/
-- confirmation phase actually sets it. See docs/onboarding.md.
--
-- onboarding_stage tracks progress through the onboarding flow so the
-- backend (not the frontend) owns resume/stage-transition logic. It stops
-- at 'placement_required' in this phase; 'completed' is reserved for a
-- future phase once placement is also done.

ALTER TABLE users ADD COLUMN self_reported_cefr_level TEXT
  CHECK (self_reported_cefr_level IN ('A1', 'A2', 'B1', 'B2') OR self_reported_cefr_level IS NULL);

ALTER TABLE users ADD COLUMN onboarding_stage TEXT NOT NULL DEFAULT 'goals'
  CHECK (onboarding_stage IN ('goals', 'daily_time', 'level_choice', 'placement_required', 'completed'));
