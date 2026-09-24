# Lesson execution engine — Phase 6

## Content vs execution: two separate layers

Phase 5 (`docs/curriculum.md`) built **content**: modules, lessons,
learning items, grammar patterns — static, reusable, read-only. Phase 6
builds **execution**: turning that content into a sequence of gradable
activities for one specific user's attempt at one specific lesson, and
tracking their progress through it.

The frontend never decides whether an answer is correct, whether a
lesson is complete, how many activities remain, or which activity is
currently "live". The backend is the only source of truth for all of
that — the frontend just renders whatever `ActivityDTO` it was handed and
submits an answer for it.

## New tables (`migrations/0006_lesson_sessions.sql`)

Exactly three, nothing else — no `user_item_progress`,
`user_module_progress`, `review_queue`, or any mastery/SRS state. Those
systems don't exist yet.

- **`learning_sessions`** — one row per attempt at a lesson.
  `session_type` is `'lesson'` for now (reserved for future session
  types). `activities_json` holds the **entire generated activity plan**
  for this session (see below) — the only place the plan is stored.
  `current_position`/`correct_count`/`wrong_count` are the backend's
  running state; the frontend never sets these.
- **`exercise_attempts`** — one row per activity actually answered
  (including acknowledging an info_card/grammar_card). Stores the user's
  **actual submitted answer**, never the correct answer. `attempt_key`
  (the client-generated `attemptId`) plus `UNIQUE(session_id,
attempt_key)` is the idempotency mechanism (see below).
- **`user_lesson_progress`** — one row per `(user_id, lesson_id)`
  (enforced by a composite primary key), summarizing status/accuracy
  across all sessions for that lesson. This is what the Module screen
  reads to show Completed/In progress/Available — it is not itself a
  source of truth for anything mid-session.

## Session lifecycle

1. **Start** (`POST /api/v1/lessons/:lessonId/start`) — verifies the
   lesson is published and belongs to the user's currently verified CEFR
   level (`users.current_cefr_level`; no verified level yet ⇒ `403
not_eligible`; right lesson, wrong level ⇒ `403 wrong_level`). If an
   `in_progress` session already exists for this user+lesson, it's
   **resumed**, not duplicated. Otherwise a full activity plan is
   generated once (`lessonEngine/lessonSessionBuilder.ts`) and stored on
   a new `learning_sessions` row; `user_lesson_progress` is upserted to
   `in_progress` in the same `db.batch()` transaction.
2. **Resume** (`GET /api/v1/sessions/:sessionId`) — owner-only; re-reads
   `current_position` out of the stored plan and returns the same current
   activity. This is all a Mini App reopen needs — there's no separate
   "resume" endpoint or extra state to reconstruct.
3. **Answer** (`POST /api/v1/sessions/:sessionId/answer`) — grades
   server-side, records the attempt, advances `current_position` (and
   `correct_count`/`wrong_count` for scored kinds), and returns feedback
   plus either the next activity or a completion result.
4. **Completion** — when `current_position` reaches the end of the plan,
   one `db.batch()` marks `learning_sessions` completed and
   `user_lesson_progress` completed together (see "Integrity" below).

## Why the plan is one JSON blob, not a table of rows

Storing thousands of pre-generated static exercise rows wasn't necessary
for this scale, and a separate `activities` table would need its own
resume/ordering/idempotency logic duplicating what `learning_sessions`
already has. Instead, the backend generates a full, **deterministic**
activity plan once at session start (`lessonSessionBuilder.buildActivityPlan`)
and stores it as `learning_sessions.activities_json` — the same "server
holds the answer key privately, the DTO strips it" pattern Phase 4 used
for placement questions (`toQuestionDTO`), applied here via
`lessonEngine/activityDto.ts#toActivityDTO`. This makes resume trivial
(just re-read `current_position` into the stored plan) and makes the
whole engine testable without fighting randomness: the same lesson
content always produces the exact same activity sequence.

## Activity types and generation rules

Per `lesson_items` row, in lesson order:

- **`grammar_pattern`**, role `target`/`introduce` → `grammar_card` (the
  pattern's title/formula/explanation) followed by one `multiple_choice`
  "what's the rule here?" recognition check, with the pattern's own
  formula/example rendered visibly as the "here" (`ActivityPanel.tsx`) —
  a bare "which pattern is this?" with nothing shown read as a question
  about the scene's dialogue instead, which is genuinely ambiguous
  whenever that dialogue itself contains more than one construction. A
  `grammar_pattern` reused at a `review`/`practice` role (e.g. a later
  mixed-practice lesson) gets **only** the recognition check — the card
  isn't repeated.
- **`learning_item`**, role `introduce` → the full new-item sequence:
  1. `info_card` (word/translation/IPA/example/pattern — not scored)
  2. `multiple_choice` — translation recognition ("What does X mean?")
  3. `fill_gap_choice` — the target word masked out of its own example
     sentence, **or**, if the word can't be cleanly masked out of the
     sentence (e.g. an inflected form that doesn't literally appear),
     a fallback `multiple_choice` framed with the sentence as context
  4. optionally one more: `typed_recall` for single words, or
     `sentence_build` for phrase-like items whose example has ≥3 tokens
     (whichever doesn't apply produces nothing — not every item gets a
     4th activity)
- **`learning_item`**, any other role (`practice`/`review`/`target`) →
  one lighter-touch `multiple_choice` only.

A new item **never** opens with typed recall — `info_card` always comes
first for an `introduce` item, matching the required V1 sequence
(new item → info_card → recognition → context/fill gap → optionally
typed recall).

## Distractor generation (never random)

For both translation-recognition and fill-gap options, distractors come
from, in order:

1. `item_relations` rows for the target item (confused_with/antonym/etc)
2. a fallback of other published items at the same CEFR level, ordered
   by `id` ascending

Duplicate option text is filtered out (`buildOptions` in
`lessonSessionBuilder.ts`), and the final option set is sorted
alphabetically — deterministic, and avoids "the correct answer is always
option A". If truly no distractor is available at all (shouldn't happen
with real seeded content — see the content-QA tests), generation throws
a clear, specific error rather than silently producing a one-option
"multiple choice".

## Answer validation per kind

- **`multiple_choice` / `fill_gap_choice`** — the frontend submits the
  selected option's `id`; graded by exact match against the stored
  `correctOptionId`. The option `text` values are never compared.
- **`typed_recall`** — normalized (trim, lowercase, collapse whitespace,
  drop one trailing `.`/`?`/`!`) before comparing against a list of
  accepted answers built only from structured data (`display_form` and
  `lemma`) — no fuzzy/semantic matching, no AI grading.
- **`sentence_build`** — the frontend taps tokens into place and submits
  the reconstructed sentence as one string; graded the same way as typed
  recall, against the item's original example sentence. Token order in
  the DTO is a genuine Fisher-Yates shuffle, seeded deterministically
  from the learning item's stable id (`lessonEngine/lessonSessionBuilder.ts#seededShuffle`)
  — the same item always shuffles the same way (so plan generation stays
  deterministic and testable), but the order is not sorted/alphabetical
  and normally differs from the canonical sentence. For very short
  sentences where a fair shuffle happens to land back on the original
  order, one deterministic swap (first/last token) guarantees a
  different order without giving up determinism.
- **`info_card` / `grammar_card`** — not scored. "Answering" (via the
  same `/answer` endpoint, with an empty `answer` string) just records
  the acknowledgment and advances — there is nothing to get wrong. A
  dedicated `/advance` endpoint would have meant two endpoints doing
  almost the same thing for no real benefit, so this phase reuses
  `/answer` for both, per the task's own suggestion.

## Idempotency

`AnswerActivityRequest.attemptId` is a client-generated key. Before
grading anything, the backend looks it up in `exercise_attempts` via
`UNIQUE(session_id, attempt_key)`. If found, the original response is
**reconstructed** from the stored attempt (which activity, whether it
was correct) and the stored plan — nothing is re-graded, no counter is
incremented a second time, and no activity is skipped. This exactly
mirrors the duplicate-answer handling Phase 4 built for placement
answers.

## Retry behavior (session-level reinforcement, not SRS)

A wrong answer to a **scored** activity clones that exact activity (same
kind, same content, same correct answer) with a new id and splices it
into the plan **3 positions later** — not the exact next activity, so
the user isn't immediately re-shown the identical question, but soon
enough that it's still useful reinforcement within the same session. The
clone is marked `isRetry: true` so a wrong answer to _it_ does not spawn
another retry (no infinite retry chains).

This is deliberately simpler than the "alternate kind" retry sketched
during planning (e.g. multiple_choice → fill_gap_choice on retry): that
would have needed generating a second kind of check for the same target
at answer time, with its own distractor lookup — extra complexity for a
V1 feature explicitly scoped as "simple, session-level, not SRS". A
same-kind repeat after a gap satisfies the actual requirement (don't
immediately repeat the identical question) with no extra generation
logic. This is a deliberate, documented simplification, not an
oversight.

**The 3-position gap is a real invariant, not a suggestion**: a wrong
answer inside the last 3 activities of a session used to have its
insertion point clamped to the plan's own length, which silently
collapsed the gap down to as little as zero — the exact "immediately
re-shown" case this design explicitly exists to avoid. Fixed by
skipping the retry entirely when the full 3-activity gap doesn't fit,
rather than cramming it in short. The material isn't lost — it's still
due for spaced review the next day like anything else missed.

## Completion, accuracy, and replay

On completion, `learning_sessions.correct_count`/`wrong_count` become
final; `accuracy = round(100 * correct / (correct + wrong))`, counting
only **scored** activities (info/grammar card acknowledgments never
affect this). `user_lesson_progress` is updated to `completed` in the
same transaction as the session completion.

**"Start Again"** on an already-completed lesson calls the same `/start`
endpoint. Since there's no active (`in_progress`) session left, a brand
new `learning_sessions` row is created — `user_lesson_progress.status`
stays `completed` (it never regresses), `attempt_count` increments by
one, and every previous session and its `exercise_attempts` rows remain
in the database untouched, forever. Nothing about lesson history is ever
deleted or overwritten.

## Integrity

The two places where two rows must change together or not at all reuse
the exact `Db.batch()` pattern Phase 4 established for placement
finalization (a real transaction against D1, `BEGIN`/`COMMIT`/`ROLLBACK`
against `node:sqlite` in tests):

- **Start**: the new `learning_sessions` insert + the
  `user_lesson_progress` start-upsert.
- **Answer that completes the session**: the `exercise_attempts` insert
  - the `learning_sessions` completion update + the `user_lesson_progress`
    completion update — all three in one batch, so a session can never end
    up `completed` while `user_lesson_progress` is left `in_progress`, or
    vice versa.

A non-completing answer batches the `exercise_attempts` insert with the
`learning_sessions` position/counter update, for the same reason.

## Access control

- `POST /lessons/:lessonId/start`, `GET /sessions/:id`, `GET
/sessions/:id/result`, and `POST /sessions/:id/answer` all require
  authentication (`requireAuth`, unchanged since Phase 2).
- A session is only ever readable/answerable by the user who owns it —
  `session.user_id !== currentUser.id` is treated identically to "not
  found" (no information leak about whether a session id exists).

## Lesson access

No prerequisite or unlock system: any published lesson whose module
belongs to the user's currently verified CEFR level can be started.
There is no cross-level progression logic yet (an A1 user cannot start
an A2 lesson, and vice versa, regardless of how "ready" they might be).

## What Phase 6 intentionally does not implement

- **Spaced repetition / Review / "My Words" / mastery scoring** — no
  `user_item_progress`, no mastery state, no scheduling. The retry queue
  above is explicitly session-scoped reinforcement, not SRS.
- **Today Engine, streaks, Duo, Friends, notifications, payments** — none
  of this phase touches any of those systems; there's nothing here for
  them to hook into yet.
- **AI-generated content at runtime** — every explanation shown in
  feedback (`explanation` on a wrong answer) comes from existing
  localization/example/grammar-explanation data captured at plan-generation
  time, never generated live.
- **Module completion percentages** — the Module screen shows each
  lesson's own status (Completed/In progress/Available) from
  `user_lesson_progress`; it does not compute or persist a module-level
  completion percentage (the spec allows this only if "simple and
  accurate", and it wasn't needed for the required UX).
- **B1/B2 curriculum, full A1/A2 curriculum expansion, final visual
  design** — out of scope, per Phase 5/6 content sizing.

## APIs

- **`POST /api/v1/lessons/:lessonId/start`** → `LessonSessionDTO`
  (`{ sessionId, status, lesson: { id, title }, currentActivity }`).
- **`GET /api/v1/sessions/:sessionId`** → the same `LessonSessionDTO`
  shape, for resuming.
- **`POST /api/v1/sessions/:sessionId/answer`** — body
  `{ activityId, answer, responseTimeMs?, attemptId }` → `{ feedback,
session }` where `session` is either `{ status: "in_progress",
nextActivity }` or `{ status: "completed", result: LessonResultDTO }`.
- **`GET /api/v1/sessions/:sessionId/result`** → `LessonResultDTO`
  (`{ sessionId, lessonId, lessonTitle, status: "completed",
correctCount, wrongCount, scoredAttempts, accuracy, completedAt }`),
  reconstructed entirely from the persisted `learning_sessions` row — the
  same shape a completing `/answer` response carries. `409
not_completed` if the session hasn't finished yet; `404` if it doesn't
  exist or isn't owned by the caller. This is what lets the frontend
  result screen survive a page reload (see "Frontend" below).

`ActivityDTO` (`packages/contracts/src/index.ts`) is a discriminated
union on `kind`; every variant carries only what the client needs to
render and answer — no `correctOptionId`, `acceptedAnswers`,
`correctAnswer`, `explanation`, `isRetry`, `targetType`, or `targetId`
ever appears in it (verified by both the service-level tests and the
content-QA suite, across every seeded lesson). `LessonResultDTO`
likewise never carries mastery, streak, XP, or level-progress fields —
only values that are actually persisted.

## Frontend

- `apps/web/src/lessonEngine/lessonSessionClient.ts` — the API client
  (mirrors `placementClient.ts`).
- `apps/web/src/lessonEngine/activities/ActivityRenderer.tsx` — the one
  place that switches on `ActivityDTO.kind`; everything else just calls
  it. Six components: `InfoCard`, `GrammarCard`, `MultipleChoice`,
  `FillGapChoice`, `TypedRecall`, `SentenceBuild`.
- `apps/web/src/routes/LessonSession.tsx` — one activity per screen,
  progress bar + `current/total` at the top, short feedback after a
  scored answer (an inline banner + an explicit "Continue" tap — no
  auto-advance timers or long animation sequences), then the next
  activity or a redirect to the result screen.
- `apps/web/src/routes/LessonResult.tsx` — shows only what actually
  exists: question count, correct count, accuracy percentage. No streak,
  mastery, or "words learned" claims. Shows the result instantly from
  React Router navigation state when available (the normal
  just-finished-the-lesson path), and otherwise fetches it via `GET
/api/v1/sessions/:sessionId/result` using the `sessionId` in the URL —
  so a page reload, a direct link, or reopening the Mini App later all
  still show the real, persisted result.
- `apps/web/src/routes/LessonPreview.tsx` — now has a real "Start Lesson"
  button instead of the Phase 5 placeholder message.
- `apps/web/src/routes/ModuleDetail.tsx` — each lesson row now shows its
  `user_lesson_progress` status (Completed ✓ / In progress / Available)
  alongside its type.

## Services (`apps/api/src/lessonEngine/` + `apps/api/src/services/lessonSessionService.ts`)

- `lessonEngine/lessonSessionBuilder.ts` — pure(ish) plan generation from
  content + level id (reads via repositories, no mutation).
- `lessonEngine/exerciseGrading.ts` — normalization + per-kind
  correctness checks, and the wrong-answer feedback helpers
  (`correctAnswerDisplay`, `explanationFor`).
- `lessonEngine/activityDto.ts` — the one function that strips a stored
  activity down to its public `ActivityDTO`.
- `services/lessonSessionService.ts` — orchestrates start/resume/answer
  using the above plus the three new repositories
  (`learningSessionsRepository`, `exerciseAttemptsRepository`,
  `userLessonProgressRepository`), following the same
  `{ ok: true, ... } | { ok: false, error }` pattern established by
  every other service in this codebase.

No mega-service, and no premature generic "exercise framework" — each
file has one clear job.

## Known limitations

- Distractor and retry-target selection reuse the _same_ activity/option
  data rather than synthesizing new content — acceptable for V1's scale
  (84 seeded items, 16 grammar patterns per `docs/curriculum.md`) but
  would need richer content or generation logic at real scale.
- No language negotiation, same as Phase 5 — content is always generated
  in Russian regardless of `users.interface_language`.
- This machine cannot run `wrangler dev`/`wrangler d1` (same
  longstanding constraint as every previous phase), so the new endpoints
  were verified via `node:sqlite` + `app.request()`, not a live D1
  binding or a browser.
