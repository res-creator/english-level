# Product Structure V2 — Information Architecture

**Status:** **approved**, with clarifications (this revision), still
**not implemented**. No application code, routes, schema, or navigation
changes have been made by this document. Companion document:
[`PAGE_STRUCTURE_V2.md`](./PAGE_STRUCTURE_V2.md) (screen-by-screen
structure built on this IA).

**Approved clarifications applied in this revision** (superseding the
prior draft wherever they differ — see §5, §6, §7, §12, §13, and the new
§14 for the consolidated next-implementation scope):

1. Checkpoint is represented in the Course path **only where it already
   exists in real curriculum data** — never auto-added, no new
   checkpoint logic for the UI's sake.
2. Estimated lesson duration is a nice-to-have, **not a blocker** — no
   backend field/calculation is added solely for it; shown only if
   trivially and reliably derivable from existing data, omitted
   otherwise.
3. Review stays FUTURE in every form, including a non-SRS manual list —
   not part of the next implementation scope at all.
4. Visible navigation during implementation stays exactly Today +
   Course — Review/Profile stay hidden.
5. The next implementation scope is scoped to the core learning journey
   only — see §14.

**Relationship to V1 docs:** [`DESIGN_SYSTEM_V1.md`](./DESIGN_SYSTEM_V1.md)
(tokens, components, visual language) and
[`PAGE_STRUCTURE_V1.md`](./PAGE_STRUCTURE_V1.md) (the currently-implemented
V1 screens) are **not superseded**. V2 changes the *information
architecture* — what screens exist, how they're organized, what they're
called — not the visual system. Every V2 screen still uses
`DESIGN_SYSTEM_V1.md`'s tokens/components unless a new component is
explicitly called out here.

## 1. Core principle

**The user should never have to decide what to study next.** Every screen
either shows the one next action or leads to it in one tap. This document
exists because repeat-quitters of language apps consistently cite the same
three reasons: too many entry points, no visible path, no idea what today's
session is. V2 is a direct structural answer to that, not a redesign for
its own sake.

## 2. Who this serves

Per the task brief, V2 is optimized for a user who:

- has started and quit English learning apps before,
- feels overwhelmed by too many resources/sections,
- doesn't know what to study next,
- needs a visible, honest path,
- prefers short sessions over long ones.

Every structural decision below is judged against this user, not against
feature parity with Duolingo/Busuu/Babbel/English Galaxy.

## 3. Final navigation architecture

| Tab     | V2 target                                | Current V1 live state                                                     |
| ------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Today   | Visible — primary entry point             | Visible today, stays as-is structurally, gets the refinements in §6         |
| Course  | Visible — renamed from "Learn"            | Visible today as "Learn"; V2 renames + restructures around Unit hierarchy   |
| Review  | Visible **once real review/SRS exists**   | **Hidden** — no spaced-repetition/review system exists in the backend yet   |
| Profile | Visible **once a real profile screen exists** | **Hidden** — no profile/settings screen or endpoint exists yet          |

**Friends is explicitly removed from the target navigation.** It stops
being a primary destination in V2; if a social/Duo feature is ever built,
it re-enters product design as a feature surfaced *from* Today or Profile,
not as its own tab — this avoids the "too many entry points" failure mode
the target user has already burned out on elsewhere.

This is the same rule V1 already applies (hide, don't stub) — V2 doesn't
change how hiding works, it changes what the *permanent* target list is,
so V1's current 2-tab bar (Today/Course after the rename) is already
"V2-shaped," just two tabs short of the final set.

## 4. Complete screen inventory

| # | Screen | V1 status | V2 status |
| - | ------ | --------- | --------- |
| 1 | Telegram entry/loading/auth | Implemented | Reused unchanged |
| 2 | Onboarding — Welcome | **Missing in V1** | **New** — see §10 |
| 3 | Onboarding — Goals | Implemented | Reused unchanged |
| 4 | Onboarding — Daily time (preferences) | Implemented | Reused, reframed as part of "preferences" step |
| 5 | Onboarding — Self-estimated level | Implemented | Reused unchanged |
| 6 | Onboarding — Ready/handoff | Implemented | Reused unchanged |
| 7 | Placement — intro | Implemented | Reused unchanged |
| 8 | Placement — question | Implemented | Reused unchanged |
| 9 | Placement — result | Implemented | Reused, gains "first recommended lesson" CTA — see §10 |
| 10 | Today | Implemented | Restructured — see §6 |
| 11 | Course (was "Learn") | Implemented (flat module list) | Restructured into Level → Unit path — see §5 |
| 12 | Unit Detail (was "Module Detail") | Implemented | Restructured — see §5 |
| 13 | Lesson Preview | Implemented | Refined, unchanged data contract — see PAGE_STRUCTURE_V2 §4 |
| 14 | Lesson Session (all activity types) | Implemented | Reused, lesson-engine logic untouched |
| 15 | Answer feedback (correct/incorrect) | Implemented | Reused, tone already aligned (Polish V1.1) |
| 16 | Lesson Result | Implemented | Refined hierarchy — see PAGE_STRUCTURE_V2 §7 |
| 17 | Review — today's due items | **Does not exist** | **Future** — documented only, §7 |
| 18 | Review — My Words | **Does not exist** | **Future** — documented only, §7 |
| 19 | Review — Weak items | **Does not exist** | **Future** — documented only, §7 |
| 20 | Review — Grammar review | **Does not exist** | **Future** — documented only, §7 |
| 21 | Profile | **Does not exist** (stub route only) | **Future** — documented only, §8 |
| 22 | Friends | Exists as an unlinked stub route | **Removed from target IA** — see §3, §9 |

## 5. Course → Unit → Lesson → Checkpoint hierarchy

**Naming clarification, not a data model change:** "Unit" is the
user-facing label for what the schema and API already call a **Module**
(`modules` table, `GET /path`, `GET /modules/:id`). "Course" is the
user-facing label for what today is the "Learn" screen. No table, column,
route, or DTO is renamed by this document — see §11/§12 for exactly what
would move if this naming is adopted.

**Real hierarchy already in the database and content**, confirmed from the
current seed content (`seeds/content/a1-modules.json`,
`seeds/content/a1-lessons.json`):

```
Level (A1, A2, B1, B2 — `levels` table)
  └─ Unit / Module (e.g. "Me & Introductions" — `modules` table)
       └─ Lesson (`lessons` table, `lesson_type`: vocabulary | grammar |
                   mixed | reading | practice | checkpoint)
```

Every seeded A1/A2 level today already has 3 units of 4 lessons each,
and the **last lesson of the third unit is already `lesson_type:
"checkpoint"`** in real seed data (`les_a1_03_04`, `les_a2_03_04`) — this
is not a hypothetical future type, it already exists and already runs
through the same lesson engine as any other lesson.

**Important honesty note carried over from V1:** starting a lesson has
**no prerequisite/unlock gate** today
(`apps/api/src/services/lessonSessionService.ts`: "No prerequisite/unlock
system: a lesson is eligible if it's published [and at the user's
level]"). So "current lesson" / "available lesson" in the Unit Detail UI
is a **display convention** (first not-completed lesson in order gets
visual emphasis), not an enforced lock — exactly like V1's Module Detail
already does. V2 does not invent a lock system; if real prerequisite
gating is ever wanted, that's a distinct, later backend decision, called
out as FUTURE in §12, not assumed here.

**What "checkpoint" means today, honestly:** structurally identical to
any other lesson — same lesson engine, same activity types, same scoring.
The only difference is the `lesson_type` label and the seeded content
choosing review-heavy `lesson_items` for it. V2 does **not** invent
special checkpoint gating, extra scoring weight, or a "must pass to
continue" rule — none of that exists in current logic. It's presented
in Course/Unit UI as a distinct visual moment (per §5 of
PAGE_STRUCTURE_V2.md) purely because the *content* is already
structured that way, not because new logic was added.

**Approved rule (explicit):** a checkpoint is shown in the Course/Unit
UI **only for a lesson whose real `lesson_type` is already
`"checkpoint"`** in the current curriculum data. Today that means
exactly `les_a1_03_04` and `les_a2_03_04` — the third unit of A1 and A2
— and **no other unit gets a checkpoint visual**, because no other unit
has one in the real content. This is not a per-unit pattern to apply
uniformly: units 1 and 2 of A1/A2 end in a `"mixed"`-type lesson
("Mixed Practice"), not a checkpoint, and the UI must not paper over
that difference by inserting a checkpoint marker where the data doesn't
have one. If a future content update seeds more checkpoints, they
appear automatically (the UI reads `lesson_type`, it doesn't hardcode
positions) — but no implementation task should add checkpoint content,
gating, or scoring logic "to complete the pattern."

**Course screen** = a vertical list of Units for the user's current
verified level, each unit showing its own real lesson-completion
fraction — this closes a gap V1 explicitly deferred ("Learn shows modules
without a completion fraction... future enhancement unless `GET /path` is
extended," per `PAGE_STRUCTURE_V1.md` §7). V2 calls for that small,
real, non-invented extension — see §12.

**Unit Detail screen** = V1's Module Detail, restructured (see
PAGE_STRUCTURE_V2 §3) with the same real per-lesson `progressStatus` data
that already exists, no new backend read beyond what §12 calls out.

## 6. Today structure (target)

Unchanged in principle from the already-approved V1 hierarchy — V2 asks
for tighter visual/structural execution of the same real data, not new
data:

1. Greeting (`firstName`, real, from `GET /me`)
2. **Dominant** Continue Learning card — current lesson/unit title,
   **approved rule on duration:** useful, but **not a blocker** — shown
   only if it can be derived trivially and reliably from data that
   already exists, omitted otherwise. Concretely: `lessons
   .estimated_minutes` already exists in the schema and is already
   returned by `GET /modules/:id`, so surfacing it on Today is a
   candidate *only in the sense that the value already exists
   somewhere* — no new backend field or calculation is to be added
   solely to get it onto this card. If it isn't trivially available in
   whatever the implementation task's data flow already looks like, the
   card simply omits the duration line, exactly as it does today.
   Clear CTA either way.
3. Current level (`currentCefrLevel`, real, from `GET /me`)
4. Compact real course progress (already-existing `moduleProgress` from
   the Continue Learning contract — completed/total lessons in the
   current unit)

Two-second rule: nothing on Today competes with the Continue Learning
card for attention. No streak, no Word of the Day, no XP, no fake weekly
stats — same "Real Data Only" constraint V1 already enforces, restated
here because it's load-bearing for V2's Course/Unit changes too (a Unit's
completion fraction must be real, never estimated).

## 7. Review — future target structure (document only)

**Nothing here is implemented or scheduled by this document.** No review
system, spaced-repetition scheduler, or "weak item" scoring exists in the
current schema (`migrations/`) or services. This section exists so that
when a Review phase is eventually planned, the target shape is already
on paper.

**Approved rule (explicit):** Review stays FUTURE **in every form**,
including a simplified, non-SRS manual review list (e.g. "just show me
everything I've seen"). It is not part of the next implementation scope
at all — see §14. The next implementation task should not build even a
minimal Review screen "to have something there"; the tab stays hidden
(§3, §14) until a real Review design is separately scoped.

Target structure, in likely priority order:

1. **Review today** — items due for review "now," by whatever scheduling
   algorithm a future `SRSService` computes. **FUTURE** — no
   `SRSService`, no due-date table, no spaced-repetition state exists
   today (`learning_items`/`user_lesson_progress` track lesson
   completion, not per-item recall strength).
2. **My Words** — a browsable list of every learning item the user has
   encountered, sourced from `exercise_attempts`/`user_lesson_progress`
   joined to `learning_items`. **Partially buildable today** (the raw
   attempt history already exists in `exercise_attempts`), but "my
   words" as a *product feature* (dedup, sorting, mastery-adjacent
   display) is still **FUTURE** — flagged so a future task doesn't
   assume it's a trivial read.
3. **Weak items** — items with a low correct rate. **FUTURE** — requires
   a defined "weak" threshold and a `MasteryService`/`SRSService`
   concept that doesn't exist; `exercise_attempts.is_correct` exists as
   raw material, mastery scoring does not.
4. **Grammar review** — same shape as My Words but for
   `grammar_patterns`. **FUTURE**, same caveats as #2.

None of these are wired into the V2 navigation bar until at least one is
real — see §3.

## 8. Profile — future target structure (document only)

**Nothing here is implemented or scheduled by this document.** Target
fields, each marked against what's real today:

| Field | Status |
| ----- | ------ |
| Current CEFR level | **Real today** — `users.current_cefr_level`, already in `GET /me` |
| Learning goal(s) | **Real today** — `user_settings.learning_goals_json`, no current read endpoint exposes it back out, but the data exists |
| Course progress (overall, across all units) | **FUTURE** — no aggregate query exists; per-lesson/per-module progress exists, a level-wide rollup does not |
| Completed lessons (count/list) | **Partially real** — derivable from `user_lesson_progress`, but no endpoint aggregates it today |
| Interface language | **Real today** — `users.interface_language` |
| Learning preferences (daily minutes, reminders, quiet hours, accent) | **Real today** — all columns exist on `user_settings`, already used by onboarding, no read-back UI exists |
| Retake placement test | **FUTURE** — no retake flow exists in `placementService`; current logic assumes one attempt per user's verified level |

Profile is deliberately not designed screen-by-screen here (that's
PAGE_STRUCTURE_V2's job once actually scheduled) — this table exists so a
future Profile task starts from an honest inventory instead of guessing.

## 9. Screens removed or merged from current V1

- **Friends** (`/friends`, `Friends.tsx`): removed from the target IA
  entirely (§3). The route file can stay as dead code or be deleted in a
  future cleanup task — not decided here, since this document changes no
  code.
- **"Learn"** is renamed to **"Course"** — not removed, relabeled; see
  §5's naming-clarification note.
- **"Module Detail"** is renamed to **"Unit Detail"** — same, relabeling
  only.
- No other V1 screen is removed. Onboarding, Placement, Lesson Preview,
  Lesson Session, activity feedback, and Lesson Result are all reused.

## 10. Existing screens that can be reused as-is

Unchanged in structure, data contract, and (mostly) visual treatment:

- Telegram entry/loading/auth
- Onboarding: Goals, Daily Time, Level, Ready
- Placement: intro, question
- Lesson Session (all 6 activity types) and answer feedback — lesson
  engine logic is explicitly out of scope for this and every prior task
- The `LoadingState`/`ErrorState`/`EmptyState`/`TopBar`/`StatusBadge`/etc.
  component set from `DESIGN_SYSTEM_V1.md`

## 11. Ideal onboarding sequence (review only — reuses existing logic)

Target sequence, compared against what exists:

```
Welcome  →  Goal  →  Self-estimated level  →  Preferences  →  Placement
  →  Placement result  →  first recommended lesson
```

| Step | Exists today? |
| ---- | -------------- |
| Welcome | **Missing** — onboarding currently starts directly at Goals; a single-screen welcome/framing step is new (documented in PAGE_STRUCTURE_V2, not built) |
| Goal | Exists (`GoalsStep`) |
| Self-estimated level | Exists (`LevelStep`) — sequenced after Daily Time today; the ideal order above moves it earlier, next to Goal, which is a **reordering** to review, not a data change (same `onboarding_stage` state machine, different `STAGE_ROUTES` order) |
| Preferences (daily time, + reminders/accent if ever added) | Exists today only as Daily Time (`DailyTimeStep`); reminders/quiet-hours/accent already have `user_settings` columns but no onboarding UI — **not proposed for V2**, flagged as a possible future addition only |
| Placement | Exists (`Placement`) |
| Placement result | Exists (`PlacementResult`) |
| First recommended lesson | **Missing as an explicit step** — today `PlacementResult`'s CTA goes to Course/Learn in general, not to a specific first lesson. The **Continue Learning contract already implemented for Today** (`GET /api/v1/today/continue`) already computes exactly "the first not-completed lesson" — PAGE_STRUCTURE_V2 proposes reusing that same read, not a new algorithm, to make Placement Result's CTA name a specific lesson |

This section is explicitly **review, not a build order** — see §13 for
when/how it would actually change.

## 12. Backend/data implications

Every implication below is classified so a future implementation task
knows exactly what it's signing up for.

**Zero-backend, presentation-only (safe to do in a UI task alone):**
- Renaming "Learn" → "Course", "Module" → "Unit" in all user-facing copy
  and route labels (URLs can stay `/learn/...` or be relabeled — a
  routing decision for the implementation task, not this document)
- Restructuring Course as a Level → Unit vertical list using data
  `GET /path` already returns
- Restructuring Unit Detail using data `GET /modules/:id` already returns
- Reordering onboarding steps (Level next to Goals) — same state machine,
  different `STAGE_ROUTES` sequence

**Small, additive backend reads (same shape/spirit as the existing
Continue Learning contract — read-only, no new algorithm):**
- **Unit completion fraction on the Course list** — `GET /path` would
  need to additionally return each module's completed/total lesson
  count, the same computation `todayService.ts` already does per-module
  for `moduleProgress`. No new table, no new concept, a genuinely small
  extension of an existing read.
- **A named "first recommended lesson" on Placement Result** — reusing
  `GET /api/v1/today/continue`'s existing `start_next` resolution
  (already deterministic, already exists) rather than inventing a second
  recommendation path.
- **Estimated lesson duration on Today's Continue Learning card —
  approved as non-blocking.** `lessons.estimated_minutes` already exists
  in the schema and is already returned by `GET /modules/:id`; the
  Continue Learning contract (`GET /api/v1/today/continue`) does not
  currently include it. This is *listed* here as a small additive read,
  but it is explicitly **not required** for V2 — no backend field or
  calculation is to be added solely to surface it. Include it only if
  the implementation task finds it trivially available already; omit it
  otherwise, same as today.

**Explicitly FUTURE, out of scope for any V2 UI task without a separate
decision:**
- Any Review functionality (§7) — needs a genuinely new `SRSService`/
  scoring concept, not a read extension
- Any Profile aggregate stats beyond what's already itemized in §8
- Any prerequisite/lock system for units or lessons — not proposed,
  explicitly called out in §5 as something V2 does *not* add
- Placement retake flow
- Friends/social features of any kind

## 13. Migration plan — V1 to V2 (phased, no big-bang)

**Phase A — relabeling + IA restructure (UI-only, zero backend change).**
Rename Learn → Course, Module Detail → Unit Detail, restructure Course
into a Level → Unit vertical list and Unit Detail into the emphasized
current/completed/available layout PAGE_STRUCTURE_V2 specifies. Uses
existing `GET /path` / `GET /modules/:id` data exactly as V1 already
does. Bottom nav stays 2 tabs (Today, Course) — Review/Profile remain
hidden per §3 until they're real.

**Phase B — the additive reads from §12 that the core journey actually
needs**: unit completion fraction on Course, named
first-recommended-lesson on Placement Result. Each its own small,
reviewable backend change following the same pattern as the existing
Continue Learning endpoint — read-only, no new tables, no new algorithm.
Estimated duration on Today is **not part of this phase's required
scope** — approved as opportunistic-only (§6, §12): included if trivial,
skipped otherwise, never its own blocking change.

**Phase C — onboarding reorder** (Level moved next to Goals, optional
Welcome step added) — independent of A/B, can happen anytime since it
only touches `STAGE_ROUTES` ordering and one new static screen.

**Phase D (not scheduled, needs its own product decision before any
code) — Review.** Requires designing an actual `SRSService` /
scheduling concept first; this document deliberately does not propose
one.

**Phase E (not scheduled) — Profile.** Mostly UI once scheduled — most
fields in §8 are already real data, this is lower-risk than Phase D
whenever it's picked up.

Each phase is independently shippable and independently reversible — V2
is a sequence of small, honest extensions of what already exists, not a
rewrite.

## 14. Approved next implementation scope (this revision)

This section consolidates the approved clarifications into one
unambiguous scope statement for whatever implementation task picks this
up next.

**In scope — the complete core learning journey, end to end:**

```
Onboarding → Placement → Placement Result → first recommended lesson
  → Today → Course → Unit → Lesson Preview → Lesson Session → Feedback
  → Lesson Result → Next Lesson
```

Concretely, this is Phase A in full (Course/Unit relabel + restructure)
plus Phase B's two required reads (unit completion fraction, named
first-recommended-lesson) plus Phase C (onboarding reorder, including
the new Welcome screen) from §13 — i.e. everything needed for a user to
go from opening the Mini App for the first time to finishing lessons in
a visible, guided path, with the next action always named. Estimated
duration (§6/§12) rides along only if trivial; it is not a separate
required step.

**Explicitly out of scope for this implementation pass:**
- Review, in any form — including a simplified/manual, non-SRS version
  (§7). The Review tab stays hidden.
- Profile, in any form (§8). The Profile tab stays hidden.
- Any checkpoint content, gating, or scoring logic beyond displaying the
  `lesson_type: "checkpoint"` lessons that already exist (§5).
- Any prerequisite/lock system for units or lessons.
- Placement retake, Friends/social features.

**Visible navigation for the duration of this implementation pass:**
exactly Today + Course — unchanged from what's live today. Review and
Profile are not added to the bar, not even as disabled/"coming soon"
states, consistent with the rule V1 already established and §3/§4 of
this document restate.

**Core V2 principle, restated as the acceptance bar for this scope:**
the learner should always know the next action —
- after Placement Result → a concrete first-lesson CTA (name the
  lesson, not "go explore"),
- after Lesson Result → the next real lesson as the primary CTA,
- on Today → Continue Learning is the one dominant decision,
- on Course → the learner can see where they are in the path at a
  glance (current/completed/upcoming units), without it becoming a
  dashboard.

**Open product decisions:** none identified. Every clarification in this
revision has a concrete, already-real data source or an explicit
"omit if unavailable" fallback — nothing in this scope is blocked on a
decision this document doesn't already resolve.
