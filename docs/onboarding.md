# Onboarding — Phase 3

This describes only what's actually implemented: preference collection
(goals, daily study time, a self-reported level guess) after Telegram
login, ending at a `placement_required` handoff. It does **not** cover
the placement test itself, curriculum, lessons, or anything past that
handoff — those are future phases.

## Steps

1. **Goals** (`goals` stage) — "What do you want English for?" 1–3 of:
   `everyday`, `travel`, `work`, `study`, `moving_abroad`,
   `movies_internet`.
2. **Daily study time** (`daily_time` stage) — 5, 10, or 15 minutes; 10 is
   marked "Recommended" in the UI.
3. **Level knowledge** (`level_choice` stage) — "I don't know", or
   A1/A2/B1/B2 (deliberately **not** C1 — placement, not self-report,
   decides whether someone is C1).
4. **Handoff** (`placement_required` stage) — "Your setup is ready." /
   "Let's check your English level." / Continue → `/placement`, a static
   placeholder ("Placement test will be added in the next phase."). No
   placement logic exists yet.

## Stored fields

| Field                               | Table           | Meaning                                                                  |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------ |
| `users.onboarding_stage`            | `users`         | Backend-owned progress marker (see below)                                |
| `users.self_reported_cefr_level`    | `users`         | The user's own guess from step 3, or `NULL` for "I don't know"           |
| `user_settings.learning_goals_json` | `user_settings` | Step 1's answer (JSON array) — reuses the Phase 1 column                 |
| `user_settings.daily_minutes`       | `user_settings` | Step 2's answer — reuses the Phase 1 column, same `5\|10\|15` constraint |

`onboarding_stage` and `self_reported_cefr_level` were added in
`migrations/0003_onboarding.sql` (Phase 1's `0001_init.sql` and Phase 2's
`0002_sessions.sql` are untouched). Goals and daily time didn't need a new
column — `user_settings` already had the right shape from Phase 1.

## `self_reported_cefr_level` vs. `current_cefr_level`

These are deliberately different columns with different guarantees:

- **`self_reported_cefr_level`** (Phase 3) is what the user _thinks_ their
  level is, collected as a plain onboarding answer. It's never treated as
  verified anywhere in this codebase.
- **`current_cefr_level`** (Phase 1) is reserved for a level a future
  placement/confirmation phase has actually established. Phase 3 never
  writes to it — it stays `NULL` through this entire flow, including once
  onboarding preferences are fully collected.

Nothing in Phase 3 reads `self_reported_cefr_level` to set
`current_cefr_level`, and no CEFR progress or curriculum state is
fabricated from it.

## Backend stage transitions

`onboarding_stage` is one of `goals`, `daily_time`, `level_choice`,
`placement_required`, `completed` (`completed` is reserved for a future
phase, once placement also finishes — Phase 3 never sets it).

The backend, not the frontend, owns progression
(`apps/api/src/services/onboardingService.ts`):

- Each `PUT` endpoint only accepts a step's answer if the user's current
  stage is **at or past** that step. Writing `daily_time` while still at
  `goals` is rejected (`409`, `step_locked`) — a client can't jump ahead
  by calling a later endpoint directly.
- If the write is for the step the user is **currently on**, the stage
  advances to the next one.
- If the write is for a step the user has **already passed** (they went
  back and changed an earlier answer), the value updates but the stage
  does **not** move — editing never resets or skips progress.

This means the full happy path is: `goals` → (valid goals) → `daily_time`
→ (valid minutes) → `level_choice` → (valid level, or `null`) →
`placement_required`. Phase 3 never reaches `completed`.

## `GET /api/v1/onboarding` and resume behavior

Returns `{ stage, goals, dailyMinutes, selfReportedCefrLevel }`. A field
for a step the user hasn't reached yet reads as `null` (or `[]` for
goals) — **not** the underlying column's schema default. This matters
concretely for `dailyMinutes`: `user_settings.daily_minutes` defaults to
`10` at row creation (Phase 1), so without this masking the API couldn't
tell "user hasn't answered yet" apart from "user picked the default
value". The response only reveals a field once `onboarding_stage` has
moved past that field's own step.

Because `GET /onboarding` always reflects the persisted stage, reopening
the Mini App naturally resumes at the right screen: the frontend calls it
on mount and navigates to whichever step the stage maps to
(`apps/web/src/onboarding/stageRoutes.ts`). Each onboarding page also
independently re-checks this on its own mount and redirects if its step
doesn't match — so resuming is correct regardless of which URL the user
(or a stale bookmark) lands on.

## Editing a previous answer

Every onboarding page pre-fills from the current backend state and lets
the user change it — e.g. going back from the handoff screen to change
daily minutes from 10 to 5. Saving that goes through the same `PUT`
endpoint; because the user's stage is already past `daily_time`, the
service treats it as an edit (see "Backend stage transitions" above):
the new value is stored, the stage stays at `placement_required`, and
goals/level are untouched.

## Why placement stays a separate phase

Phase 3's job is collecting _preferences_, not establishing a _verified_
level. `placement_required` exists specifically so the system can tell
"basic preferences collected" apart from "level confirmed" — conflating
them (e.g. by marking `onboarding_completed = true` here, or writing a
self-report into `current_cefr_level`) would let the app skip a real
placement check later. `/placement` is intentionally a static page with
no scoring, questions, or CEFR logic; `users.onboarding_completed` is
untouched by this phase and only becomes meaningful once a future phase
implements placement and can legitimately set it.
