# English Level

Telegram Mini App for structured English learning. This is **Phase 0**:
technical foundation only — a working monorepo shell with no real product
features yet. See [`CLAUDE.md`](./CLAUDE.md) for the full product brief and
architecture principles.

## Project structure

```
apps/
  web/                 React + Vite frontend (the Telegram Mini App)
  api/                 Cloudflare Worker backend (Hono)
packages/
  contracts/           Zod schemas shared between web and api
  shared/               Cross-cutting types/constants
  learning-engine/      Curriculum/mastery/SRS domain logic (empty stub)
migrations/            D1 schema migrations (empty for now)
seeds/                 Seed data for local/dev D1 (empty for now)
docs/                  Design notes (empty for now)
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

No secrets are required to run Phase 0 locally.

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

| Script              | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `pnpm dev`          | run api + web dev servers together                           |
| `pnpm dev:web`      | run only the frontend dev server                             |
| `pnpm dev:api`      | run only the backend dev server                              |
| `pnpm build`        | typecheck + build every package                              |
| `pnpm typecheck`    | `tsc --noEmit` in every package                              |
| `pnpm test`         | run tests in any package that defines one (none yet — no-op) |
| `pnpm format`       | format the repo with Prettier                                |
| `pnpm format:check` | check formatting without writing                             |

## Routes (placeholders only)

`/`, `/today`, `/learn`, `/review`, `/friends`, `/profile` — `/` redirects
to `/today`. All five nav destinations render a bottom navigation bar and a
placeholder page; no real content yet.
