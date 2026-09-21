# Placement test — Phase 4

This describes only what's actually implemented: a semi-adaptive English
placement test producing a **verified** CEFR level (A1–B2) plus four
independent skill scores. It does not cover curriculum, lessons, mastery,
or anything that would consume the result beyond setting
`users.current_cefr_level` and completing onboarding.

**This is not a certified or standardized test.** It is not equivalent to
IELTS, Cambridge exams, or any accredited placement instrument — it's a
lightweight V1 estimate built from an original, deliberately small
question bank.

## Purpose

After onboarding preference collection (Phase 3) leaves a user at
`placement_required`, this test is what actually confirms their English
level, replacing the unverified `self_reported_cefr_level` collected
during onboarding with a real measurement.

## V1 question bank

64 original questions, evenly split: 16 per CEFR level (A1/A2/B1/B2), 16
per skill (vocabulary/grammar/reading/active_english) — i.e. exactly 4
questions per (level, skill) cell. All content is original; no text or
examples were copied from Cambridge, Oxford, or any commercial course or
test. Type distribution:

- **vocabulary**: 3 `multiple_choice` + 1 `typed_short_answer` per level
- **grammar**: 3 `fill_gap_choice` + 1 `typed_short_answer` per level
- **reading**: 4 `reading_multiple_choice` per level, sharing one short
  original passage per level (`placement_passages`) — an A1 notice, an
  A2 personal message, a B1 short narrative, a B2 short opinion piece
- **active_english**: 4 `multiple_choice` per level — functional/everyday
  language (greetings, requests, polite disagreement, softening bad
  news), not grammar knowledge

Seeded in `migrations/0004_placement.sql` under `test_version =
"placement_v1"` (see "Versioning" below). Content-QA tests
(`apps/api/test/placementContentQA.test.ts`) verify every seeded question
against its own bank, not a hand-maintained duplicate: valid CEFR level,
valid skill, supported type, a correct answer present (and, for
choice-based types, present among its own options with no duplicate
option values), a non-empty prompt, every `reading_multiple_choice`
question pointing at a real passage, and at least one
`typed_short_answer` question existing (so the result isn't recognition-only).

## Adaptive algorithm

One overall difficulty pointer per attempt
(`placement_attempts.current_level_pointer`), starting at **A2**.

**Question selection** (`selectNextQuestion` in
`apps/api/src/services/placementService.ts`): the skill for the next
question is whichever of the 4 has been asked _least so far this
attempt_ (ties broken by a fixed order: vocabulary, grammar, reading,
active_english) — this keeps skill coverage even regardless of which way
the difficulty pointer has moved. The level tried is the current pointer
first, then ±1, then ±2 (clipped to A1–B2), so a small bank still
reliably produces a question even after nearby cells are exhausted.

**Difficulty movement**: the pointer only moves after **two consecutive
answers in the same direction** — `consecutive_correct` /
`consecutive_incorrect` counters, one reset whenever the other
increments — and moves exactly **one CEFR band** at a time, then resets.
A single answer, in either direction, never moves it. This directly
avoids the two failure modes called out for this phase: a couple of easy
correct answers escalating the test wildly, and one missed hard question
crashing it back down.

## Stopping rules

Stop when either is true:

- `answered >= 25` (hard cap), or
- `answered >= 15` **and** every one of the 4 skills has `>= 3` answered
  **and** the pointer hasn't moved in the last 4 answers (it's
  "stabilized").

A learner whose true level sits cleanly between two adjacent bands (e.g.
right at the A1/A2 boundary) may keep alternating and never "stabilize"
— that's expected, and the 25-question hard cap is what ends the test for
them. A confident, consistent learner (or a clear extreme, like "always
correct") typically stabilizes and stops closer to 15–19 questions.

## Skill scoring

Each skill's score is simply `round(100 * correct / total)` over every
question of that skill the user actually answered, across whatever
levels they were asked at. This is intentionally independent of the
overall CEFR decision below — it's what lets a mixed profile (e.g.
strong vocabulary, weak grammar) show up honestly as two very different
numbers instead of being blended away.

## CEFR result decision

The **result level is a separate, more conservative calculation** over
the full answer history — not simply wherever the sampling pointer
happened to be when the test stopped. Sampling and scoring are
deliberately decoupled: the pointer's job is picking useful next
questions; the result's job is making a defensible claim from all the
evidence collected.

Algorithm (`computeResultLevel`):

1. Floor the result at **A1** unconditionally (there's no lower band to
   report).
2. Walk **A2 → B1 → B2** in order. For each level:
   - If it was never asked, **skip it** (no evidence either way — this
     matters for a strong learner who climbed straight past a level
     without ever needing an easier probe there; it must not cap them).
   - If it was asked, accept it (update the result, keep walking) only if
     **both**:
     - blended accuracy across all skills at that level is **≥ 60%**,
       and
     - **no individual skill tested at that level falls below 40%**
       accuracy.
   - If either check fails, **stop the walk immediately** — no higher
     level is ever accepted without passing the level below it.

The per-skill floor (40%) exists specifically for the mixed-profile case:
without it, three strong skills can mathematically outvote one
completely absent skill in a blended average and still clear 60% at a
level, which would understate a real, consistent weakness. With it, a
skill that's essentially never demonstrated correctly at a level
correctly caps the result there, rather than being smoothed over. See
`apps/api/test/placementService.test.ts`'s mixed-profile fixture (100%
vocabulary/reading/active English, 0% grammar) — it's capped at A1, not
waved through to B2.

## Edge cases handled

- **Bank exhaustion**: if no unused question exists at any tried level
  for any skill, the attempt finishes early with whatever evidence
  exists rather than erroring (won't trigger in practice with 64
  questions against a 25-question cap, but the engine doesn't assume an
  unlimited bank).
- **A level never asked**: skipped in the result walk, not treated as a
  failure (see above).
- **A skill/level combination running low**: level fallback (pointer ±1,
  ±2) keeps question selection working even if one cell's 4 questions
  are already used.

## Persistence & resume

- `placement_attempts` — one row per attempt; holds status
  (`in_progress`/`completed`/`abandoned`), the adaptive engine's
  internal state (pointer, streak counters, `current_question_id` — the
  one question currently awaiting an answer), and, once completed, the
  result (level, 4 scores, strongest/weakest skill).
- `placement_answers` — one row per answered question,
  `UNIQUE (attempt_id, question_id)`. This is what makes duplicate
  submissions safe at the database level, on top of the service-level
  check (see "Security" below).
- `placement_questions` / `placement_passages` — the versioned content
  bank.

**Resume**: `GET /api/v1/placement/current` returns the user's
`in_progress` attempt (if any) with its currently-issued question,
`completed` (pointing at the latest completed attempt), or `none`.
`POST /api/v1/placement/start` is itself resume-safe — if an
`in_progress` attempt already exists, it returns that attempt's current
question instead of creating a second one. Closing and reopening the
Mini App mid-test always lands back on the exact question that was
issued, never a freshly re-rolled one.

## Security

- Every placement route requires an authenticated session
  (`requireAuth`, unchanged from Phase 2).
- Ownership is checked on every attempt-scoped call
  (`attempt.user_id !== currentUser.id` → the same generic "not found"
  response as a missing attempt, so existence isn't leaked to a
  non-owner).
- **All grading happens server-side.** The client only ever receives a
  `PlacementQuestionDTO` (`id`, `type`, `skill`, `prompt`, `passage`,
  `options`) — never `accepted_answers_json`, `cefr_level`, or any
  difficulty/discrimination metadata. Verified by a dedicated test
  asserting the exact key set of a returned question DTO, and by the
  content-QA/route checks confirming no answer text leaks through any
  response.
- A question can only be answered if it's exactly the attempt's
  `current_question_id` — an unissued or already-superseded question ID
  is rejected (`409 question_not_issued`).
- Duplicate submissions are idempotent: if an answer already exists for
  `(attempt_id, question_id)`, the current state is returned as-is
  (no re-grading, no second score contribution) rather than erroring —
  checked before the "is this the current question" check specifically
  so a legitimate retry succeeds even after the attempt has already
  moved on to the next question.
- The result endpoint returns only the safe `PlacementResultResponse`
  shape — never raw `placement_answers` rows, internal engine state, or
  the answer key.

## Versioning

The bank is versioned (`test_version = "placement_v1"`), stored on both
`placement_questions` and `placement_attempts`. This exists so a future
`placement_v2` question bank can be introduced without corrupting or
reinterpreting historical `placement_v1` attempts — old attempts keep
pointing at the exact questions/version they were actually given.

## Retakes (not built, architecture allows it)

V1 does **not** offer retakes: `POST /placement/start` only creates a new
attempt when the user's `onboarding_stage` is `placement_required`
(their first time through). Once an attempt completes, calling `/start`
again returns `403 not_eligible` — a completed-onboarding user does not
see the placement flow again on every login.

Nothing about the schema or service layer assumes only one attempt ever
exists per user: `placement_attempts` has no unique constraint on
`user_id`, `findLatestCompletedAttempt`/`findActiveAttempt` both already
handle multiple historical rows, and completed attempts are never
overwritten or deleted. A future retake feature would mainly need to
relax the `start` eligibility check (e.g. an explicit "Retake test"
action, or a cooldown period) — it would not need a schema change.

## Known limitations

- Completion touches two things — the `placement_attempts` row and the
  `users` row (`current_cefr_level`, `onboarding_stage`,
  `onboarding_completed`) — via two sequential statements
  (`completeAttempt` then `completeOnboardingWithVerifiedLevel`), not a
  single cross-table transaction. Each individual `UPDATE` is atomic;
  the pair isn't wrapped in an explicit `BEGIN`/`COMMIT` through the
  current `Db` abstraction. In practice a partial failure here would
  need a mid-request crash between the two statements, which the
  idempotent duplicate-answer handling doesn't specifically recover
  from — a real gap, not just a theoretical one, worth revisiting before
  this matters for production traffic volume.
- The adaptive engine is a single overall difficulty pointer, not 4
  independent per-skill trackers — a skill could in principle be probed
  slightly unevenly across levels relative to where the pointer
  currently is. Round-robin skill selection keeps this from being severe
  in practice (see fixtures), but it's a simplification, not a
  claim of psychometric rigor.
- No item discrimination/difficulty statistics are tracked or used
  (explicitly out of scope for this phase — "difficulty metadata where
  useful" was left unused since the V1 bank is small enough not to need
  it yet).
- `responseTimeMs` and `attemptIdempotencyKey` are accepted and
  persisted (`response_time_ms`) but not currently used by the scoring
  or adaptive logic — idempotency is instead guaranteed structurally via
  `UNIQUE (attempt_id, question_id)` plus the duplicate-check in
  `submitPlacementAnswer`, which doesn't need a client-supplied key.
- 64 questions is enough to exercise the engine for V1, not a production
  bank — a real 25-question attempt reuses roughly a third to half of
  each skill's 16-question pool per level range visited, which is fine
  for now but would need real content-bank growth before wide traffic
  makes repeat questions across attempts noticeable to users.
