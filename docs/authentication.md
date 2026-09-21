# Authentication — Phase 2

This describes only what's actually implemented: Telegram Mini App login,
application sessions, and `GET /api/v1/me`. It does not cover onboarding,
placement, or anything past establishing "who is this user."

## Telegram `initData` validation

Telegram signs the Mini App's `initData` with an HMAC-SHA256 derived from
the bot's token, per
[Telegram's documented algorithm](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
`packages/shared/src/telegram.ts` implements this validation with plain
WebCrypto (`crypto.subtle`), so the exact same code runs in the Worker, in
tests, and (for signing only — see below) in the browser dev build.

`validateTelegramInitData(initData, botToken, maxAgeSeconds)`:

1. Parses `initData` as a query string; rejects it (`reason: "malformed"`)
   if `hash`, `auth_date`, or `user` is missing, or `user` isn't valid JSON
   with at least `id`/`first_name`.
2. Recomputes the HMAC hash over every other field (sorted, `key=value`
   joined by `\n`) using the server's `TELEGRAM_BOT_TOKEN`, and compares it
   to the `hash` field with a constant-time comparison. Any mismatch —
   wrong token, tampered hash, or _any_ tampered field (which changes the
   data-check string and therefore the expected hash) — is rejected as
   `"invalid_hash"`.
3. Checks `auth_date` against `maxAgeSeconds` (default: 1 hour, overridable
   via the `TELEGRAM_AUTH_MAX_AGE_SECONDS` env var). Older is rejected as
   `"expired"`.

This validation happens **only** on the backend
(`apps/api/src/services/authService.ts`). The frontend never parses or
trusts Telegram user data itself — it only forwards the opaque `initData`
string Telegram gives it.

## Session lifecycle

`POST /api/v1/auth/telegram` (`apps/api/src/routes/auth.ts`) validates
`initData`, resolves the user (see below), and creates a session
(`apps/api/src/repositories/sessionsRepository.ts`, table `sessions` —
migration `0002_sessions.sql`):

- a 256-bit random token is generated (`crypto.getRandomValues`)
- only its SHA-256 hash is stored in `sessions.token_hash`; the raw token
  is never persisted — it's handed to the client exactly once
- the raw token is set as an **HttpOnly** cookie (`el_session`), so it's
  inaccessible to any frontend JavaScript, including the Mini App's own
- the cookie's `Secure`/`SameSite` attributes are derived from the
  request's protocol (`apps/api/src/auth/session.ts`): over HTTPS
  (preview/production, and any real Telegram Mini App) it's
  `SameSite=None; Secure`, since the Mini App and this API are different
  origins; over local HTTP it falls back to `SameSite=Lax` (frontend and
  backend are both `localhost`, hence same-site, and `SameSite=None`
  without `Secure` is rejected by browsers anyway)
- sessions last 30 days (`SESSION_TTL_SECONDS`) and carry an explicit
  `expires_at`; `findValidSessionByToken` treats an expired row as absent

`GET /api/v1/me` and any future protected route go through
`requireAuth` (`apps/api/src/auth/middleware.ts`): read the cookie, hash
it, look up a non-expired session, load the user, and reject with `401`
if any step fails. Route handlers never re-implement this.

`POST /api/v1/auth/logout` deletes the session row for the current cookie
(if any) and clears the cookie. It's safe to call with no session.

## First-login user creation

If `telegram_user_id` from the validated `initData` doesn't match an
existing user, `authService.loginWithTelegramInitData` creates one via the
Phase 1 `usersRepository`/`userSettingsRepository`:

- a new internal `usr_...` id, `telegram_user_id`, safe profile fields
  (`first_name`, `last_name`, `username`), `interface_language` from
  Telegram's `language_code` (falling back to `"en"`)
- `onboarding_completed = false`, `status = "active"` — untouched, no
  fabricated CEFR level or curriculum state
- a default `user_settings` row (`createDefaultUserSettings`)
- `last_active_at` set to now
- no `user_acquisition` row — Phase 2's login request only carries
  `initData`, with no acquisition source, so nothing is invented here

`next` in the response is `"onboarding"`.

## Repeat-login behavior

If the user already exists, `syncTelegramProfile` updates only
`first_name`, `last_name`, `username`, `interface_language` (when Telegram
provides a `language_code`), and `last_active_at`/`updated_at`. It never
touches `onboarding_completed`, `current_cefr_level`, `status`, or
anything in `user_settings` — a repeat login cannot silently reset
progress or overwrite settings the user has changed. `next` is `"today"`
if `onboarding_completed` is true, otherwise `"onboarding"`.

## `/me` behavior

Returns the same safe DTO shape as the `user` field of the Telegram auth
response (`PublicUser` in `packages/contracts`): `id`, `firstName`,
`username`, `interfaceLanguage`, `timezone`, `currentCefrLevel`,
`onboardingCompleted`. It never includes `telegram_user_id`, `status`,
timestamps, session data, or `initData` — `apps/api/src/dto/userDto.ts`'s
`toPublicUser` is the only place a `UserRow` is turned into a response,
and it only reads the fields above.

## Development mock boundary

Real Telegram always supplies an already-signed `initData` string, so the
frontend never needs to sign anything in production. Local development
outside Telegram is the one case where there's no real `initData` to send
— Phase 0/1's Telegram mock (`apps/web/src/telegram/webapp.ts`) already
exists for exactly this and is untouched by Phase 2.

`apps/web/src/auth/devTelegramFixture.ts` builds a validly-signed mock
`initData` using `signTelegramInitData` (the same function tests use for
fixtures) and a fixed, clearly-non-secret `DEV_TELEGRAM_BOT_TOKEN`. This
is gated two ways:

1. **Code path**: only called when the Phase 0/1 mock is active (no real
   `window.Telegram.WebApp`) _and_ `import.meta.env.DEV` is true. A
   production build opened outside Telegram gets neither branch and is
   simply `unauthenticated` — no fixture is generated, no bypass is
   attempted. `pnpm build`'s output was checked directly: the dev token,
   `"WebAppData"`, and the signing function are entirely absent from the
   production bundle (dead-code-eliminated by Vite/esbuild).
2. **Config**: `DEV_TELEGRAM_BOT_TOKEN` only matches
   `apps/api/wrangler.toml`'s default (local, unnamed) environment
   `[vars] TELEGRAM_BOT_TOKEN`. `[env.preview]`/`[env.production]` have no
   such var — they require a real token via `wrangler secret put
TELEGRAM_BOT_TOKEN --env <env>`. The dev fixture can never
   authenticate against a real deployment, and if a real deployment is
   ever misconfigured with no token set, auth fails (there's no fallback).

Crucially, **the backend has exactly one validation code path** —
`validateTelegramInitData` — used for both real and dev-fixture traffic.
There is no `if (isDev) skip validation` branch anywhere.

## Security assumptions

- `TELEGRAM_BOT_TOKEN` is a server-only secret. It's never sent to the
  frontend, never included in a response body, and the only place it's
  logged would be an explicit bug (nothing in this codebase logs env
  vars).
- Session tokens are bearer credentials: anyone holding the raw cookie
  value can act as that user for the session's lifetime. They're
  transmitted only via an HttpOnly cookie (never in a URL or response
  body) and stored server-side only as a SHA-256 hash.
- `CORS` (`apps/api/src/index.ts`) is now credentialed and restricted to
  an explicit origin allow-list (currently just the local Vite dev
  server) rather than Phase 0/1's wildcard — a wildcard origin is
  rejected by browsers for credentialed requests anyway. The deployed
  Mini App's real origin needs adding to `ALLOWED_ORIGINS` before
  preview/production auth can work end-to-end (see "Unresolved issues" in
  the Phase 2 summary).
- This phase does not implement session revocation-on-demand beyond
  logout (e.g. "log out all devices"), rate limiting on the auth
  endpoint, or replay protection beyond `auth_date` freshness — Telegram's
  own `initData` is single-use in practice (a fresh one is issued each
  Mini App launch), but nothing here explicitly rejects a still-fresh
  `initData` being replayed twice within the freshness window.
