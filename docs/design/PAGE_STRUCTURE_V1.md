# Page Structure V1 — English Level

**Status:** approved specification, not yet implemented in code.
**Scope:** UX structure for every screen/state that exists in the
current Phase 0–6 product. Uses the tokens and components defined in
[`DESIGN_SYSTEM_V1.md`](./DESIGN_SYSTEM_V1.md).

This document describes **structure and behavior**, not final visuals —
no code changes are made by this document.

## How to read each entry

Every screen is specified with the same 11 points: purpose, hierarchy,
exact section order, primary CTA, secondary action, required data,
optional data, what must NOT appear, scroll behavior, navigation
behavior, empty/error/loading behavior.

## Real-data discipline

Nothing below shows a metric that cannot currently be computed from
Phase 0–6 data. Where a screen's _ideal_ content would need something
that doesn't exist yet (a "continue learning" query, streaks, word of
the day), that is called out explicitly as **future** — not designed
into the current composition. See §16 (Today) and the end-of-task report
for the specific list.

---

## 0. Bottom Navigation — approved V1 scope

**Approved decision**: the visible V1 bottom navigation contains
**only** the two currently functional destinations. Review, Friends,
and Profile are **not implemented** in Phase 0–6 and are **hidden
entirely** — no tab, no disabled state, no "Coming soon" placeholder.

| Tab     | V1 visibility                          | Note                                                                                    |
| ------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| Today   | **Visible** (redesigned per §16 below) | Real entry point                                                                        |
| Learn   | **Visible**                            | Real curriculum path                                                                    |
| Review  | **Hidden — not shown at all**          | No spaced-repetition/review system exists yet (explicitly out of scope through Phase 6) |
| Friends | **Hidden — not shown at all**          | No social features exist yet                                                            |
| Profile | **Hidden — not shown at all**          | No profile/settings screen exists yet                                                   |

`BottomNavigation` renders exactly 2 tabs in V1, centered rather than
stretched (see `DESIGN_SYSTEM_V1.md`'s component entry) — it must not
look like a 5-tab bar with 3 items missing. Review/Friends/Profile
return to the navigation once those screens are actually implemented in
a future phase; this document does not invent a timeline for that.

---

## 1. Telegram entry / loading / auth state

- **Purpose**: bridge the moment between opening the Mini App and having
  a resolved auth state.
- **Hierarchy**: single centered element, no chrome.
- **Section order**: app background → centered brand mark (static, small
  logo/wordmark) → `LoadingState` (spinner variant).
- **Primary CTA**: none — this state has no user action.
- **Secondary action**: none.
- **Required data**: none (this _is_ the state before any data exists).
- **Optional data**: none.
- **Must NOT appear**: any debug text (`Auth status:`, `API status:` —
  currently on Today, must never appear here or on Today, see §16);
  raw error objects.
- **Scroll behavior**: none, fixed centered content.
- **Navigation behavior**: not user-navigable; resolves automatically to
  Onboarding, Placement, or Today per the backend's `next` value once
  auth completes.
- **Empty/error/loading**: this state _is_ the loading state for the
  whole app. If auth genuinely fails (no Telegram context, no dev
  fixture), show a minimal `ErrorState`: "Не удалось войти. Откройте
  приложение через Telegram." No retry button needed — there's nothing
  to retry without leaving and reopening the Mini App.

---

## 2. Onboarding (Goals / Daily Time / Level / Ready)

One structure, 4 instances — each step differs only in its content, not
its frame.

- **Purpose**: collect goals, daily-time preference, self-reported level;
  confirm readiness before Placement.
- **Hierarchy**: step indicator → short framing line (why this question)
  → question content → primary action.
- **Section order**: `TopBar`-less (no back chrome beyond Telegram's own,
  except a `TextButton` "Назад" where going back is safe) → step
  indicator (4 segments, current step filled with `--color-primary`) →
  `H1` question → 1-line `Body-small` framing copy (new — currently
  missing per the audit) → option list (`Chip`/`AnswerOption`-style
  selectable rows) → `PrimaryButton` "Продолжить".
- **Primary CTA**: "Продолжить" (advances to the next step; on Ready,
  advances to Placement).
- **Secondary action**: none on Goals/Daily Time/Level; Ready step may
  offer no secondary action either — it's a confirmation, not a choice.
- **Required data**: the step's own options (goals list, time options,
  level options — all static, already defined client-side).
- **Optional data**: previously-saved answer for this step, when
  resuming (already supported server-side).
- **Must NOT appear**: any mention of streaks, XP, or gamified rewards
  for completing onboarding.
- **Scroll behavior**: normal vertical scroll if the option list is
  long (Goals, up to a handful of items) — content never gets clipped.
- **Navigation behavior**: linear forward; resuming reopens at the
  correct step (already implemented server-side, keep it).
- **Empty/error/loading**: `LoadingState` (spinner) while
  submitting/loading; `ErrorState` inline if a save fails, with the
  form still filled in (never lose the user's selection on error).

---

## 3. Placement — intro

- **Purpose**: set expectations before starting the test.
- **Hierarchy**: single framing screen, one CTA.
- **Section order**: `H1` "Проверим твой уровень английского" →
  `Body` explanation (skills covered, adaptive length) → a short,
  concrete time range (see required data) → `PrimaryButton` "Начать".
- **Primary CTA**: "Начать" → starts the test.
- **Secondary action**: none.
- **Required data**: none beyond static copy.
- **Optional data**: none.
- **Must NOT appear**: an exact question count (the test is adaptive,
  15–25 questions — stating one number would be dishonest); mastery/XP
  language.
- **Scroll behavior**: fits one screen, no scroll needed at any
  reasonable text size.
- **Navigation behavior**: one-way forward into the question flow.
- **Empty/error/loading**: `LoadingState` while `POST /placement/start`
  resolves; `ErrorState` if starting fails (e.g. not eligible).

---

## 4. Placement — question

- **Purpose**: answer one adaptive question at a time.
- **Hierarchy**: progress → optional passage → question → answer input
  → CTA.
- **Section order**: segmented `ProgressBar` (approximate, see note) →
  passage (`Card`, only when present) → `H2` prompt → options
  (`AnswerOption` list) or text input → `PrimaryButton` "Продолжить".
- **Primary CTA**: "Продолжить" (disabled until an answer is given).
- **Secondary action**: none — no skip (matches current behavior).
- **Required data**: current question (prompt, options or input mode,
  optional passage), progress (`answered`/`estimatedTotal`).
- **Optional data**: passage text (only for reading questions).
- **Must NOT appear**: the correct answer before submission (already
  guaranteed server-side); a progress bar that visually promises a fixed
  end point — style it as an approximate/segmented indicator, not a
  precise percentage, since `estimatedTotal` is an estimate, not a
  guarantee (fixes the audit's "progress bar can overshoot 100%" finding).
- **Scroll behavior**: passage screens may need scroll; question-only
  screens should fit without it.
- **Navigation behavior**: forward-only, one question replaces the next
  in place (no stacked history).
- **Empty/error/loading**: `LoadingState` between question submit and
  next question arriving; `ErrorState` only on genuine failure (network,
  session issue) — a wrong answer is never an error state.

---

## 5. Placement — result

- **Purpose**: communicate the verified level and skill breakdown; hand
  off into Learn.
- **Hierarchy**: level (dominant) → skill breakdown (supporting) → CTA.
- **Section order**: `LevelBadge`/`Display`-sized level letter → 1-line
  `Body` plain-language meaning of that level (new — currently just the
  bare letter) → `SkillProgress` (4 rows) → strongest/weakest summary
  line → optional self-reported-level comparison line → `PrimaryButton`
  "Продолжить" (→ Learn).
- **Primary CTA**: "Продолжить" → Learn, directly to the user's new
  level path.
- **Secondary action**: none.
- **Required data**: `result.level`, `result.scores` (4 skills),
  strongest/weakest skill.
- **Optional data**: `selfReportedLevel` comparison line (only if present).
- **Must NOT appear**: raw skill codes (`active_english`) — always the
  localized label; any retake/redo option (matches current product
  logic — no retake flow exists).
- **Scroll behavior**: fits one screen at normal text size; scroll if needed on small devices, no clipping.
- **Navigation behavior**: one-way forward into Learn.
- **Empty/error/loading**: `LoadingState` while the result loads;
  `ErrorState` if the attempt isn't found/complete.

---

## 6. Today

See §16 below for the full redesign — this entry exists only to satisfy
the requested numbering; do not duplicate content.

---

## 7. Learn

- **Purpose**: show the user's current-level path as a sequence of
  modules, not a generic list.
- **Hierarchy**: current level (context) → module sequence.
- **Section order**: `SectionHeader`-style line: `LevelBadge` + "Твой
  путь" (new — currently the level isn't shown here at all, per the
  audit) → `ModuleCard` list, in curriculum order.
- **Primary CTA**: none at the screen level — each `ModuleCard` is
  itself the tappable unit.
- **Secondary action**: none.
- **Required data**: `currentLevel`, modules (`id, title, order,
lessons` count) — already returned by `GET /path`.
- **Optional data**: per-module completion state (see below).
- **Must NOT appear**: invented completion percentages persisted as
  data; fake locks on modules that aren't actually gated (current
  product logic has no prerequisite system — don't invent one visually
  either).
- **Module completion display rule**: computed live as _completed
  lessons / total published lessons_ per module **only** using data
  already available (per-lesson `progressStatus`, already returned by
  `GET /modules/:id`, not by `GET /path`) — so a lightweight completion
  indicator on the Learn list itself (as opposed to inside a module) is
  a **future** enhancement unless `GET /path` is extended to include it.
  Until then, Learn shows modules without a completion fraction, and
  Module Detail (§8) shows the real per-lesson status.
- **Scroll behavior**: normal vertical list, no pagination.
- **Navigation behavior**: tap a module → Module Detail.
- **Empty/error/loading**: `LoadingState` (skeleton: 3 placeholder
  `ModuleCard`s); `EmptyState` for a level with no seeded content yet
  (B1/B2 today) — honest copy: "Курс для этого уровня скоро появится",
  never an empty silent list; `ErrorState` on fetch failure.

---

## 8. Module detail

- **Purpose**: show one module's lessons with real progress status.
- **Hierarchy**: module context → lesson sequence.
- **Section order**: `TopBar` (title + back) → optional module
  description (`Body-small`) → `LessonCard` list in order.
- **Primary CTA**: none at screen level — each `LessonCard` is tappable.
- **Secondary action**: back navigation.
- **Required data**: module title/description, lessons with `type`,
  `estimatedMinutes`, `progressStatus` — already returned by
  `GET /modules/:id`.
- **Optional data**: none beyond the above.
- **Must NOT appear**: mastery/knowledge claims per lesson — status is
  strictly `not_started`/`in_progress`/`completed`.
- **Scroll behavior**: normal vertical list.
- **Navigation behavior**: tap a lesson → Lesson Preview; back → Learn.
- **Empty/error/loading**: `LoadingState` (skeleton list);
  `ErrorState` for an unknown/archived module (404).

---

## 9. Lesson preview

- **Purpose**: orient before starting, without duplicating the entire
  lesson content (fixes the audit's biggest finding on this screen).
- **Hierarchy**: title/meta (dominant) → CTA (dominant) → content
  preview (collapsed by default).
- **Section order**: `TopBar` (title + back) → meta line ("`N` слов ·
  ≈ `M` мин", both derivable from the lesson's item count and
  `estimatedMinutes`) → `PrimaryButton` "Начать урок" (sticky at the
  bottom, always reachable without scrolling past it) → collapsed
  "Что в этом уроке" disclosure containing today's full word/pattern
  list (opt-in, not shown by default).
- **Primary CTA**: "Начать урок" (or "Продолжить урок" if
  `user_lesson_progress.status = in_progress` — see below).
- **Secondary action**: the collapsible content preview (not a button,
  a disclosure).
- **Required data**: lesson title/type, item count, `estimatedMinutes`.
- **Optional data**: full content list (inside the disclosure only).
- **Resume label rule**: if a session is already `in_progress` for this
  lesson, the primary button must say "Продолжить урок", not "Начать
  урок" — this is derivable today (`startLessonSession` already resumes
  silently; the button copy just needs to know the state first via
  `user_lesson_progress`, already exposed per-lesson on Module Detail —
  Lesson Preview itself doesn't currently fetch it, a small addition).
- **Must NOT appear**: the full word list expanded by default (today's
  behavior); any score/mastery preview.
- **Scroll behavior**: the CTA must stay reachable (sticky) regardless
  of how long the (collapsed-by-default) preview list is.
- **Navigation behavior**: tap CTA → Lesson Session; back → Module Detail.
- **Empty/error/loading**: `LoadingState`; `ErrorState` for an
  unpublished/unknown lesson.

---

## 10. Activity screen (lesson session, all activity types)

- **Purpose**: one activity, fully focused, per screen — this
  architecture is correct today and is kept unchanged.
- **Hierarchy**: minimal chrome → activity content dominates →
  answer/continue action.
- **Section order**: thin header (lesson title `Caption` + `ProgressBar`
  - `X / Y` `Caption`, all compact — never competing with the activity
    for attention) → `ActivityCard` (content varies by kind: InfoCard,
    GrammarCard, MultipleChoice, FillGapChoice, TypedRecall, SentenceBuild
    — see `DESIGN_SYSTEM_V1.md` component list) → primary action
    (Continue for cards, Check for scored activities).
- **Primary CTA**: "Continue"/"Продолжить" (info/grammar cards) or
  "Проверить" (scored kinds) — copy should be localized (currently
  English, flagged in the audit).
- **Secondary action**: none — no skip.
- **Required data**: the current `ActivityDTO` (already fully
  specified, no answer key present).
- **Optional data**: none.
- **Must NOT appear**: the correct answer before submission (already
  guaranteed); any score/mastery/streak counter during the lesson.
- **Scroll behavior**: content should fit without scroll for most
  activities; Sentence Build's token bank may need to wrap but not
  scroll independently.
- **Navigation behavior**: forward-only within the session; no back
  button mid-lesson (matches current, intentional — prevents answer
  changes after the fact).
- **Empty/error/loading**: `LoadingState` between activities;
  `ErrorState` only for genuine failures — never for a wrong answer.

---

## 11. Correct answer feedback

- **Purpose**: confirm success briefly, without derailing pace.
- **Hierarchy**: appended below the activity, not a modal/overlay.
- **Section order**: `FeedbackPanel` (correct variant: check icon +
  short affirming line, e.g. "Верно!") → `PrimaryButton` "Продолжить".
- **Primary CTA**: "Продолжить".
- **Secondary action**: none.
- **Required data**: `feedback.correct = true`.
- **Optional data**: none — correct answers don't need an explanation.
- **Must NOT appear**: any numeric score change ("+10"), any sound/
  confetti.
- **Scroll behavior**: panel pushes content down in normal flow; no
  layout jump/overlay.
- **Navigation behavior**: Continue → next activity or Lesson Result.
- **Empty/error/loading**: n/a.

---

## 12. Incorrect answer feedback

- **Purpose**: correct the record and explain, supportively.
- **Hierarchy**: appended below the activity, same in-flow placement as
  correct feedback — deliberately not visually alarming.
- **Section order**: `FeedbackPanel` (incorrect variant: neutral-toned
  icon, e.g. a simple "×" not a harsh warning glyph + "Не совсем" +
  correct answer + short explanation when available) →
  `PrimaryButton` "Продолжить".
- **Primary CTA**: "Продолжить".
- **Secondary action**: none — no "try again immediately" (matches the
  session-level retry design; an immediate retry would contradict the
  lesson-engine's own "not immediately repeated" rule).
- **Required data**: `feedback.correctAnswer`.
- **Optional data**: `feedback.explanation` (omit the explanation line
  entirely when null — never show "No explanation available").
- **Must NOT appear**: shaming language, red flash/shake motion (see
  Motion principles), any streak-loss messaging (no streak exists).
- **Scroll behavior**: same as correct feedback.
- **Navigation behavior**: Continue → next activity (which may be this
  item's later retry, per existing session-retry logic — no need to
  signal that explicitly to the user).
- **Empty/error/loading**: n/a.

---

## 13. Sentence build

- **Purpose**: tap-to-build ordering, specified separately since it has
  unique interaction needs.
- **Hierarchy**: prompt → build target zone → word bank → CTA.
- **Section order**: `H3`/`Body` prompt ("Собери предложение") → build
  target (`Card`, dashed border while empty, per current implementation
  — keep) → word bank (`Chip`-style tappable tokens) →
  `Body-small` running count "3/6 слов" (new — fixes the audit's
  finding that there's no indication of how many words remain) →
  `PrimaryButton` "Проверить" (disabled until the bank is empty, not
  just non-zero — fixes the audit's finding that Check is tappable
  after only one word).
- **Primary CTA**: "Проверить".
- **Secondary action**: tapping a placed word returns it to the bank
  (already implemented, keep).
- **Required data**: `content.tokens` (shuffled).
- **Optional data**: none.
- **Must NOT appear**: the canonical order before submission (already
  guaranteed server-side).
- **Scroll behavior**: word bank wraps, no independent scroll region.
- **Navigation behavior**: same as any scored activity.
- **Empty/error/loading**: n/a beyond the standard activity states.

---

## 14. Lesson completion (transition into the result)

This is a transition moment, not a distinct screen — called out
separately per the requested list, but it is the motion described in
`DESIGN_SYSTEM_V1.md` §7 ("Lesson completion") immediately preceding
§15 below, not an intermediate screen of its own.

---

## 15. Lesson result

- **Purpose**: answer "what happened, how did I do, what's next" — the
  screen's whole job, per the approved Result Principle.
- **Hierarchy**: outcome (dominant) → counts (supporting) → next action
  (dominant CTA).
- **Section order**: short celebratory `H2` ("Урок пройден") →
  `CircularProgress` (large, accuracy %) as the visual centerpiece →
  `Body` counts ("`N` заданий · `M` верно") → `PrimaryButton` pointing
  to the natural next action (see below) → `TextButton` "Вернуться к
  модулю" (secondary, generic fallback).
- **Primary CTA rule — approved**: prefer the next existing lesson,
  resolved **client-side**, from module/lesson data already loaded
  earlier in the flow — no new backend field is added solely for this.
  Mechanism: Lesson Preview already fetches the lesson's content via
  `GET /lessons/:lessonId`, whose response includes `moduleId`. The
  client carries `moduleId` forward through navigation state (Lesson
  Preview → Session → Result — the same mechanism already used to carry
  the result object itself). At Result, if `moduleId` is known, the
  client fetches `GET /modules/:moduleId` (already existing, already
  returns each lesson's `order` and `progressStatus`) and finds the
  lesson immediately after the just-completed one, **by order, within
  the same module only** — crossing into the next module is out of
  scope for V1, not decided here. If there is a next lesson, the
  primary CTA reads "Следующий урок: `{lessonTitle}`" and leads straight
  into its Lesson Preview. If there is none (last lesson in the module,
  or `moduleId` wasn't available for some reason, e.g. a direct reload
  with no navigation state), the primary CTA falls back to exactly
  **"Вернуться к модулю"**, per the approved fallback rule — there is no
  separate secondary button in that case, the fallback simply becomes
  the one CTA.
- **Secondary action**: when a next lesson _is_ found, "Вернуться к
  модулю" is shown as a secondary `TextButton` alongside the primary
  "Следующий урок" CTA — the user can always choose to stop instead of
  continuing.
- **Required data**: `sessionId`, `lessonId`, `lessonTitle`,
  `correctCount`, `scoredAttempts`, `accuracy` — exactly what
  `LessonResultDTO` returns today.
- **Optional data**: `moduleId` (carried via navigation state, not part
  of `LessonResultDTO`) — used only to compute the next-lesson CTA;
  its absence degrades gracefully to the fallback, never an error.
- **Must NOT appear**: streak, XP, mastery, "words learned" — explicitly
  forbidden by the existing backend design and the Real Data Only
  principle. A low score must not trigger red/error color anywhere on
  this screen.
- **Scroll behavior**: fits one screen at normal text size.
- **Navigation behavior**: see primary CTA rule above; secondary always
  goes to Module Detail. Reloading this screen directly re-fetches via
  `GET /sessions/:id/result` (already implemented) — never shows a
  blank/broken state on refresh.
- **Empty/error/loading**: `LoadingState` while the result loads (either
  from navigation state instantly, or the network fallback);
  `ErrorState` ("result unavailable") only if the session truly can't be
  found — already handled server-side as a clean 404/409.

---

## 16. Today

The screen the task singles out for redesign — must not become an
overloaded dashboard. Central idea: the user immediately understands
what to do next, and never has to decide what to learn.

- **Purpose**: single, calm entry point — "what should I do right now."
- **Approved V1 hierarchy**: greeting → `ContinueLearningCard` (primary,
  dominant) → real current level → compact supporting progress (real
  data only) → navigation.
- **Section order (V1, real data only)**:
  1. Greeting — `Body` "Привет, `{firstName}`" (real, from `GET /me`).
  2. `ContinueLearningCard` (primary, dominant) — resolved via the new
     read-only data contract below.
  3. `LevelBadge` — the user's real `currentCefrLevel` (already returned
     by `GET /me`, zero new backend work) — e.g. "Уровень A1", placed
     as a small line under the card, not a competing hero element.
  4. Compact module-progress line — "`N` из `M` уроков в этом модуле,"
     sourced from the **same** data contract as `ContinueLearningCard`
     (see below) — not a second request, not a separate metric.
  5. `BottomNavigation` (2 tabs: Today, Learn — see §0).
  6. _(future, not in V1)_ Streak/consistency — see
     `DESIGN_SYSTEM_V1.md`'s `StreakCard`, not rendered.
  7. _(future, not in V1)_ Word of the Day — see
     `DESIGN_SYSTEM_V1.md`'s `WordOfDayCard`, not rendered.
- **Primary CTA**: the CTA inside `ContinueLearningCard` — "Продолжить
  урок" (resume case), "Начать урок `{lessonTitle}`" (start-next case).
  If resolution returns "none" (nothing to resume or start — e.g. the
  whole level is completed), the card is replaced by a single fallback:
  "Продолжить обучение" → `/learn`.
- **Secondary action**: none — Today offers exactly one decision point.
- **Required data**: `firstName`, `currentCefrLevel` (both already
  available via `GET /me`); the Continue Learning resolution (below).

### Continue Learning — required data contract (document only, do not implement)

A new, **read-only** endpoint is required to resolve "what should this
user do next." This section documents the contract; implementation
happens later, during UI build, under these constraints (all approved):

- no new recommendation algorithm — deterministic resolution over
  existing curriculum order and progress data only
- no Phase 7 logic (no mastery, no spaced repetition, no scoring)
- no write behavior — pure read
- no fake/invented progress
- uses only existing course/module/lesson/`user_lesson_progress`/
  `learning_sessions` data

**Resolution priority** (first match wins):

1. **Resume** — the user has an `in_progress` `learning_sessions` row
   for some lesson (any module, at their current level). Return that
   lesson and its session id.
2. **Start next** — no in-progress session. Walk the user's current
   level's modules and lessons in their existing `order_index` order and
   return the first lesson whose `user_lesson_progress` is missing or
   not `completed`.
3. **None** — every lesson at the current level is `completed`, or the
   user has no verified level yet. Return no lesson; the client shows
   the Learn fallback CTA (§ above).

**Illustrative response shape** (naming/endpoint path not binding —
decided during implementation):

```
GET /api/v1/today/continue   (illustrative name)

{
  "status": "resume" | "start_next" | "none",
  "lesson": { "id": "...", "title": "...", "moduleId": "..." } | null,
  "sessionId": "..." | null,              // present only for "resume"
  "moduleProgress": { "completed": 3, "total": 7 } | null
}
```

`moduleProgress` is included because resolving `lesson` already
requires reading that lesson's module's lesson list (the same data
`GET /modules/:id` exposes today) — surfacing the count here avoids
Today making a second request just to show the "compact supporting
progress" line. This is a minimal, natural extension of the same read,
not a second capability; flagged here for visibility, not as a further
open decision.

- **Must NOT appear**: `Auth status:`/`API status:` debug text (remove
  entirely — it was a Phase 0 debug placeholder, not product UI); any
  invented XP/coins/league/mastery/streak number; `StreakCard` or
  `WordOfDayCard` in any form; more than one primary element competing
  for attention.
- **Scroll behavior**: fits one screen without scrolling on a typical
  phone — this is a deliberately short screen.
- **Navigation behavior**: the primary CTA leads into a Lesson Preview
  (resume/start-next case) or into Learn (none case); `BottomNavigation`
  below handles cross-screen navigation.
- **Empty/error/loading**: `LoadingState` while the Continue Learning
  resolution loads; if it fails (network error, not a "none" result),
  degrade to the Learn fallback CTA rather than showing an `ErrorState`
  — Today should never block the user from at least reaching Learn.

---

## 17–19. Loading, error, and empty states (cross-cutting)

Specified once here rather than repeated per screen — every screen
above references these by name.

### Loading

- Use `LoadingState`'s **skeleton** variant for any screen showing
  cards/lists (Learn, Module Detail, Lesson Preview): gray placeholder
  blocks matching the real layout's shape, `--color-surface-secondary`.
- Use the **spinner** variant only for short, unpredictable waits with
  no known shape to skeleton (Telegram auth bootstrap, submitting an
  answer).
- Never show bare `Loading…` text as the _only_ treatment going
  forward — that's the current, flagged state.

### Error

- Every error surface maps a technical error (`error.code` from the
  API, or a raw `fetch` failure) to one plain-language `ErrorState`
  message — never render `{err.message}` directly (today's behavior,
  flagged in the audit). A small, fixed dictionary of known error codes
  → Russian copy is enough for V1; unknown/unexpected errors fall back
  to one generic message ("Что-то пошло не так. Попробуйте ещё раз."),
  never a raw stack trace or fetch error string.
- Always pair with a `SecondaryButton` "Повторить" where a retry is
  meaningful (most cases); omit it only where there's genuinely nothing
  to retry (e.g. §1's auth failure).

### Empty

- `EmptyState` is used only where "nothing here" is a real, honest
  product state — not as a fallback for a bug. Current real case:
  Learn for a level with no seeded curriculum (B1/B2 today). Copy must
  say _why_ it's empty in plain terms, never just "No items."
