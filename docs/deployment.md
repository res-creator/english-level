# Deployment — first preview deployment

This covers getting the existing application (Phases 0–6: Telegram auth,
onboarding, placement test, curriculum, lesson execution) onto a real
Cloudflare **preview** deployment, reachable over HTTPS, so it can be
opened as a Telegram Mini App. It is **preparation only** — no Cloudflare
resources are created and nothing is deployed by this change; every
section below ends in either a command you run yourself or a dashboard
action you take yourself.

Production is prepared to the same configuration depth (this document
covers both), but the concrete "next actions" at the end are written for
**preview** first, matching a first beta rollout.

## 1. Chosen deployment architecture

**Two independent Cloudflare Workers, deployed separately, on different
origins:**

- `apps/api` → a Worker with a script (Hono, unchanged), bound to D1 as
  `DB`. Already existed since Phase 1; only CORS became configurable.
- `apps/web` → a **new**, separate Worker that serves the Vite-built SPA
  as static assets (Cloudflare Workers Assets, not Cloudflare Pages, per
  the "must use Cloudflare Workers" requirement) — no Worker script of
  its own, just `[assets]` config with SPA fallback.

Each is connected to this GitHub repository independently via **Cloudflare
Workers Builds**, with its own root directory, build command, and deploy
command (see §4).

## 2. Why this architecture (not one Worker serving both)

The alternative — one Worker serving both the API and the built SPA on
the same origin (via Workers Assets + `run_worker_first` routing) — was
considered and rejected **for this phase** because it is the more
invasive change, not the less invasive one:

- It would require restructuring `apps/api`'s Worker to also serve
  `apps/web/dist`, and coupling the two apps' build order (the API
  Worker's deploy would need the web app already built).
- The codebase is **already built, tested, and documented** for the
  cross-origin case: `apps/api/src/auth/session.ts` explicitly derives
  `Secure`/`SameSite=None` vs `Lax` from the request's protocol because
  "the Mini App and this API are different origins" (its own doc
  comment, present since Phase 2), and `docs/authentication.md` already
  named `ALLOWED_ORIGINS` as the variable to wire up before a real
  deployment. The only actual gap was that CORS was a hardcoded
  `localhost`-only array — now fixed (§6).
- `apps/web` already parameterizes its API origin via a build-time env
  var (`VITE_API_BASE_URL`) specifically so it can point at a different
  deployed origin — this was designed for a split deployment from the
  start, not bolted on now.

**When same-origin would be worth it:** same-origin deployment removes
CORS entirely and lets the session cookie use plain `SameSite=Lax`
instead of `SameSite=None; Secure`, which is a strictly simpler cookie
posture. `SameSite=None; Secure` cross-site cookies are a normal, widely
used pattern for Telegram Mini Apps (Telegram's Mini App WebView is a
modern Chromium-based webview that supports this correctly), so this
isn't expected to cause problems — but if a future issue ever surfaces
around cookies not being sent in the Mini App WebView specifically, the
fix would be to move to the single-Worker/same-origin architecture
described above, not to weaken cookie security. Documented here so it's
not forgotten if that day comes.

## 3. Cloudflare account prerequisites

Before anything below can be executed (by you, not by this change):

1. A Cloudflare account with Workers + D1 enabled (both are available on
   the free tier for this scale).
2. This GitHub repository connected to that Cloudflare account (Workers
   Builds asks you to install/authorize the Cloudflare GitHub App on the
   repo the first time you connect a Worker to it).
3. `wrangler` authenticated locally if you ever want to run any of the
   commands below from a machine instead of purely through the
   dashboard/CI (`wrangler login`) — **not required** for the
   Workers-Builds-driven flow this doc focuses on, only for manual
   `wrangler d1 execute`/`migrations apply` against the **remote**
   database, which does need to run from _some_ machine (this repo's own
   dev machine can do this fine — it's only `wrangler dev`/local D1 that's
   broken here, see §14).

## 4. GitHub → Cloudflare Workers Builds setup

Create **two** Workers Builds projects from the same GitHub repo (Cloudflare
dashboard → Workers & Pages → Create → Workers → _Import a repository_, or
Compute (Workers) → your Worker → Settings → Build → _Connect to Git_ once a
Worker already exists). Field names below match the current Cloudflare
dashboard as of this writing — if a field has been renamed, its purpose
is unambiguous from this table.

### Project 1 — API Worker

| Setting                        | Value                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Root directory                 | `apps/api`                                                                                                      |
| Install command                | `pnpm install`                                                                                                  |
| Build command                  | `pnpm run build` (runs `tsc --noEmit` as a type-check gate; `wrangler deploy` bundles the actual Worker itself) |
| Deploy command                 | `npx wrangler deploy --env preview` (production project: `--env production`)                                    |
| Non-production branch behavior | Preview environment (see §9)                                                                                    |

Cloudflare's monorepo detection runs `pnpm install` from the true
workspace root (where `pnpm-workspace.yaml` lives) even when Root
directory points at a subfolder — this repo already relies on pnpm
workspace links (`workspace:*`) between `apps/api` and
`packages/contracts`/`packages/shared`, so this matters and is exactly
what Cloudflare's monorepo support is for.

### Project 2 — Web Worker

| Setting         | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Root directory  | `apps/web`                                                                   |
| Install command | `pnpm install`                                                               |
| Build command   | `pnpm run build:preview` (production project: `pnpm run build`)              |
| Deploy command  | `npx wrangler deploy --env preview` (production project: `--env production`) |

`pnpm run build:preview` runs `vite build --mode preview`, which loads
`apps/web/.env.preview` — that's what bakes the right `VITE_API_BASE_URL`
into the static bundle for that environment (Vite env vars are
compile-time, not runtime, since this Worker has no server-side script —
see §8).

**Verify before first use:** confirm the installed `wrangler` version (see
`apps/api/package.json`/`apps/web/package.json`, currently `^3.80.0`,
resolving to `3.114.x` in the lockfile) supports `[assets]` /
`not_found_handling` — it does; Workers Assets has been stable since well
before this version. If Cloudflare's own build image pins an older
`wrangler` than the repo's `devDependencies`, the `npx wrangler` in the
deploy command resolves the locally-installed (repo-pinned) version, not
a global one, so this should self-correct.

## 5. D1 database creation

**Not executed by this change.** Run once per environment, from any
machine with `wrangler` authenticated (`wrangler login`):

```
wrangler d1 create english-level-db-preview
wrangler d1 create english-level-db-production   # when ready for production
```

Each command prints a `database_id`. Cloudflare's own dashboard is a
UUID-issuing service — this repo cannot invent a valid one, so
`apps/api/wrangler.toml` currently has an **obvious placeholder**:

```toml
[[env.preview.d1_databases]]
binding = "DB"
database_name = "english-level-db-preview"
database_id = "REPLACE_WITH_PREVIEW_D1_DATABASE_ID"
```

Replace `REPLACE_WITH_PREVIEW_D1_DATABASE_ID` (and the matching
`production` one) with the real id returned above, commit that change,
and Workers Builds' next deploy will pick it up. (`database_name` is
already correctly set — only `database_id` needs replacing.)

## 6. Applying migrations

Existing migrations in `migrations/` are **unchanged** by this task —
`0001_init.sql` through `0006_lesson_sessions.sql`, applied in order.
Once the real `database_id` is in `wrangler.toml` (§5):

```
cd apps/api
pnpm run migrate:preview       # wrangler d1 migrations apply DB --env preview
pnpm run migrate:production    # once ready for production
```

D1 tracks which migrations have already been applied in its own
bookkeeping table, so this is safe to re-run — already-applied migrations
are skipped, not re-executed. This also seeds `levels` (A1–C1, from
`0001_init.sql`) and the full `placement_v1` question bank
(`0004_placement.sql`) automatically, since those are baked into the
migration SQL itself — no separate seed step for those two.

## 7. Seeding curriculum content

The A1/A2 curriculum (`seeds/content/*.json` — modules, lessons, learning
items, grammar patterns) is **not** baked into a migration (too large/data-
driven); it's applied as a separate, idempotent SQL script:

```
cd apps/api
pnpm run seed:generate > /tmp/curriculum_seed.sql
wrangler d1 execute DB --remote --env preview --file=/tmp/curriculum_seed.sql
wrangler d1 execute DB --remote --env production --file=/tmp/curriculum_seed.sql   # once ready
```

**Duplicate-safe by construction**: every statement in the generated SQL
is `INSERT ... ON CONFLICT DO UPDATE` (see
`apps/api/src/content/buildSeedStatements.ts`) — re-running it updates
existing rows in place rather than erroring or duplicating anything. This
is exercised by `apps/api/test/contentSeed.test.ts`
("re-seeding updates existing rows in place" / "running the seed tooling
twice does not duplicate any content"), so it's covered by the local test
suite even though the `--remote` D1 path itself isn't (see §14).

Summary of what's seeded and by what:

| Content                                                          | Seeded by                               | Idempotent?                            |
| ---------------------------------------------------------------- | --------------------------------------- | -------------------------------------- |
| `levels` (A1–C1)                                                 | `0001_init.sql` (migration)             | Migrations are tracked/skip-if-applied |
| `placement_questions`/`placement_passages` (`placement_v1` bank) | `0004_placement.sql` (migration)        | Same                                   |
| A1/A2 modules/lessons/learning items/grammar                     | `seed:generate` + `wrangler d1 execute` | Yes, upsert-based                      |

## 8. Secrets and environment variables

**Inspected usage in the codebase** (`apps/api/src/env.ts` is the single
source of truth for what the Worker actually reads):

| Name                            | Secret?                 | Where used                                                              | Notes                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ----------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`            | **Yes**                 | `apps/api/src/routes/auth.ts` (validates Telegram `initData` signature) | Never sent to the frontend, never logged, never in a response body. Local dev uses a committed **fixture** value that only works with the frontend's dev-mode mock signer — never set a real token in `[vars]`.                                                                                                                                                                  |
| `ALLOWED_ORIGINS`               | No                      | `apps/api/src/index.ts` (CORS allow-list)                               | Comma-separated origin list. New in this change — previously hardcoded to `localhost` only.                                                                                                                                                                                                                                                                                      |
| `TELEGRAM_AUTH_MAX_AGE_SECONDS` | No                      | `apps/api/src/routes/auth.ts`                                           | Optional; defaults to 1 hour if unset. Not currently set anywhere; only override if needed.                                                                                                                                                                                                                                                                                      |
| `VITE_API_BASE_URL`             | No                      | `apps/web/src/lib/apiBaseUrl.ts`                                        | **Build-time**, not a Worker runtime var — baked into the static JS bundle by Vite. Lives in `apps/web/.env.preview`/`.env.production` (committed, non-secret — it's just a URL).                                                                                                                                                                                                |
| `SESSION_SECRET`                | **N/A — doesn't exist** | —                                                                       | This app doesn't use signed/HMAC session cookies. Sessions are a random 256-bit token (`apps/api/src/auth/tokens.ts`), stored **hashed** (SHA-256) in D1, looked up by hash on each request. There is no secret key to compromise if the D1 database is read — only the raw cookie value (never persisted anywhere) authenticates a session. Nothing needs to be added for this. |

**Setting the one real secret**, per environment (never committed, never
put in `[vars]`):

```
wrangler secret put TELEGRAM_BOT_TOKEN --env preview
wrangler secret put TELEGRAM_BOT_TOKEN --env production   # once ready
```

Get the real token from [@BotFather](https://t.me/BotFather) — this is
the actual production bot token, so treat it like any other credential
(this document does not, and will never, include its value).

**Setting the non-secret vars** — already scaffolded in
`apps/api/wrangler.toml` as placeholders under `[env.preview.vars]` /
`[env.production.vars]`; replace `ALLOWED_ORIGINS`'s placeholder with the
real deployed web Worker origin once §9 tells you what it is, and commit
that change (it's not a secret, it belongs in version control same as
`database_name`).

## 9. Deployed origin configuration (CORS + cookies)

This is inherently a **bootstrapping** problem: the API's `ALLOWED_ORIGINS`
needs the web Worker's URL, and (for completeness, though the web Worker
itself doesn't need to know the API's URL beyond `VITE_API_BASE_URL` at
build time) both need to exist before they can reference each other by
real URL. Order of operations:

1. Deploy the **web** Worker first (§4, project 2) — even with a
   placeholder `VITE_API_BASE_URL` in `.env.preview`, it'll deploy fine
   and Cloudflare will assign it a URL:
   `https://english-level-web-preview.<your-subdomain>.workers.dev`.
2. Put that URL into `apps/api/wrangler.toml`'s
   `[env.preview.vars].ALLOWED_ORIGINS`, commit, push — Workers Builds
   redeploys the API Worker automatically. It also gets a URL:
   `https://english-level-api-preview.<your-subdomain>.workers.dev`.
3. Put _that_ URL into `apps/web/.env.preview`'s `VITE_API_BASE_URL`,
   commit, push — Workers Builds rebuilds and redeploys the web Worker
   with the real API origin baked in.

After step 3, both origins are correctly wired to each other. Repeat for
production once ready.

Cookie behavior requires no further changes (§2): both Workers are served
over HTTPS by Cloudflare, so `apps/api/src/auth/session.ts` automatically
issues `Secure; HttpOnly; SameSite=None` cookies — the condition
(`isHttps`) is derived from the live request's protocol, not an
environment flag, so this is already correct for preview and production
alike without any config.

## 10. SPA routing

Handled entirely by `apps/web/wrangler.toml`'s
`not_found_handling = "single-page-application"` (§1) — any request that
doesn't match a real file in the built `dist/` falls back to
`index.html`, and React Router (`apps/web/src/App.tsx`) resolves the
route client-side. This covers every deep-linkable/reloadable route in
the app, including nested ones:

```
/onboarding, /onboarding/goals, /onboarding/time, /onboarding/level, /onboarding/ready
/placement
/placement/result/:attemptId
/learn
/learn/modules/:moduleId
/learn/lessons/:lessonId
/learn/lessons/:lessonId/session
/learn/lessons/:lessonId/result/:sessionId
```

No server-side routing code was needed or added — this is a static-asset
config option, not app logic.

## 11. Telegram BotFather setup (manual, later)

**Not performed by this change.** Once the web Worker has a real HTTPS
URL:

1. Message [@BotFather](https://t.me/BotFather), `/mybots` → select your
   bot.
2. **Menu Button first, for this beta** — Bot Settings → Menu Button →
   _Edit Menu Button URL_ → paste the deployed web Worker URL (e.g.
   `https://english-level-web-preview.<your-subdomain>.workers.dev`).
   This is the fastest way to get a testable Mini App: it's a single URL
   field, takes effect immediately, and is trivial to repoint if the URL
   changes. Use this to validate the whole flow end-to-end first.
3. **Main Mini App, once stable** — `/newapp` (or Bot Settings → Mini
   Apps for an existing bot) → set a short name (e.g. `learn`), title,
   description, and icon, and point it at the same URL. This makes the
   app reachable from the bot's profile and via a stable `startapp` deep
   link (below), independent of the menu button. Do this once the beta
   via the Menu Button has been validated, not before — it involves more
   metadata (icon, description) that isn't relevant to just getting a
   working preview.

**Direct link format**, once the Main Mini App exists with short name
`learn`:

```
https://t.me/<your_bot_username>/learn
https://t.me/<your_bot_username>/learn?startapp=<payload>
```

`startapp` is optional — it's delivered to the Mini App as
`initDataUnsafe.start_param`/parsed out of `initData`, for deep-linking
into a specific screen later (not used by anything in Phases 0–6).

## 12. Post-deployment smoke-test checklist

Run manually after each deploy — deliberately **not** automated, since
several steps require a real Telegram session (`initData` can only be
minted by real Telegram, not faked in a test — the dev mock in
`apps/web/src/auth/devTelegramFixture.ts` is explicitly gated to
`import.meta.env.DEV` and does not run in a production build).

1. **Frontend loads** — open the web Worker's URL in a browser; the app
   shell renders (no blank page / build error).
2. **Health endpoint returns 200** —
   `curl -i https://<api-worker-url>/api/v1/health` → `{"status":"ok"}`.
3. **D1 is reachable** — `GET /api/v1/health` succeeding proves the
   Worker itself is up; confirm D1 specifically via
   `wrangler d1 execute DB --remote --env preview --command "SELECT COUNT(*) FROM levels"`
   (should return 5, one per seeded CEFR level).
4. **Telegram auth endpoint is reachable** —
   `curl -i -X POST https://<api-worker-url>/api/v1/auth/telegram -H "Content-Type: application/json" -d '{"initData":""}'`
   → expect a `400`/`401` (invalid/empty `initData`), **not** a `404` or
   `5xx` — proves routing + the endpoint's validation path are live
   without needing a real Telegram session.
5. **SPA route reload works** — open
   `https://<web-worker-url>/learn/lessons/some-id` directly (or hit
   reload on any deep route) — must render the app, not a static-hosting 404.
6. **Onboarding loads after Telegram login** — open the Menu Button link
   from inside Telegram on a real account, confirm the app authenticates
   and lands on onboarding (or further along, if that account already has
   state).
7. **Placement can start** — from onboarding, reach the placement handoff
   and confirm `POST /api/v1/placement/start` returns a question.
8. **Learn path can load** — `GET /api/v1/path` returns the seeded
   modules for the account's verified level (requires having completed
   placement, or seed a test account's `current_cefr_level` directly).
9. **Lesson session can start** — open a lesson and confirm
   `POST /api/v1/lessons/:lessonId/start` returns a session with a
   `currentActivity`.

## 12a. Preview-only account reset

Preview carries one tool production does not: `POST /api/v1/my/reset`
wipes the signed-in account's learning state so the first-run experience
can be re-tested without a second Telegram account. In the Mini App it
sits at the bottom of **Мой английский**, behind a two-step confirmation.

It is gated twice, and both guards fail closed:

1. **Server** — `ENVIRONMENT` must be exactly `"preview"`. It is set in
   `[env.preview.vars]` only; production leaves it unset, so the route
   answers `404` there and does not advertise its own existence.
2. **Client** — the panel renders only when `import.meta.env.MODE` is
   `"preview"`, i.e. a `vite build --mode preview` bundle.

The request body must carry the literal confirmation
(`RESET_PREVIEW_CONFIRMATION`), so no stray or replayed POST can trigger
it. The reset clears only the caller's own rows, never another account's
and never shared content, and runs in a single transaction. Behaviour is
covered by `apps/api/test/previewReset.test.ts`.

**Never copy `ENVIRONMENT = "preview"` into `[env.production.vars]`.**

## 13. Rollback strategy

- **Application code (either Worker)**: Cloudflare keeps every deployment;
  `wrangler deployments list --env <env>` then
  `wrangler rollback <deployment-id> --env <env>` reverts instantly
  without a rebuild. Equivalently, since deploys are git-triggered,
  reverting the offending commit on `main` and pushing achieves the same
  thing through the normal CI path.
- **D1 schema**: migrations in this repo are forward-only `.sql` files
  (no down-migration convention exists yet). Rolling back a schema change
  means hand-authoring a new migration that undoes it (e.g. dropping a
  column that was added) — there is currently no tooling to auto-reverse
  a migration. Because Cloudflare D1 is production data, a destructive
  rollback migration should only ever be run deliberately, never as part
  of an automated pipeline.
- **Curriculum seed content**: safe to re-run at any time (§7) — it's
  entirely upsert-based, so re-applying an older `seeds/content/` snapshot
  (via `git checkout` + `seed:generate` on that revision) overwrites
  current rows back to that snapshot's values.

## 14. Known older-macOS limitation

Unchanged from every previous phase: this development machine's macOS
version is older than `workerd`'s minimum (13.5+), so `wrangler dev` /
local D1 cannot run here at all. This is exactly why this task routes
deployment through **Cloudflare Workers Builds** (cloud build + deploy on
every push) instead of any workflow that assumes a working local
`wrangler dev` — the whole point of this architecture choice is that
nothing in the path from `git push` to a live HTTPS URL requires running
Wrangler's local runtime on this machine.

**What could be validated locally despite this**, and was:
`wrangler deploy --dry-run` (in both `apps/api` and `apps/web`, for the
default/`preview`/`production` environments — 6 runs total) bundles the
Worker and resolves the full `wrangler.toml` config **without** needing
`workerd`/local D1 — it's pure static validation (config parsing +
esbuild bundling), not a running server. All 6 succeeded: correct
bindings resolved per environment (`DB` with the right placeholder id per
env, `ALLOWED_ORIGINS`/`TELEGRAM_BOT_TOKEN` vars where expected), and
`apps/web`'s dry-run confirms `No bindings found` (correct — it's assets-
only) after a real `vite build`. One warning is **expected and correct**,
not a problem to fix: Wrangler warns that
`vars.TELEGRAM_BOT_TOKEN` exists at the top level but not on
`env.preview`/`env.production` — that's intentional (§8): those
environments get `TELEGRAM_BOT_TOKEN` from `wrangler secret put`, not
from committed `vars`, so it correctly does not appear in the preview/
production dry-run output above. This is as close to "does this config
actually work" as this machine can get without an actual account/deploy.

Beyond that, local verification for this task was the existing full
`typecheck`/`build`/`test`/`format:check` suite, which passed unchanged
(see the end-of-phase report) — none of Phases 0–6's code, tests, or
behavior changed; the two touched application files
(`apps/api/src/env.ts`, `apps/api/src/index.ts`) only made CORS's origin
allow-list configurable instead of hardcoded.
