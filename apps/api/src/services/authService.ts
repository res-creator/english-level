import { validateTelegramInitData } from "@english-level/shared";
import type { Db, UserRow } from "../db/types.ts";
import {
  createUser,
  findUserById,
  findUserByTelegramUserId,
  syncTelegramProfile,
} from "../repositories/usersRepository.ts";
import { createDefaultUserSettings } from "../repositories/userSettingsRepository.ts";
import {
  createSession,
  deleteSessionByToken,
  findValidSessionByToken,
  touchSession,
} from "../repositories/sessionsRepository.ts";

export type NavigationIntent = "onboarding" | "placement" | "today";

function navigationIntentFor(user: UserRow): NavigationIntent {
  if (user.onboarding_completed === 1) return "today";
  if (user.onboarding_stage === "placement_required") return "placement";
  return "onboarding";
}

export interface TelegramLoginOptions {
  initData: string;
  botToken: string;
  maxAgeSeconds: number;
  sessionTtlSeconds: number;
}

export interface TelegramLoginResult {
  user: UserRow;
  next: NavigationIntent;
  sessionToken: string;
}

export type TelegramLoginFailure = { code: "invalid_telegram_auth" };

/**
 * Real Telegram clients sometimes send an empty string for an optional
 * field (observed: `last_name: ""` for a user with no last name) instead
 * of omitting the key entirely, the way every test fixture and the dev
 * mock always did. `createUser`/`syncTelegramProfile`'s schemas treat
 * "present but empty" as invalid (`min(1)`), which is correct for
 * directly-supplied input elsewhere — but for Telegram-sourced data,
 * empty and absent both mean "not set" and must be normalized here, at
 * the Telegram-data boundary, before either schema ever sees it.
 */
function emptyToUndefined(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

/**
 * The whole Telegram Mini App login flow, decoupled from HTTP: validates
 * `initData`, creates or syncs the user, creates a session. Framework-free
 * (only depends on `Db`) so it runs unmodified against a real D1 binding
 * or an in-memory `node:sqlite` database in tests.
 */
export async function loginWithTelegramInitData(
  db: Db,
  options: TelegramLoginOptions,
): Promise<
  | { ok: true; result: TelegramLoginResult }
  | { ok: false; error: TelegramLoginFailure }
> {
  const validation = await validateTelegramInitData(
    options.initData,
    options.botToken,
    options.maxAgeSeconds,
  );
  if (!validation.ok) {
    return { ok: false, error: { code: "invalid_telegram_auth" } };
  }

  const telegramUser = validation.user;
  const existing = await findUserByTelegramUserId(db, telegramUser.id);

  let user: UserRow;
  let next: NavigationIntent;

  if (!existing) {
    user = await createUser(db, {
      telegramUserId: telegramUser.id,
      firstName: telegramUser.first_name,
      lastName: emptyToUndefined(telegramUser.last_name),
      username: emptyToUndefined(telegramUser.username),
      interfaceLanguage: telegramUser.language_code ?? "en",
    });
    await createDefaultUserSettings(db, user.id);
    next = navigationIntentFor(user);
  } else {
    user = await syncTelegramProfile(db, existing.id, {
      firstName: telegramUser.first_name,
      lastName: emptyToUndefined(telegramUser.last_name) ?? null,
      username: emptyToUndefined(telegramUser.username) ?? null,
      interfaceLanguage: telegramUser.language_code,
    });
    next = navigationIntentFor(user);
  }

  const { token } = await createSession(db, user.id, options.sessionTtlSeconds);

  return { ok: true, result: { user, next, sessionToken: token } };
}

/**
 * Preview-only: creates (or finds) a demo user and returns a session for
 * it, completely bypassing Telegram initData validation. The demo user has
 * a fixed telegram_user_id so every browser demo gets the same account and
 * can see accumulated progress.
 *
 * This must never be callable outside the preview environment — the route
 * in `routes/auth.ts` gates on `isPreviewEnvironment` before calling this.
 */
const DEMO_TELEGRAM_USER_ID = 999_999_999;

export async function loginDemoUser(
  db: Db,
  sessionTtlSeconds: number,
): Promise<TelegramLoginResult> {
  const existing = await findUserByTelegramUserId(db, DEMO_TELEGRAM_USER_ID);

  let user: UserRow;
  if (!existing) {
    user = await createUser(db, {
      telegramUserId: DEMO_TELEGRAM_USER_ID,
      firstName: "Demo",
      username: "demo_user",
      interfaceLanguage: "ru",
    });
    await createDefaultUserSettings(db, user.id);
  } else {
    user = existing;
  }

  const { token } = await createSession(db, user.id, sessionTtlSeconds);
  return { user, next: navigationIntentFor(user), sessionToken: token };
}

/**
 * Resolves the current user from a raw session token (as read from the
 * session cookie), or null if there isn't a valid session. Touches
 * `last_used_at` on the session as a side effect of a successful lookup.
 */
export async function resolveCurrentUser(
  db: Db,
  sessionToken: string | undefined,
): Promise<UserRow | null> {
  if (!sessionToken) return null;

  const session = await findValidSessionByToken(db, sessionToken);
  if (!session) return null;

  const user = await findUserById(db, session.user_id);
  if (!user || user.status !== "active") return null;

  await touchSession(db, session.id);
  return user;
}

/** Invalidates the session for this raw token, if any. Always safe to call. */
export async function logout(
  db: Db,
  sessionToken: string | undefined,
): Promise<void> {
  if (!sessionToken) return;
  await deleteSessionByToken(db, sessionToken);
}
