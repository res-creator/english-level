# English Level

Telegram Mini App for structured English learning. This repo currently
covers **Phase 0** (monorepo/app shell) and **Phase 1** (database
foundation + basic user data model) — no product features (onboarding,
lessons, SRS, streaks, Duo, ...) yet. See [`CLAUDE.md`](./CLAUDE.md) for
the full product brief and architecture principles, and
[`docs/database.md`](./docs/database.md) for the Phase 1 schema.

## Project structure

```
apps/
  web/                 React + Vite frontend (the Telegram Mini App)
  api/                 Cloudflare Worker backend (Hono)
    src/db/            D1 binding types, Db interface, D1 adapter, ID helper
    src/repositories/  typed data-access layer (users, settings, acquisition, levels)
    test/              Phase 1 data-layer tests (node:sqlite + node:test)
packages/
  contracts/           Zod schemas shared between web and api
  shared/               Cross-cutting types/constants
  learning-engine/      Curriculum/mastery/SRS domain logic (empty stub)
migrations/            D1 schema migrations (0001_init.sql: levels, users, user_settings, user_acquisition)
seeds/                 Seed data for local/dev D1 (empty for now — Phase 1's only seed data is the levels rows in the migration itself)
docs/                  database.md (Phase 1 schema); more to come
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

| App        | File               | Committed?      | Purpose                                   |
| ---------- | ------------------ | --------------- | ----------------------------------------- |
| `apps/web` | `.env.example`     | yes             | documents available variables             |
| `apps/web` | `.env.development` | yes             | default `VITE_API_BASE_URL` for local dev |
| `apps/web` | `.env.local`       | no (gitignored) | personal local overrides                  |
| `apps/api` | `wrangler.toml`    | yes             | non-secret Worker config, per environment |

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

No secrets are required to run Phase 0 or Phase 1 locally.

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
lets the app run normally in a browser during development.

## Scripts

Run from the repo root (they fan out to all workspace packages):

| Script              | What it does                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm dev`          | run api + web dev servers together                                                             |
| `pnpm dev:web`      | run only the frontend dev server                                                               |
| `pnpm dev:api`      | run only the backend dev server                                                                |
| `pnpm build`        | typecheck + build every package                                                                |
| `pnpm typecheck`    | `tsc --noEmit` in every package                                                                |
| `pnpm test`         | run tests in every package that defines one (currently: `apps/api`'s Phase 1 data-layer tests) |
| `pnpm format`       | format the repo with Prettier                                                                  |
| `pnpm format:check` | check formatting without writing                                                               |

## Routes (placeholders only)

`/`, `/today`, `/learn`, `/review`, `/friends`, `/profile` — `/` redirects
to `/today`. All five nav destinations render a bottom navigation bar and a
placeholder page; no real content yet.
