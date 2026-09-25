# Automated preview QA

`pnpm run qa` (from `apps/web`) launches Chromium at a 390×844 mobile
viewport, drives the preview frontend, and saves screenshots +
`findings.json` to `artifacts/qa/` at the repo root (gitignored —
regenerated every run, not committed).

```
pnpm --filter @english-level/web run qa
# or, from apps/web:
pnpm run qa
```

Point it at a different deploy with `QA_BASE_URL`:

```
QA_BASE_URL=https://english-level-web-production.res-creator.workers.dev pnpm run qa
```

## Why it can't reach Today/Course/My English/My Space (yet)

Those four screens aren't behind `<RequireAuthenticated>` in
`App.tsx`, but each of them calls an authenticated API endpoint —
outside a real Telegram session that call 401s and the screen shows
its own generic `ErrorState`, never the real content. This is correct,
intentional fail-closed behavior
(`apps/web/src/auth/resolveInitData.ts`): a production build (which is
what `vite build --mode preview` produces) never signs or sends a dev
fixture `initData`, only real Telegram traffic authenticates.

The one flow this script CAN drive end-to-end without any auth is the
pre-account `/demo` flow — a real lesson-shaped interaction (dialogue
bubbles, a word-bank activity, CTA, feedback) that exists specifically
to work with no account. It is not the real curriculum Session/Mission
though, so `mission-result.png` here is Demo Result, not a real
SessionResult success/failure state.

## What a minimal harness for the real authenticated flow would need

Investigated, not built — this needs your decision first, not mine:

**Option A — run the existing dev-mock auth path, just on a
compatible runtime.** The codebase already has a safe, local-only auth
bypass built for exactly this
(`apps/web/src/auth/devTelegramFixture.ts`): in a `vite dev` build,
with no real Telegram present, it signs a mock `initData` with a
fixture token that _only_ the local (unnamed) API environment trusts
(`apps/api/wrangler.toml`'s default `TELEGRAM_BOT_TOKEN`) — preview and
production intentionally have no matching secret, so this can never
authenticate against a real deployment. Pointing this QA script at
`http://localhost:5173` (via `QA_BASE_URL`) while `pnpm dev` runs would
reach every screen, no backend change needed.

The blocker is this machine: `wrangler dev` requires the `workerd`
runtime (macOS 13.5+), and this Mac is on 12.6 — confirmed by both this
repo's own `README.md` ("Known local limitation") and by trying it.
Chromium itself needed an older pinned Playwright (`1.44.0`; the
current `1.6x` line has also dropped macOS 12 support) — same root
cause, different tool. So Option A needs either a newer macOS/Linux
machine or a Linux CI runner to run `pnpm dev` on; I can't do it from
here.

**Option B — a narrow, preview-only test-auth endpoint.** Same pattern
already used for `POST /api/v1/my/reset` (gated by
`ENVIRONMENT === "preview"`, absent from production): a new endpoint
that issues a real session for a seeded QA user, authenticated by a
separate secret (e.g. `QA_TEST_TOKEN`, `wrangler secret put ... --env
preview`) instead of a Telegram signature. This is a real backend/API
change and needs sign-off before it gets added — it wasn't added in
this round.

## What's checked today

- No horizontal overflow at the 390px viewport.
- No visible button sitting past the viewport bottom at rest.
- The Demo's word-bank activity: the correct token exists and is
  clickable (not just displayed).
- Dialogue bubble order: the NPC line precedes the learner's own line.
- Whether the coded `SceneBackdrop` SVG fallback is still what's
  rendering behind the photoreal Kvo/cast art (a real mismatch once
  one side has real art and the other doesn't).
- That the four authenticated screens fail closed outside Telegram
  (they do — just via a generic error, not an auth-specific one; see
  `findings.json`).

Extend `qa/run.ts` directly — it's a flat script, not a framework.
