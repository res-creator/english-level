# Design System V1 — English Level

**Status:** approved specification, not yet implemented in code.
**Scope:** visual language and component inventory for the Telegram Mini
App UI. This is the source of truth for the later UI implementation —
no application code changes yet.

Companion document: [`PAGE_STRUCTURE_V1.md`](./PAGE_STRUCTURE_V1.md)
(screen-by-screen structure using these tokens/components).

Background: this resolves the findings of the earlier UX/UI audit
(shared separately as a Claude Docs artifact, not a repo file).

## 1. Direction summary

Modern, clean, adult, calm, friendly, slightly playful, premium but
approachable. Motivating without childish gamification. Built for daily
use inside Telegram — not a school app, not a corporate dashboard, not a
Duolingo clone, not a generic developer UI (the literal current state,
see the audit).

## 2. Color tokens

Foundation is white / very light neutral gray. **Green is the main
product color** (primary actions, progress, selected states, success,
current-learning state). **Pink is strictly supporting** (secondary
emphasis, tags, gentle accents) — never a competing primary. The
interface should read as "green product with a soft pink accent," not
"green and pink in equal measure."

| Token                          | Hex       | Usage                                                                                                                                                                                                                                                                    |
| ------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--color-primary`              | `#278A5E` | Primary buttons, selected states, progress fill, success, current-lesson indicator. Verified ≥ 4.3:1 contrast with white text — safe for button labels and large text; borderline for very small body text on a solid fill (avoid body copy directly on filled primary). |
| `--color-primary-hover`        | `#1F7550` | Hover (desktop testing only — Telegram is touch, but keep for web preview)                                                                                                                                                                                               |
| `--color-primary-pressed`      | `#185F41` | Active/pressed state                                                                                                                                                                                                                                                     |
| `--color-primary-light`        | `#E3F5EC` | Light green surface: selected option background, progress track fill area, subtle highlight cards                                                                                                                                                                        |
| `--color-primary-light-border` | `#BEE3CD` | Border for elements sitting on `primary-light`                                                                                                                                                                                                                           |
| `--color-primary-decorative`   | `#3FB37D` | Brighter green for illustration accents/decorative shapes only — **never for text or icons that need to read as interactive**, contrast with white is insufficient for that use                                                                                          |
| `--color-secondary-pink`       | `#F2A9BB` | Chip fills, tags, decorative accents, occasional motivational highlight. Pair with `text-primary` or `secondary-pink-text`, not white — contrast with white text is too low.                                                                                             |
| `--color-secondary-pink-light` | `#FCEAEF` | Light pink surface for supporting cards (e.g. a "did you know" editorial aside)                                                                                                                                                                                          |
| `--color-secondary-pink-text`  | `#B8506B` | Text/icons placed on pink surfaces — AA-safe darker pink                                                                                                                                                                                                                 |
| `--color-background`           | `#FAFAF9` | App/screen background                                                                                                                                                                                                                                                    |
| `--color-surface`              | `#FFFFFF` | Card and sheet surfaces                                                                                                                                                                                                                                                  |
| `--color-surface-secondary`    | `#F3F4F1` | Secondary surface: inactive/disabled card fill, input background, subtle section dividers                                                                                                                                                                                |
| `--color-text-primary`         | `#1F2320` | Primary text. ≈15.5:1 on `background` — excellent.                                                                                                                                                                                                                       |
| `--color-text-secondary`       | `#6B7268` | Secondary/meta text, captions, placeholders                                                                                                                                                                                                                              |
| `--color-text-on-primary`      | `#FFFFFF` | Text/icons on filled `--color-primary`                                                                                                                                                                                                                                   |
| `--color-border`               | `#E4E6E1` | Default hairline border for cards, inputs, dividers                                                                                                                                                                                                                      |
| `--color-success`              | `#278A5E` | Same value as primary — success and "this is going well" share the product's main color intentionally                                                                                                                                                                    |
| `--color-success-surface`      | `#E3F5EC` | Same as `primary-light`                                                                                                                                                                                                                                                  |
| `--color-warning`              | `#A96A0B` | Warning text/icons (rare in V1 — mainly reserved, not heavily used yet)                                                                                                                                                                                                  |
| `--color-warning-surface`      | `#FBEEDA` | Warning light surface                                                                                                                                                                                                                                                    |
| `--color-error`                | `#C6423A` | Error/incorrect-answer text and icons. Verified ≈4.95:1 on white — AA-safe for normal text, deliberately **not** a harsh pure red (keeps mistakes from feeling punishing, per product principle)                                                                         |
| `--color-error-surface`        | `#FBE7E5` | Error/incorrect light surface (e.g. wrong-answer feedback background)                                                                                                                                                                                                    |
| `--color-disabled`             | `#C7CAC5` | Disabled control fill                                                                                                                                                                                                                                                    |
| `--color-disabled-text`        | `#9CA097` | Disabled control text/icon (intentionally low-contrast — WCAG exempts disabled controls from contrast requirements)                                                                                                                                                      |

**Rule of thumb**: if in doubt, default to `--color-primary` for anything
green and `--color-secondary-pink*` for anything pink — never introduce a
second, uncatalogued green or pink. Any new token must be added here
first.

**Verification note**: the pairs above marked "verified" were computed
by hand against the WCAG relative-luminance formula. The remaining pairs
follow the same darkening principle (saturated hue → dark enough for
AA when it carries text) but should still be re-checked with a contrast
tool (e.g. the browser devtools contrast checker) at implementation
time, not re-derived from this document blind.

## 3. Typography

**Family**: [Manrope](https://fonts.google.com/specimen/Manrope) —
geometric-humanist sans, full Cyrillic + Latin support, variable weight,
free (Google Fonts), reads as modern/friendly without tipping into
playful/childish. Fallback stack:
`"Manrope", "Helvetica Neue", Arial, sans-serif` (system fallback keeps
the app usable even if the webfont hasn't loaded yet inside the Telegram
WebView).

| Style      | Size | Line height | Weight | Use                                                                                 |
| ---------- | ---- | ----------- | ------ | ----------------------------------------------------------------------------------- |
| Display    | 28px | 36px        | 700    | Hero numbers: accuracy %, CEFR level letter on Placement Result                     |
| H1         | 24px | 32px        | 700    | Screen titles (Learn, Module, Lesson Result)                                        |
| H2         | 20px | 28px        | 700    | Section headers within a screen, card titles                                        |
| H3         | 17px | 24px        | 600    | Sub-headers, lesson/module titles inside list items                                 |
| Body       | 16px | 24px        | 400    | Primary reading text, activity prompts, explanations                                |
| Body-small | 14px | 20px        | 400    | Secondary descriptions, meta text, helper copy                                      |
| Label      | 14px | 20px        | 600    | Form labels, option-button text, input labels                                       |
| Caption    | 12px | 16px        | 500    | Timestamps, hints, small status text                                                |
| Button     | 16px | 24px        | 600    | Button labels — same size as Body but semibold, for tap affordance without shouting |

Mobile readability is the priority: nothing below 12px anywhere, body
copy never below 16px (14px is reserved for secondary/meta text only).

## 4. Spacing system

Base unit **4px**. Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`
(`--space-1` … `--space-16`, named by multiple of the base unit).

| Context                                                       | Value                                                       | Token                                                                                                                  |
| ------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Screen horizontal padding                                     | 16px                                                        | `--space-4` (matches the existing `.app-content`/`.onboarding-screen` padding already in the codebase — no regression) |
| Section spacing (between major vertical sections on a screen) | 24px                                                        | `--space-6`                                                                                                            |
| Card internal padding                                         | 16px                                                        | `--space-4`                                                                                                            |
| Gap between cards in a list                                   | 12px                                                        | `--space-3`                                                                                                            |
| Component-internal gap (icon + label, etc.)                   | 8px                                                         | `--space-2`                                                                                                            |
| Bottom navigation content height                              | 56px                                                        | fixed, not on the spacing scale                                                                                        |
| Bottom navigation safe area                                   | `env(safe-area-inset-bottom)` added as extra bottom padding | required — current CSS has none (flagged in the audit)                                                                 |
| Max content width                                             | 480px, centered                                             | matches the existing `.onboarding-screen`/`.placement` convention already in the codebase                              |

Telegram viewport consideration: never assume a fixed viewport height —
Telegram's own header/chrome height varies by client and platform, and
the WebView can resize when the keyboard opens. Layouts must be built
with normal document flow + `min-height: 100vh` on the outer shell (as
today), not fixed-height calculations.

## 5. Shape language

| Element                                                  | Radius                  | Token                                                         |
| -------------------------------------------------------- | ----------------------- | ------------------------------------------------------------- |
| Card                                                     | 16px                    | `--radius-card`                                               |
| Button                                                   | 12px                    | `--radius-button`                                             |
| Chip / tag                                               | 999px (pill)            | `--radius-chip` — the one deliberate pill shape in the system |
| Input                                                    | 12px                    | `--radius-input`                                              |
| Bottom sheet                                             | 20px (top corners only) | `--radius-sheet`                                              |
| Icon container (colored icon slot, e.g. in `StreakCard`) | 10px                    | `--radius-icon-container`                                     |

Buttons and cards are **rounded, not pill-shaped** — this is the
deliberate line against the "Duolingo clone" risk flagged in the audit.
Chips are the only pill-shaped primitive, reserved for small tag-like
elements where a pill reads as a label, not a call to action.

## 6. Component inventory (V1)

Specification only — not implemented yet. Each entry: purpose,
variants, states, sizing, behavior, color usage. Components whose data
does not exist in the current Phase 0–6 API are marked **(data not yet
available)** — they are specified now for design consistency, but
`PAGE_STRUCTURE_V1.md` does not place them on any current screen until
that data genuinely exists (see that document's "Real data" notes).

### PrimaryButton

- **Purpose**: the one main action on a screen (Continue, Start Lesson, Check).
- **Variants**: default (filled `--color-primary`).
- **States**: default, pressed (`--color-primary-pressed`, scale 0.97), disabled (`--color-disabled` fill, `--color-disabled-text` label), loading (label replaced by a small inline spinner, button stays same size).
- **Sizing**: full-width by default, 48px min height, `--radius-button`, `Button` type style, `--color-text-on-primary` label.
- **Behavior**: never disabled without a visible reason nearby (e.g. "select an answer first" implied by context, not a tooltip).

### SecondaryButton

- **Purpose**: secondary action alongside a primary one (e.g. "Back" next to "Continue").
- **Variants**: outlined — 1.5px `--color-border`, transparent fill, `--color-text-primary` label.
- **States**: default, pressed (`--color-surface-secondary` fill), disabled.
- **Sizing**: same height/radius as PrimaryButton; can share a row with it (flex, gap 12px).

### TextButton

- **Purpose**: low-emphasis action (e.g. "Skip", "Start Again" as a secondary option under a primary CTA).
- **Variants**: text-only, `--color-primary` label, no border/fill.
- **States**: default, pressed (opacity 0.7).
- **Sizing**: no fixed height beyond comfortable tap padding (min 44px tap target even though the visible label is small).

### IconButton

- **Purpose**: single-icon actions (e.g. a future close/back button not covered by Telegram's own chrome).
- **Variants**: ghost (transparent, icon in `--color-text-primary`), filled (`--color-surface-secondary` circle background).
- **States**: default, pressed (opacity 0.7 or background darken).
- **Sizing**: 40×40px tap area minimum, `--radius-icon-container` if filled.

### Card

- **Purpose**: base surface primitive everything else (LessonCard, ModuleCard, …) builds on.
- **Variants**: default (`--color-surface`, `--color-border` hairline, `--radius-card`), secondary (`--color-surface-secondary`, no border), pink (`--color-secondary-pink-light`, for supporting/editorial content).
- **States**: default, pressed (subtle scale 0.98 if the whole card is tappable), disabled/locked (reduced opacity ~0.6).
- **Sizing**: internal padding `--space-4`; shadow subtle (`0 1px 2px rgba(0,0,0,0.04)`), never heavy drop shadow.

### LessonCard

- **Purpose**: one lesson inside a Module's lesson list.
- **Variants**: available, in-progress, completed (see StatusBadge).
- **States/behavior**: tap → Lesson Preview. Shows title, lesson type label, `StatusBadge`.
- **Color usage**: completed uses `--color-primary-light` as a subtle card tint; available/in-progress use default Card surface.

### ContinueLearningCard

- **Purpose**: **approved as the primary, dominant element of Today.**
  Core product principle: the user should not need to decide what to
  learn next — this card decides for them.
- **Data note**: resolved by a new, minimal, read-only API extension
  (data contract only, not implemented yet — see
  `PAGE_STRUCTURE_V1.md` §16 for the exact contract). No new
  recommendation algorithm, no write behavior, no Phase 7 logic —
  deterministic resolution over existing curriculum order and
  `user_lesson_progress`/`learning_sessions` data only.
- **Variants**: "continue" (resumes an in-progress session), "start
  next" (no in-progress session — suggests the next not-completed
  lesson in curriculum order), "none" (everything completed — card is
  replaced by the Learn fallback CTA, per `PAGE_STRUCTURE_V1.md` §16).
- **Sizing**: full-width, prominent — the largest, first-focused card on
  Today, `--color-primary` for its CTA and a light green or white
  surface.
- **Color usage**: `--color-primary-light` background, `--color-primary`
  CTA button inside.

### ProgressBar

- **Purpose**: linear progress — used inside a lesson session
  (`current/total` activities), and as a small variant for the module
  progress shown under `ContinueLearningCard` on Today (see
  `PAGE_STRUCTURE_V1.md` §16 — "`N` of `M` lessons in this module,"
  sourced from the same data contract as `ContinueLearningCard`, not a
  separate query).
- **Variants**: default (green fill on a light track, lesson-session
  size), compact (thin, small-label variant for the Today module-progress
  line), segmented (discrete steps, e.g. onboarding's 4 steps).
- **States**: filling (animated width transition), complete (full green).
- **Color usage**: track `--color-surface-secondary`, fill `--color-primary`.

### CircularProgress

- **Purpose**: compact progress indicator for a smaller space (e.g. a module's completion ring, or the placement result's accuracy).
- **Variants**: small (24px, e.g. inline module ring), large (96px+, e.g. Lesson Result hero).
- **Color usage**: track `--color-surface-secondary`, arc `--color-primary`; large variant shows a numeric label centered.

### SkillProgress

- **Purpose**: shows the four placement skills (Vocabulary/Grammar/Reading/Active English) as horizontal bars — **exactly the data `PlacementResult` already uses**, not a new metric.
- **Data note**: this is a one-time snapshot from the placement test, not continuously updated mastery — must always be labeled as such wherever it's reused (e.g. if surfaced on a future Profile screen), never implied to be "live."
- **Sizing**: label + bar + percentage per row, 4 rows.
- **Color usage**: bar fill `--color-primary`, track `--color-surface-secondary`.

### StreakCard — **FUTURE, not in V1**

- **Purpose**: shows daily-learning consistency.
- **Data note**: **approved decision — streak is not available in real Phase 0–6 data.** No streak concept exists anywhere in the current schema or API. This component is documented purely as a future concept, kept here only in case it's useful later — **it is not rendered on any current V1 screen**, and no streak value (real or invented) appears anywhere in this UI.
- **Variants (for future use)**: active streak (flame/dot icon + day count), no streak yet (neutral, inviting copy, not guilt-inducing).
- **Color usage**: `--color-secondary-pink-light` surface (a supporting/pink moment, not a green "primary" claim) with `--color-text-primary` count.

### WordOfDayCard — **FUTURE, not in V1**

- **Purpose**: a small daily vocabulary moment.
- **Data note**: **approved decision — Word of the Day is not backed by any Phase 0–6 data or logic.** Documented purely as a future concept, kept here only in case it's useful later — **it is not rendered on any current V1 screen**, and no content (real or invented) is shown in its place.
- **Color usage**: `--color-secondary-pink-light` surface, matching StreakCard's supporting/editorial tone.

### ModuleCard

- **Purpose**: one module inside the Learn path.
- **Variants/states**: same available/in-progress/completed language as LessonCard, but computed from the module's lessons in aggregate (see `PAGE_STRUCTURE_V1.md`'s Learn section for the exact, honest rule).
- **Sizing**: full-width row, title + lesson-count meta + status.

### ActivityCard

- **Purpose**: the container for one lesson activity (InfoCard/GrammarCard/MultipleChoice/FillGapChoice/TypedRecall/SentenceBuild content sits inside this shared frame).
- **Sizing**: fills the available screen content area below the lesson header; one per screen, per the existing "one activity, one screen" architecture (kept, not changed).
- **Color usage**: `--color-surface`, generous internal padding (`--space-6` vertical) so the activity content itself dominates.

### AnswerOption

- **Purpose**: a single selectable option (multiple choice, fill-gap).
- **States**: default (`--color-surface`, `--color-border`), selected (`--color-primary-light` fill, `--color-primary` 2px border), correct (post-answer: `--color-success-surface`, `--color-success` border + check icon), incorrect (post-answer: `--color-error-surface`, `--color-error` border + cross icon), disabled (after answering, non-selected options dim slightly).
- **Sizing**: min height 52px (unchanged from the current implementation — already meets the 44px minimum), full width, `--radius-button`-consistent rounding.

### FeedbackPanel

- **Purpose**: the correct/incorrect banner shown after answering.
- **Variants**: correct (`--color-success-surface`, `--color-success` icon+text, short affirming copy), incorrect (`--color-error-surface`, `--color-error` icon, correct answer + explanation, supportive tone — see Motion section for what NOT to do here).
- **Behavior**: appears below the activity, pushes the Continue button down (no modal/overlay — stays in-flow so the user always sees the full context).

### Chip

- **Purpose**: small selectable or informational tag — currently used conceptually for onboarding goal selection; reusable later for topic tags if/when that data is exposed via the API (it currently is not — `learning_items.topic` is not in any public DTO).
- **Variants**: selectable (toggle state), static/informational (label + optional icon, no interaction).
- **Sizing**: compact, `--radius-chip` (pill), `Label` type.
- **Color usage**: default `--color-surface-secondary`; selected `--color-primary-light` fill + `--color-primary` text/border; informational variant may use `--color-secondary-pink` fill for a softer, non-primary tag.

### StatusBadge

- **Purpose**: the Completed/In progress/Available indicator on Lesson/Module cards — replaces today's plain inline text on ModuleDetail.
- **Variants**: completed (check icon + `--color-primary`), in-progress (dot/partial-ring icon + `--color-text-secondary`), available (no badge, or a neutral outline "Start" label).
- **Sizing**: small, inline with the card's title row — must be a distinct visual element, not text appended after a `·` separator (fixes the audit's finding).

### BottomNavigation

- **Purpose**: persistent navigation between the currently implemented
  top-level destinations.
- **Data/scope note**: **approved decision — V1 shows exactly 2 tabs:
  Today and Learn.** Review, Friends, and Profile are not implemented in
  Phase 0–6 and are **not shown at all** — no disabled state, no
  "Coming soon" tab. They are added back to this component once those
  screens are real, in a future phase; this is a scope note, not a
  visual variant to build now. See `PAGE_STRUCTURE_V1.md` §0.
- **Sizing**: 56px content height + safe-area padding, icon + label per
  tab. With only 2 tabs, do not stretch them to fill the full width
  artificially — keep normal tab width and center the pair, so the bar
  doesn't read as a broken 5-tab layout with 3 missing items.
- **States**: active tab uses `--color-primary` for icon+label; inactive
  tab uses `--color-text-secondary`.

### TopBar

- **Purpose**: optional in-screen header for screens that need a title and/or back action beyond Telegram's own chrome (e.g. Module Detail, Lesson Preview).
- **Variants**: title-only, title + back action.
- **Sizing**: 56px height, `H2` title, left-aligned.

### SectionHeader

- **Purpose**: a heading + optional trailing action for a section within a screen (e.g. "Modules" above the Learn list — currently absent, screens jump straight into content).
- **Sizing**: `H2` label, optional `TextButton` trailing action, `--space-3` bottom margin before the section's content.

### EmptyState

- **Purpose**: replaces "just an empty list" (e.g. B1/B2 in Learn today) with an honest, calm message.
- **Sizing/behavior**: centered icon or none, `H3` message, optional `Body-small` supporting line — never invents content that isn't coming.

### ErrorState

- **Purpose**: replaces raw `{err.message}` text (flagged in the audit) with a consistent, human message + retry.
- **Sizing/behavior**: centered, `Body` message (mapped from error codes to plain language, not raw fetch errors), `SecondaryButton` "Try again".

### LoadingState

- **Purpose**: replaces the bare `Loading…` text used everywhere today.
- **Variants**: skeleton (preferred for list/card-heavy screens: Learn, Module, Lesson Preview), simple spinner (for short, unpredictable waits like auth bootstrap).
- **Color usage**: skeleton blocks in `--color-surface-secondary` with a subtle shimmer.

### ResultSummary

- **Purpose**: the Lesson Result (and, by extension, Placement Result) content block — count, correct, accuracy.
- **Sizing**: `CircularProgress` (large) for accuracy + `Body` lines for counts, `Display` only for the headline number.
- **Color usage**: `--color-primary` for the accuracy ring/number; no red anywhere on a result screen even for a low score — this is a summary, not a punishment (matches the "mistakes must not feel punitive" principle).

### LevelBadge

- **Purpose**: shows a CEFR level (A1/A2/B1/B2) compactly — Placement
  Result, Learn's header (per the audit's finding that it's currently
  missing there), and now Today (see `PAGE_STRUCTURE_V1.md` §16 — real
  data, already returned by `GET /me`, no new query needed).
- **Sizing**: small pill or rounded-square badge, `Label` weight.
- **Color usage**: `--color-primary-light` fill, `--color-primary` text.

## 7. Motion principles

Short and functional — motion confirms an action happened, it never
performs for its own sake. No confetti, no particle bursts, no
multi-second celebration sequences (the audit's Duolingo-clone risk
applies here too).

| Moment             | Motion                                                                                                                                                                | Duration            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Button press       | scale to 0.97, back to 1.0 on release                                                                                                                                 | ~100ms              |
| Answer selection   | border + background transition to `--color-primary`/`--color-primary-light`                                                                                           | ~150ms              |
| Correct answer     | `FeedbackPanel`/`AnswerOption` border+background fade to success colors, small check-icon fade-in; optional Telegram `HapticFeedback.notificationOccurred('success')` | ~150–200ms          |
| Incorrect answer   | color transition only (border+background to error colors) — **no shake, no red flash**                                                                                | ~150–200ms          |
| Progress update    | progress bar width transition                                                                                                                                         | ~250–300ms ease-out |
| Lesson completion  | single restrained scale-in of the result icon/number — no confetti                                                                                                    | ~200ms              |
| Screen transitions | simple crossfade between routes                                                                                                                                       | ~200ms              |

## 8. Localization principles

Initial UI language: **Russian**. Learning content: **English**, always
— the target language never gets translated away.

| Category                                                                                 | Language                                                     | Example                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| System UI (buttons, navigation, status, errors)                                          | Russian                                                      | "Продолжить", "Следующий урок", "Твой прогресс"       |
| Learning content (words, examples, module/lesson names in the curriculum, grammar terms) | English                                                      | "Me & Introductions", "Present Simple", "opportunity" |
| Translations/explanations _of_ that content                                              | Russian (from `*_localizations` tables, already implemented) | "избегать" as the translation shown for "avoid"       |

**Rule**: if the string is _about_ using the product, it's Russian. If
the string _is_ the English the user is learning, it stays English. This
is a hard boundary, not a per-string judgment call — a component never
mixes the two roles in one label. The architecture (React components
reading from an i18n dictionary for system UI, `interfaceLanguage`-keyed
content lookups for learning material — the latter already implemented)
supports adding further interface languages later without touching
learning-content data.
