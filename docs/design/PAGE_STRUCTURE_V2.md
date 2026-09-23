# Page Structure V2 — English Level

**Status:** **approved**, with clarifications (this revision), still
**not implemented**. No application code changes are made by this
document. See `PRODUCT_STRUCTURE_V2.md` §14 for the consolidated
approved next-implementation scope: the core learning journey
(Onboarding → Placement → Placement Result → first recommended lesson →
Today → Course → Unit → Lesson Preview → Lesson Session → Feedback →
Lesson Result → Next Lesson) — Review (§10) and Profile (§11) stay
FUTURE in every form, including non-SRS/simplified versions, and are not
part of this scope.

**Scope:** this document covers only the screens that **change or are new**
under [`PRODUCT_STRUCTURE_V2.md`](./PRODUCT_STRUCTURE_V2.md)'s information
architecture. Every screen not listed here (Onboarding's Goals/Daily
Time/Level/Ready, Placement's intro/question, all 6 lesson activity types,
answer feedback) is **unchanged from
[`PAGE_STRUCTURE_V1.md`](./PAGE_STRUCTURE_V1.md)** — that document remains
authoritative for them. Uses the same 11-point template as V1 and the same
tokens/components from `DESIGN_SYSTEM_V1.md`.

**Real-data discipline (unchanged from V1):** nothing below shows a metric
that cannot currently be computed from existing data, except where a
section explicitly names itself a **small additive read** (cross-referenced
to `PRODUCT_STRUCTURE_V2.md` §12) — those are called out inline, never
silently assumed.

---

## 0. Bottom Navigation — V2 target vs. current live state

| Tab     | V2 target visibility           | Current V1 live visibility          |
| ------- | ------------------------------ | ----------------------------------- |
| Today   | Visible                        | Visible                             |
| Course  | Visible (renamed from "Learn") | Visible today as "Learn"            |
| Review  | Visible once real              | **Hidden** — no backend support yet |
| Profile | Visible once real              | **Hidden** — no backend support yet |

Friends is not in this table — it is not part of the target navigation at
all (see `PRODUCT_STRUCTURE_V2.md` §3, §9). Until Phase D/E
(`PRODUCT_STRUCTURE_V2.md` §13) ship, the live bar stays exactly the
2-tab Today/Course bar already implemented — this table exists to record
the target, not to change today's behavior.

---

## 1. Today (refined)

- **Purpose**: unchanged from V1 — the single, calm "what do I do right
  now" entry point. V2 asks for tighter execution of the same hierarchy,
  not new data.
- **Hierarchy**: greeting → Continue Learning card (dominant) → current
  level → compact course progress → navigation.
- **Section order**:
  1. Greeting — `Body` "Привет, `{firstName}`" (real, `GET /me`).
  2. Continue Learning card (dominant) — current lesson/unit title,
     resolved via the existing `/today/continue` contract.
  3. **Optional, non-blocking field**: estimated duration — approved as
     useful but not required (`PRODUCT_STRUCTURE_V2.md` §6/§12/§14). No
     backend field or calculation is added solely for this. Shown only
     if trivially and reliably available from data the implementation
     already has in hand; the card omits the duration line entirely
     otherwise (already the case today) rather than estimating one.
  4. Current level (`LevelBadge`, real, `GET /me`).
  5. Compact course progress — same `moduleProgress` the Continue
     Learning contract already returns (completed/total lessons in the
     current unit).
  6. `BottomNavigation`.
- **Primary CTA**: the Continue Learning card's own CTA — unchanged
  logic from V1 (resume / start-next / none-fallback-to-Course).
- **Secondary action**: none — one decision point, unchanged principle.
- **Required data**: `firstName`, `currentCefrLevel` (`GET /me`); Continue
  Learning resolution (`GET /api/v1/today/continue`, unchanged contract
  plus the optional new duration field above).
- **Optional data**: estimated duration (degrades silently when absent).
- **Must NOT appear**: same V1 list — no debug text, no invented
  streak/XP/coins/achievements/weekly targets. Today must be
  understandable within 2 seconds — if a future addition would require a
  user to read more than the card + one progress line to know what to
  do, it doesn't belong on Today.
- **Scroll behavior**: fits one screen without scrolling on a typical
  phone — unchanged from V1.
- **Navigation behavior**: unchanged from V1.
- **Empty/error/loading**: unchanged from V1 (degrade to Course fallback
  on resolution failure, never block the user).

---

## 2. Course (replaces "Learn")

- **Purpose**: replace the flat "list of modules" mental model with a
  **guided path**: the user should be able to look at this screen and
  immediately answer "where am I, what did I finish, what's next, what's
  later" — without opening anything.
- **Hierarchy**: level context (dominant framing, not a hero) → ordered
  vertical list of Units, each showing real completion state.
- **Section order**:
  1. `SectionHeader`-style line: `LevelBadge` + "Твой курс" (renamed
     copy; same real `currentLevel` V1 already shows here).
  2. Vertical Unit list, in curriculum order (`GET /path`'s existing
     `order`), each item showing:
     - Unit number/order (`list-card__icon`-style container, existing
       V1.1 pattern)
     - Unit title (real, `GET /path`)
     - **New, small additive field**: `{completed} из {total} уроков` —
       see `PRODUCT_STRUCTURE_V2.md` §12 ("Unit completion fraction on
       the Course list"). Until that read exists, this line is simply
       omitted (matches V1's current, explicitly-documented gap) —
       **never estimated or invented**.
     - A visual state: completed (all lessons done — reuses V1's
       `--color-primary-light` tint), current (the first unit with any
       not-yet-completed lesson — reuses the V1.1 `list-card--current`
       emphasis), upcoming (default card, no special tint).
  3. `BottomNavigation`.

  **Checkpoint rule (approved, explicit):** no checkpoint marker is
  added to the Unit list itself — a checkpoint is a _lesson_, not a
  unit-level concept, so it surfaces inside Unit Detail (§3 below), not
  here. Course never implies "every unit ends in a checkpoint" — most
  don't, in real seeded content.

- **Primary CTA**: none at screen level — each Unit row is the tappable
  unit, same interaction model as V1's module list.
- **Secondary action**: none.
- **Required data**: `currentLevel`, units (`id, title, order, lessons`
  count) — `GET /path`, unchanged endpoint. Per-unit completion fraction
  is the one new field (§12); everything else is the exact V1 payload.
- **Optional data**: per-unit completion fraction (degrades to "no
  fraction shown" — matches current V1 Learn screen exactly — if the
  additive read isn't implemented yet).
- **Must NOT appear**: invented completion percentages; fake locks on
  units that aren't gated (no prerequisite system exists — see
  `PRODUCT_STRUCTURE_V2.md` §5; the "current unit" visual emphasis is
  descriptive, never an enforced gate, and must not be styled or worded
  in a way that implies later units are inaccessible).
- **Scroll behavior**: normal vertical list, no pagination — this _is_
  meant to read as a path/timeline, so generous vertical rhythm between
  units is preferred over a dense table.
- **Navigation behavior**: tap a Unit → Unit Detail.
- **Empty/error/loading**: unchanged from V1's Learn screen — skeleton
  loading, honest `EmptyState` for a level with no seeded content yet,
  `ErrorState` on fetch failure.

---

## 3. Unit Detail (replaces "Module Detail")

- **Purpose**: same as V1's Module Detail, restructured so it reads as a
  learning-path segment rather than an admin/settings list.
- **Hierarchy**: unit context (title + real outcome/description) → real
  completion progress → ordered lesson list with current-lesson
  emphasis.
- **Section order**:
  1. `TopBar` (title + back — unchanged).
  2. Unit description, **only if the module actually has one**
     (`modules.description` already exists and is already nullable in
     the real schema/DTO — V1 already conditionally renders it; V2 does
     not invent a description where none is seeded).
  3. **New, small additive field** (same read as Course's per-unit
     fraction, just already scoped to one unit): a compact progress line
     — "`{completed} из {total} уроков пройдено`" — computable today
     from data `GET /modules/:id` already returns per lesson
     (`progressStatus`), so this specific line needs **no backend
     change at all**, unlike Course's list-level rollup.
  4. Ordered `LessonCard` list — reuses the V1.1 pattern exactly
     (icon container: order number / checkmark / current-emphasis, `
tag-chip` lesson type, `StatusBadge`). **Checkpoint rule (approved,
     explicit):** a lesson row shows a checkpoint variant of the
     `tag-chip` (e.g. "Проверка" — the label V1.1 already uses for
     `lesson_type: "checkpoint"`) **only when that lesson's real
     `lesson_type` already is `"checkpoint"`** — read directly from
     `GET /modules/:id`'s existing `type` field, nothing inferred from
     position. A unit whose lessons are all
     vocabulary/grammar/mixed/etc. shows no checkpoint row at all, and
     that is the expected, honest state for most units today — this is
     not a gap to fill.
- **Primary CTA**: none at screen level — each lesson row is tappable,
  unchanged from V1.
- **Secondary action**: back navigation.
- **Required data**: unit title/description, lessons with `type`,
  `estimatedMinutes`, `progressStatus` — all already returned by
  `GET /modules/:id`, zero new backend work for this screen specifically.
- **Optional data**: unit description (may be null).
- **Must NOT appear**: mastery/knowledge claims per lesson (status stays
  strictly not_started/in_progress/completed); any lock iconography —
  same no-invented-gating rule as Course.
- **Scroll behavior**: normal vertical list.
- **Navigation behavior**: tap a lesson → Lesson Preview; back → Course.
- **Empty/error/loading**: unchanged from V1 (skeleton list, `ErrorState`
  for an unknown/archived unit).

---

## 4. Lesson Preview (refined, same data contract)

- **Purpose**: unchanged from V1/V1.1 — orient before starting without
  duplicating the lesson.
- **Hierarchy**: lesson type/title (dominant) → short real context →
  CTA (dominant) → optional collapsed content preview.
- **Section order**:
  1. `TopBar` (title + back — unchanged).
  2. Meta line: real item count + estimated minutes when available via
     navigation state (unchanged V1.1 mechanism — no new backend field).
  3. Primary CTA, sticky (unchanged).
  4. Collapsed "Что в этом уроке" disclosure — **only rendered when
     `content.length > 0`** (already fixed in Polish V1.1 — restated
     here since V2 explicitly calls out "avoid long vocabulary dumps
     before the lesson" as a principle, and this is the existing
     mechanism that satisfies it).
- **Primary CTA**: "Начать урок" / "Продолжить урок" — unchanged.
- **Secondary action**: the collapsible preview — unchanged.
- **Required data**: unchanged from V1 (`GET /lessons/:lessonId`).
- **Optional data**: unchanged from V1.
- **Must NOT appear**: a full word list expanded by default; a
  fabricated "short lesson description" — no such field exists on
  `lessons` today, so none is added (V2 explicitly says "short
  description" is _preferred_, not required, and this document does not
  invent the missing data to satisfy that preference).
- **Scroll/navigation/empty/error/loading**: unchanged from V1.

---

## 5. Lesson Session (unchanged logic, structure restated for clarity)

- **Purpose**: unchanged — one activity, fully focused, per screen.
  V2 does not touch lesson-engine logic, activity generation, scoring,
  or session state at all.
- **Section order** (already matches the V2 brief's "top/middle/bottom"
  framing exactly, since it's what V1.1 already built):
  - Top: thin header (lesson title + `X / Y` count pill + compact
    progress bar — V1.1) — functions as the "exit/back" + progress
    region; a literal exit control is not added because none exists in
    V1 today and Telegram's own chrome already provides back navigation
    — adding an explicit in-lesson exit button is a UI decision for the
    implementation task, not decided here.
  - Middle: `ActivityCard` — unchanged.
  - Bottom: Check/Continue CTA — unchanged.
- Everything else (required data, must-not-appear, empty/error/loading)
  is exactly `PAGE_STRUCTURE_V1.md` §10 plus the visual refinements
  already shipped in Polish V1.1. Not repeated here to avoid drift
  between two copies of the same spec.

---

## 6. Feedback (unchanged, already aligned)

The attempt → feedback → explanation → continue loop, the blush/coral
incorrect treatment, and the "never punitive" tone are exactly what
Polish V1.1 already implemented (`feedback-panel--incorrect` uses
`--color-secondary-pink-light`, copy reads "Почти" not "Неправильно").
V2 requires no further change here — restated only so this document's
screen inventory is complete.

---

## 7. Lesson Result (refined hierarchy)

- **Purpose**: unchanged — "what happened, how did I do, what's next."
- **Hierarchy** (V2 makes the "what's next" step more explicit than V1's
  wording did, though the underlying mechanism is identical):
  1. Completion state (accent icon + heading — V1.1).
  2. Score / correct count (`CircularProgress` + counts — unchanged).
  3. Concise supportive message (V1.1's accuracy-tiered copy — unchanged).
  4. **"What was practiced" — only if real data supports it.** Today's
     `LessonResultDTO` has no field naming _which_ items/patterns were
     practiced (only aggregate counts). This section is **omitted
     entirely** unless/until such a field exists — no placeholder, no
     invented item list. Flagged here explicitly because the V2 brief
     asks for it; the honest answer is "not buildable from current data,"
     not "build a fake version."
  5. Primary CTA: **next lesson** — unchanged mechanism from V1
     (client-side resolution via `moduleId` nav-state + `GET
/modules/:moduleId`, no new backend field).
  6. Secondary: back to unit — unchanged (renamed copy only, "Вернуться
     к модулю" → "Вернуться к юниту" if the Unit rename is adopted).
- **Must NOT appear**: XP, coins, mastery score, achievements — same
  explicit V1 rule, restated because the V2 brief repeats it verbatim.
- **Everything else**: unchanged from `PAGE_STRUCTURE_V1.md` §15.

---

## 8. Onboarding — Welcome (new screen, reviewed only)

- **Purpose**: a single framing screen before Goals — currently missing;
  onboarding starts cold at "what do you want English for."
- **Hierarchy**: brand mark → one-line value framing → CTA.
- **Section order**: `brand-mark` → `H1` short welcome line → `Body-small`
  one-line framing ("Несколько вопросов — и мы подберём твой курс") →
  `PrimaryButton` "Начать".
- **Primary CTA**: "Начать" → Goals (or wherever the reviewed sequence
  in `PRODUCT_STRUCTURE_V2.md` §11 places it).
- **Secondary action**: none.
- **Required data**: none — static copy only, same as Placement's intro.
- **Must NOT appear**: any gamified framing, any promise of a specific
  time-to-fluency, streak/reward language.
- **Scroll/navigation/empty/error/loading**: same pattern as Placement
  intro (`PAGE_STRUCTURE_V1.md` §3) — single screen, no scroll, one-way
  forward, `LoadingState` only while the onboarding-state fetch resolves.

This screen is **reviewed, not scheduled** — see
`PRODUCT_STRUCTURE_V2.md` §13 Phase C.

---

## 9. Placement Result — CTA refinement (reviewed only)

Same screen as `PAGE_STRUCTURE_V1.md` §5, with one refinement: the
primary CTA currently reads generic "Продолжить" → Course. V2 proposes
naming the actual first lesson — "Начать: `{lessonTitle}`" — by reusing
`GET /api/v1/today/continue`'s existing `start_next` resolution (the
user has just been placed, so no `in_progress` session can exist yet,
meaning this call deterministically returns `start_next` or `none`).
This is a **reuse of an existing read**, not a new recommendation path —
flagged in `PRODUCT_STRUCTURE_V2.md` §12 as a small additive backend
touch-point (one extra call from an already-existing screen), not a
new capability.

---

## 10. Review — future screen skeletons (document only, not built)

**Explicitly excluded from the next implementation scope** (§14 of
`PRODUCT_STRUCTURE_V2.md`) — including a simplified, non-SRS version.
The tab stays hidden; nothing in this section is a build target yet.

Per `PRODUCT_STRUCTURE_V2.md` §7, nothing here is implemented or
scheduled. A full 11-point spec is deliberately **not** written for
these — doing so would imply a data contract that doesn't exist yet and
invite building against an assumption. Instead, each future screen gets
a one-line purpose statement only, to be expanded into a real spec once
an `SRSService` design exists:

- **Review today** — items due now, purpose only: surface exactly what a
  future scheduler says is due, nothing else.
- **My Words** — purpose only: a browsable record of every item the user
  has encountered.
- **Weak items** — purpose only: surface items with a low real correct
  rate, once a "weak" threshold is defined.
- **Grammar review** — purpose only: same as My Words, for grammar
  patterns.

---

## 11. Profile — future screen skeleton (document only, not built)

**Explicitly excluded from the next implementation scope** (§14 of
`PRODUCT_STRUCTURE_V2.md`). The tab stays hidden.

Per `PRODUCT_STRUCTURE_V2.md` §8. One purpose statement, no layout: a
single settings/summary screen surfacing the real fields already
itemized in that section's table (level, goals, interface language,
preferences) plus whichever FUTURE fields (aggregate course progress,
placement retake) get built later. No screen structure is speculated
here beyond that — same reasoning as §10.
