# Automated preview QA

Two separate scripts, for two separate targets. Neither adds any new
auth path — see "Auth" below.

## 1. `qa/run.ts` — against the deployed preview, no auth

```
pnpm --filter @english-level/web run qa
# or, from apps/web:
pnpm run qa
```

Launches Chromium at a 390×844 mobile viewport, drives the deployed
preview frontend, and saves screenshots + `findings.json` to
`artifacts/qa/` at the repo root (gitignored — regenerated every run,
not committed). Point it at a different deploy with `QA_BASE_URL`:

```
QA_BASE_URL=https://english-level-web-production.res-creator.workers.dev pnpm run qa
```

Today/Course/My English/My Space aren't behind
`<RequireAuthenticated>` in `App.tsx`, but each calls an authenticated
API endpoint — outside a real Telegram session that call 401s and the
screen shows its own generic `ErrorState`, never the real content.
Correct, intentional fail-closed behavior
(`apps/web/src/auth/resolveInitData.ts`): a production build (what
`vite build --mode preview` produces) never signs or sends a dev
fixture `initData`, only real Telegram traffic authenticates. This
script documents that (screenshots + a note in `findings.json`) rather
than working around it.

The one flow it CAN drive end-to-end without any auth is the
pre-account `/demo` flow — a real lesson-shaped interaction (dialogue
bubbles, a word-bank activity, CTA, feedback) that exists specifically
to work with no account. It is not the real curriculum Session/Mission
though, so `mission-result.png` here is Demo Result, not a real
SessionResult success/failure state.

## 2. `qa/run-authenticated.ts` — the real curriculum flow, local only

```
pnpm --filter @english-level/web run qa:authenticated
```

Drives Welcome → Demo → onboarding → Placement → Today → Course →
every Session of the first A1 episode → Mission Result, picking
whatever answer is fastest to automate (never a "correct" one — this
checks that the flow, transcript and controls render sanely, not that
the QA account actually learns anything, so the Mission may come back
either passed or failed). Screenshots + `findings-authenticated.json`
go to `artifacts/qa/` alongside the other script's output.

**This only works against a local dev server** (`QA_BASE_URL` defaults
to `http://localhost:5173`), started with `pnpm dev` — see "Auth"
below for why, and `.github/workflows/qa-authenticated.yml` for the
one place that's actually set up to run it (this machine can't; see
that workflow's comments).

### Running it locally

Needs macOS 13.5+ or Linux — `wrangler dev` requires the `workerd`
runtime, which this repo's own root `README.md` already documents as
unsupported on this project's dev Mac.

```
# once, or whenever migrations/seed content change:
cd apps/api && pnpm run migrate:local
node --experimental-strip-types apps/api/scripts/generateSeedSql.ts > /tmp/curriculum_seed.sql
cd apps/api && pnpm exec wrangler d1 execute DB --local --file=/tmp/curriculum_seed.sql

# two terminals:
cd apps/api && pnpm run dev     # http://localhost:8787
cd apps/web && pnpm run dev     # http://localhost:5173

# a third, once both are up:
cd apps/web && pnpm run qa:authenticated
```

### Running the CI job

GitHub → Actions → **Authenticated preview QA (Playwright)** → Run
workflow (manual trigger only — it's not wired to run on push/PR).
Or: `gh workflow run qa-authenticated.yml`. Screenshots and
`findings-authenticated.json` are uploaded as the
`qa-authenticated-artifacts` build artifact (14-day retention).

## Auth

No new auth path exists anywhere in this repo for QA. Both scripts
work within what already exists:

- `qa/run.ts` only ever exercises what a real, unauthenticated visitor
  can reach against the actual deployed preview.
- `qa/run-authenticated.ts` relies entirely on the codebase's existing
  local-only dev-auth fixture
  (`apps/web/src/auth/devTelegramFixture.ts`): in a `vite dev` build
  with no real Telegram present, the app signs a mock `initData` with
  a fixture token that _only_ the local (unnamed) API environment
  trusts (`apps/api/wrangler.toml`'s default `TELEGRAM_BOT_TOKEN`) —
  preview and production intentionally have no matching secret, so
  this can never authenticate against a real deployment. The app signs
  itself in automatically; Playwright never touches an auth token.

A narrower, preview-only test-auth endpoint (mirroring the existing
`POST /api/v1/my/reset` pattern) was considered and explicitly
declined — not added.

## What's checked

`qa/run.ts`:

- No horizontal overflow at the 390px viewport.
- No visible button sitting past the viewport bottom at rest.
- The Demo's word-bank activity: the correct token exists and is
  clickable (not just displayed).
- Dialogue bubble order: the NPC line precedes the learner's own line.
- Regression guard: the old coded `SceneBackdrop` SVG never renders
  behind the photoreal Kvo/cast art again (it used to — fixed; see
  git history).
- That the four authenticated screens fail closed outside Telegram.

`qa/run-authenticated.ts`, on every step of every session plus the
Mission result:

- No horizontal overflow.
- Dialogue bubble order (NPC before user).
- No snake_case-looking internal label leaking into bubble/transcript/
  prompt text (a heuristic, not a content lint — see
  `INTERNAL_LABEL_RE`).
- Word-bank collectability: once a `sentence_build` activity is
  answered, the _real_ correct answer (revealed in the miss panel)
  must be fully assembleable from the token bank that was actually
  shown.
- CTA presence on Today/Course/the result screen.
- The result screen has a visible title.

Extend either script directly — they're flat scripts, not a
framework.
