# English Level

Telegram Mini App for structured English learning. This repo currently
covers **Phase 0** (monorepo/app shell), **Phase 1** (database foundation

- basic user data model), **Phase 2** (Telegram Mini App authentication +
  `GET /api/v1/me`), **Phase 3** (onboarding preference collection, ending
  at a placement handoff), **Phase 4** (a real, semi-adaptive placement test
  producing a verified CEFR level), **Phase 5** (a curriculum/content
  data model with a small original A1/A2 sample and read-only APIs), and
  **Phase 6** (a lesson execution engine: sessions, generated activities,
  server-side grading, lesson completion) — no mastery, SRS, streaks, or
  Duo yet. See [`CLAUDE.md`](./CLAUDE.md) for the full product brief and
  architecture principles, [`docs/database.md`](./docs/database.md) for
  the Phase 1 schema, [`docs/authentication.md`](./docs/authentication.md)
  for the Phase 2 auth flow, [`docs/onboarding.md`](./docs/onboarding.md)
  for the Phase 3 onboarding flow,
  [`docs/placement-test.md`](./docs/placement-test.md) for the Phase 4
  placement test, [`docs/curriculum.md`](./docs/curriculum.md) and
  [`docs/content-authoring.md`](./docs/content-authoring.md) for the
  Phase 5 curriculum/content model, and
  [`docs/lesson-engine.md`](./docs/lesson-engine.md) for the Phase 6
  lesson execution engine.

## Project structure

```
apps/
  web/                 React + Vite frontend (the Telegram Mini App)
    src/telegram/      Phase 0/1: Telegram WebApp wrapper + browser dev mock
    src/auth/          Phase 2: auth bootstrap (AuthProvider), auth API client,
                        dev-only signed-initData fixture
    src/onboarding/    Phase 3: onboarding API client, resume/stage-routing
                        logic, goal/level labels (not a full i18n system)
    src/routes/onboarding/ Phase 3: the 4 onboarding step pages
    src/placement/     Phase 4: placement API client
    src/routes/{Placement,PlacementResult}.tsx Phase 4: the test + result screens
    src/curriculum/    Phase 5: curriculum API client
    src/routes/{Learn,ModuleDetail,LessonPreview}.tsx Phase 5: path/module/lesson screens
    src/lessonEngine/  Phase 6: lesson-session API client + the six activity
                        components + ActivityRenderer (kind -> component)
    src/routes/{LessonSession,LessonResult}.tsx Phase 6: the lesson-session
                        and result screens
  api/                 Cloudflare Worker backend (Hono)
    src/db/            D1 binding types, Db interface, D1 adapter, ID helper
    src/repositories/  typed data-access layer (users, settings, acquisition,
                        levels, sessions, placement questions/attempts/answers,
                        curriculum modules/lessons, learning items, grammar,
                        learning sessions, exercise attempts, lesson progress)
    src/services/      framework-free business logic (authService,
                        onboardingService, placementService, curriculumService,
                        lessonSessionService)
    src/auth/          session cookie config, token hashing, requireAuth middleware
    src/routes/        Hono route modules (auth, onboarding, placement,
                        curriculum, lessonSessions)
    src/content/        Phase 5: seed-content Zod schemas, loader/validator,
                        upsert-statement builder, seed applier
    src/lessonEngine/   Phase 6: activity plan generation, answer grading,
                        internal-to-public DTO mapping — see
                        docs/lesson-engine.md
    scripts/            Phase 5: generateSeedSql.ts (content -> a .sql file
                        for `wrangler d1 execute`)
    test/              data-layer + service tests (node:sqlite + node:test)
packages/
  contracts/           Zod schemas shared between web and api
  shared/               Cross-cutting types/constants + Telegram initData
                         validation/signing (packages/shared/src/telegram.ts)
  learning-engine/      still an empty stub — mastery/SRS domain logic still
                         doesn't exist. Phase 6's lesson *execution* logic
                         lives in apps/api/src/lessonEngine instead (app-local,
                         like src/content/), since it's tightly coupled to the
                         repositories/services layer, not shared with the web app.
migrations/            D1 schema migrations:
                          0001_init.sql     — levels, users, user_settings, user_acquisition
                          0002_sessions.sql — sessions (Phase 2 auth)
                          0003_onboarding.sql — users.onboarding_stage,
                                                users.self_reported_cefr_level
                          0004_placement.sql — placement_{questions,passages,
                                                attempts,answers} + the
                                                placement_v1 question bank
                          0005_curriculum.sql — modules, lessons, learning_items
                                                (+ localizations/examples/patterns/
                                                relations), grammar_patterns
                                                (+ localizations/relations),
                                                lesson_items — schema only, no
                                                content rows (see seeds/content/)
                          0006_lesson_sessions.sql — learning_sessions,
                                                exercise_attempts,
                                                user_lesson_progress (Phase 6
                                                lesson execution — see
                                                docs/lesson-engine.md)
seeds/
  content/              Phase 5 curriculum/content source data (JSON), imported
                        via apps/api/src/content/ — see docs/content-authoring.md
docs/                  database.md (Phase 1 schema), authentication.md (Phase 2
                        auth), onboarding.md (Phase 3 onboarding flow),
                        placement-test.md (Phase 4 placement algorithm),
                        curriculum.md + content-authoring.md (Phase 5),
                        lesson-engine.md (Phase 6 lesson execution engine)
```

`apps/web` depends on `packages/contracts` and `packages/shared` via pnpm
workspace links (`workspace:*`), so shared types stay in sync across the
frontend and backend.

## Requirements

- Node.js 20+
- pnpm, via [Corepack](https://nodejs.org/api/corepack.html) (ships with
  Node). If `pnpm` isn't on your PATH, run `corepack enable` once, or use
  `corepack pnpm <command>` in place of `pnpm <command>` everywhere below.

## Installation

```
pnpm install
```

The first install may ask you to approve build scripts for `esbuild`,
`sharp`, and `workerd` (`pnpm approve-builds` if it doesn't prompt
automatically) — these are required by Vite and Wrangler.

## Running the frontend

```
pnpm dev:web
```

Starts the Vite dev server at http://localhost:5173. Works in a plain
browser tab — no Telegram required (see "Telegram mock mode" below).

## Running the backend

```
pnpm dev:api
```

Starts the Worker locally via `wrangler dev` at http://localhost:8787.

> **Known local limitation:** `wrangler dev` requires the `workerd` runtime,
> which needs macOS 13.5+ (or Linux with glibc 2.35+). On older macOS it
> will fail to start with an "Unsupported macOS version" error. This is an
> environment constraint, not a code issue — the route logic itself can
> still be exercised directly (e.g. `app.request("/api/v1/health")` from
> Node), or deploy to a preview environment to test against a real Worker.
> The same limitation means `wrangler d1 migrations apply` can't be run
> against local D1 on this machine either — see "Database" below for how
> the Phase 1 schema is validated instead.

## Database

The API is configured for a D1 binding named **`DB`** (`apps/api/wrangler.toml`),
available in the Worker as `env.DB`. Schema changes are plain SQL files in
the repo-root `migrations/` folder, applied in order:

- `migrations/0001_init.sql` — `levels` (seeded A1–C1), `users`,
  `user_settings`, `user_acquisition`. See
  [`docs/database.md`](./docs/database.md) for what's in it and why.
- `migrations/0002_sessions.sql` — `sessions`, for Phase 2 auth. See
  [`docs/authentication.md`](./docs/authentication.md).
- `migrations/0003_onboarding.sql` — adds `users.onboarding_stage` and
  `users.self_reported_cefr_level` for Phase 3 onboarding. See
  [`docs/onboarding.md`](./docs/onboarding.md).
- `migrations/0004_placement.sql` — `placement_passages`,
  `placement_questions` (seeded with the 64-question `placement_v1`
  bank), `placement_attempts`, `placement_answers`, for Phase 4. See
  [`docs/placement-test.md`](./docs/placement-test.md).
- `migrations/0005_curriculum.sql` — the curriculum/content schema
  (schema only, no seed rows — see "Curriculum" below). See
  [`docs/curriculum.md`](./docs/curriculum.md).
- `migrations/0006_lesson_sessions.sql` — `learning_sessions`,
  `exercise_attempts`, `user_lesson_progress`, for Phase 6 lesson
  execution. See [`docs/lesson-engine.md`](./docs/lesson-engine.md).

**How migrations will eventually be applied:** once `wrangler dev` can run
on a given machine (or in CI), migrations are applied with:

```
wrangler d1 migrations apply DB --local        # local dev D1
wrangler d1 migrations apply DB --env preview  # preview
wrangler d1 migrations apply DB --env production
```

**Configuring a real D1 database later:** `wrangler.toml` currently has
placeholder `database_id`s (`00000000-...` for local, `REPLACE_WITH_...`
for preview/production) — these are never valid Cloudflare resources.
To point at a real D1 database:

1. `wrangler d1 create english-level-db` (repeat per environment as needed)
2. copy the returned `database_id` into the matching `[[d1_databases]]` /
   `[[env.<name>.d1_databases]]` block in `apps/api/wrangler.toml`
3. run the `wrangler d1 migrations apply` commands above

No real D1 database or Cloudflare credentials are required to work on
Phase 1 locally — see the next paragraph.

**Local-runtime limitation and how Phase 1 was actually validated:** on
this machine, `wrangler dev`/`wrangler d1` can't run at all (see the note
above). Since D1 is SQLite under the hood, the Phase 1 data layer is
instead tested by running the exact same `0001_init.sql` against an
in-memory database via Node's built-in `node:sqlite` module (`apps/api/test/`),
using Node's built-in test runner (`node --test`) — no extra dependencies,
no native builds. This validates the schema and repository logic
directly; it does not substitute for eventually running the same
migration through real `wrangler d1` once available.

## Authentication

The Mini App authenticates by sending Telegram's `initData` to
`POST /api/v1/auth/telegram`, which validates it server-side (see
[`docs/authentication.md`](./docs/authentication.md) for the full
algorithm and session lifecycle) and sets an HttpOnly session cookie.
`GET /api/v1/me` returns the current user for that session; `401` without
one. `POST /api/v1/auth/logout` clears it.

- **`TELEGRAM_BOT_TOKEN`** — server-only secret, read from `env.TELEGRAM_BOT_TOKEN`
  in the Worker. Never sent to Vite, browser code, or API responses.
  - **Local**: set in `apps/api/wrangler.toml`'s default `[vars]` block to a
    fixed, clearly-fake dev value (already committed — it isn't a real
    secret). It exists only so the frontend's Telegram _mock_ (browser dev,
    no real Telegram) can sign a fixture `initData` that passes the exact
    same validation real Telegram traffic goes through.
  - **Preview / production**: must be set with
    `wrangler secret put TELEGRAM_BOT_TOKEN --env <env>` using your real
    bot's token from [@BotFather](https://t.me/BotFather) — never
    committed, and `wrangler.toml` intentionally has no `[env.*]` entry
    for it.
- **Frontend adapter**: `apps/web/src/auth/AuthProvider.tsx` sits on top
  of the existing (Phase 0/1) `apps/web/src/telegram/` wrapper — unchanged
  by Phase 2. On mount it takes `webApp.initData` when running inside real
  Telegram, or (dev builds only, when the Telegram mock is active) a
  fixture signed by `apps/web/src/auth/devTelegramFixture.ts`, posts it to
  `/api/v1/auth/telegram`, then loads `/api/v1/me`. `useAuth()` exposes
  `{ status: "loading" | "authenticated" | "unauthenticated" | "error", user, next }`
  to the rest of the app — see it in action on `/today`.
- **Sessions**: HttpOnly cookie, 30-day expiry, `SameSite=None; Secure`
  over HTTPS (cross-site, since the Mini App and API are different
  origins) or `SameSite=Lax` over local HTTP. Only a SHA-256 hash of the
  session token is stored in D1.
- **Dev vs. production**: the backend has exactly one `initData`
  validation path — there is no bypass branch. Local dev only works
  because of the matching (non-secret) dev token described above; it
  cannot authenticate against preview/production, which require a real
  bot token set as a secret.

## Onboarding

After a successful Telegram login, `next` in the auth response (and
`GET /api/v1/me`'s implied state) routes an authenticated user to
`/onboarding` if their preferences aren't fully collected yet, or
`/placement` once they are. See
[`docs/onboarding.md`](./docs/onboarding.md) for the full flow, stage
model, and resume behavior — in short:

- `GET /api/v1/onboarding`, `PUT /api/v1/onboarding/{goals,daily-time,level}`
  (all behind the same `requireAuth` middleware Phase 2 introduced) collect
  goals, daily study time, and a self-reported (unverified) level guess.
- The backend owns progression via `users.onboarding_stage` — a client
  can't skip a step by calling a later endpoint directly, and going back
  to edit an earlier answer never resets later progress.
- This phase ends at `placement_required`, routing to `/placement` — the
  real Phase 4 placement test (see below). No curriculum/lesson logic
  exists yet.

## Placement test

`/placement` is a real, semi-adaptive test (not a placeholder) that ends
with a verified `users.current_cefr_level` and moves
`onboarding_stage` to `completed`. Full algorithm, scoring, and security
write-up: [`docs/placement-test.md`](./docs/placement-test.md). In short:

- `POST /api/v1/placement/start` (resume-safe — reuses an existing
  in-progress attempt), `GET /api/v1/placement/current` (resume check),
  `POST /api/v1/placement/:attemptId/answer`,
  `GET /api/v1/placement/:attemptId/result` — all behind `requireAuth`,
  all grading server-side, no answer keys ever sent to the client.
- ~15–25 questions across 4 skills (vocabulary, grammar, reading,
  active English), adapting difficulty by whole CEFR bands only after 2
  consecutive same-direction answers — never on a single answer.
- The result (level + 4 independent skill scores + strongest/weakest
  skill) is computed separately from the adaptive sampling, specifically
  to avoid a strong-in-3-skills/weak-in-1 profile being classified
  higher than the evidence supports.
- `self_reported_cefr_level` (Phase 3's unverified onboarding guess) is
  never overwritten — it's returned alongside the verified result for
  comparison.

## Curriculum

`/learn` shows the current user's verified level (from Phase 4's
`users.current_cefr_level`) and its published modules — real curriculum
data, not a placeholder. Full model, seed/import process, and content
policy: [`docs/curriculum.md`](./docs/curriculum.md) and
[`docs/content-authoring.md`](./docs/content-authoring.md). In short:

- **Structure**: `levels -> modules -> lessons -> lesson_items`, where
  `lesson_items` links a lesson to _reusable_ content (`learning_items`
  or `grammar_patterns`) rather than storing a copy — the same item can
  be attached to more than one lesson.
- **Read-only APIs** (all behind `requireAuth`): `GET /api/v1/path`,
  `GET /api/v1/modules/:moduleId`, `GET /api/v1/lessons/:lessonId`. The
  lesson endpoint returns content **structure** only — no session starts,
  no answer processing, nothing is ever marked complete by reading it.
  No fake progress percentages exist anywhere in these responses.
- **Content**: a small original A1/A2 sample (6 modules, 24 lessons, 84
  learning items, 16 grammar patterns) — original wording throughout, no
  commercial textbook content copied. Seeded from JSON files under
  `seeds/content/` via an idempotent upsert import
  (`apps/api/src/content/seedContent.ts`), not baked into the migration.
- Placement's result screen now routes "Continue" to `/learn` instead of
  `/today`, since Learn has real data to show and Today is still a
  placeholder.

## Lesson execution

`/learn/lessons/:lessonId` now has a real "Start Lesson" button. Full
design (session lifecycle, activity generation, grading, idempotency,
retry behavior, replay): [`docs/lesson-engine.md`](./docs/lesson-engine.md).
In short:

- **Sessions, not static exercise rows**: starting a lesson generates a
  full, deterministic activity plan once (`ActivityKind` = `info_card`,
  `grammar_card`, `multiple_choice`, `fill_gap_choice`, `typed_recall`,
  `sentence_build`) and stores it on one `learning_sessions` row. The
  backend is the only source of truth for correctness, position, and
  completion — the frontend never decides any of that.
- **APIs** (all behind `requireAuth`): `POST /api/v1/lessons/:lessonId/start`
  (starts or resumes), `GET /api/v1/sessions/:sessionId` (resume after
  reopening the Mini App), `POST /api/v1/sessions/:sessionId/answer`
  (server-side grading, idempotent on a client-generated `attemptId`),
  `GET /api/v1/sessions/:sessionId/result` (the completed result,
  reconstructed from persisted data — survives a page reload).
- **Completion** updates `user_lesson_progress` (Completed ✓ / In
  progress / Available, now shown on the Module screen) in the same
  transaction as the session completion — same `Db.batch()` integrity
  pattern Phase 4 used for placement finalization.
- Still **no mastery, SRS, Review, Today Engine, streaks, or Duo** — this
  phase is execution of existing content, not a knowledge/retention
  system.

## Running both locally

```
pnpm dev
```

Runs `dev:api` and `dev:web` together (via `concurrently`).

## Health check

```
curl http://localhost:8787/api/v1/health
# {"status":"ok"}
```

The frontend's `/today` page calls this endpoint on load and shows whether
the API is reachable.

## Environment variables

| App        | File               | Committed?       | Purpose                                                                         |
| ---------- | ------------------ | ---------------- | ------------------------------------------------------------------------------- |
| `apps/web` | `.env.example`     | yes              | documents available variables                                                   |
| `apps/web` | `.env.development` | yes              | default `VITE_API_BASE_URL` for local dev                                       |
| `apps/web` | `.env.local`       | no (gitignored)  | personal local overrides                                                        |
| `apps/api` | `wrangler.toml`    | yes              | non-secret Worker config, per environment                                       |
| `apps/api` | `wrangler secret`  | n/a (not a file) | `TELEGRAM_BOT_TOKEN` for preview/production (real secret, see "Authentication") |

- **Local**: `apps/web/.env.development` points at `http://localhost:8787`
  by default; `apps/api` runs with the default (unnamed) Wrangler
  environment.
- **Preview / production**: `apps/api/wrangler.toml` defines `[env.preview]`
  and `[env.production]` blocks. Deploy with
  `wrangler deploy --env preview` / `--env production`. Non-secret config
  goes in those blocks as `vars = { ... }`; secrets are set with
  `wrangler secret put <NAME> --env <env>` and are **never** committed.
  For the frontend, set `VITE_API_BASE_URL` to the deployed Worker URL in
  your hosting provider's environment variable settings (or an
  uncommitted `.env.preview.local` / `.env.production.local` file) rather
  than committing real URLs here.

No real secrets are required to run Phase 0, 1, or 2 locally — the local
`TELEGRAM_BOT_TOKEN` in `wrangler.toml` is a fixed, non-secret dev fixture
(see "Authentication").

## Telegram mock mode

The Mini App only ever talks to Telegram through the wrapper in
`apps/web/src/telegram/`:

- `webapp.ts` reads `window.Telegram.WebApp` when present (i.e. running
  inside real Telegram).
- When it's absent — a plain browser tab, exactly what you get from
  `pnpm dev:web` — it falls back to a mock `TelegramWebApp` object with a
  fake dev user, so the rest of the app never has to know the difference.
- `TelegramProvider` / `useTelegram()` expose the resolved user and an
  `isMock` flag to the rest of the app (used on `/today` to show a "running
  outside Telegram" hint).

No other file reads `window.Telegram` directly — that isolation is what
lets the app run normally in a browser during development. Phase 2's auth
bootstrap (`apps/web/src/auth/`) builds on top of this wrapper rather than
replacing it — see "Authentication" above.

## Scripts

Run from the repo root (they fan out to all workspace packages):

| Script              | What it does                                                                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`          | run api + web dev servers together                                                                                                                                                                             |
| `pnpm dev:web`      | run only the frontend dev server                                                                                                                                                                               |
| `pnpm dev:api`      | run only the backend dev server                                                                                                                                                                                |
| `pnpm build`        | typecheck + build every package                                                                                                                                                                                |
| `pnpm typecheck`    | `tsc --noEmit` in every package                                                                                                                                                                                |
| `pnpm test`         | run tests in every package that defines one (currently: `packages/shared`'s Telegram initData tests, `apps/api`'s data-layer + auth/onboarding/placement/curriculum/lesson-session-service + content-QA tests) |
| `pnpm format`       | format the repo with Prettier                                                                                                                                                                                  |
| `pnpm format:check` | check formatting without writing                                                                                                                                                                               |

## Routes

`/`, `/today`, `/learn`, `/review`, `/friends`, `/profile` — `/` routes by
auth state (see "Onboarding" above) and otherwise falls back to `/today`.
All five nav destinations render a bottom navigation bar. `/learn` (plus
`/learn/modules/:moduleId` and `/learn/lessons/:lessonId`) now shows real
curriculum data (see "Curriculum" above); `/today`, `/review`, `/friends`,
`/profile` remain Phase 0 placeholders.

`/onboarding` (resolves to whichever step is current) and
`/onboarding/{goals,time,level,ready}` are Phase 3's onboarding flow (see
[`docs/onboarding.md`](./docs/onboarding.md)). `/placement` and
`/placement/result/:attemptId` are Phase 4's real placement test and
result screen (see [`docs/placement-test.md`](./docs/placement-test.md)).
`/learn/lessons/:lessonId/session` and `/learn/lessons/:lessonId/result`
are Phase 6's real lesson session and result screens (see "Lesson
execution" above). All of these render full-screen, without the bottom
nav, and require an authenticated session.
