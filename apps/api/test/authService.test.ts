import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import {
  buildValidInitData,
  TEST_BOT_TOKEN,
} from "./helpers/telegramFixtures.ts";
import {
  loginWithTelegramInitData,
  resolveCurrentUser,
  logout,
} from "../src/services/authService.ts";
import {
  getUserSettings,
  updateUserSettings,
} from "../src/repositories/userSettingsRepository.ts";
import { toPublicUser } from "../src/dto/userDto.ts";

const LOGIN_OPTIONS_BASE = {
  botToken: TEST_BOT_TOKEN,
  maxAgeSeconds: 3600,
  sessionTtlSeconds: 3600,
};

test("first valid authentication creates a user", async () => {
  const { db } = createTestDb();
  const initData = await buildValidInitData({
    id: 111,
    first_name: "Tanya",
    username: "tanya",
    language_code: "ru",
  });

  const login = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData,
  });

  assert.equal(login.ok, true);
  if (!login.ok) return;
  assert.equal(login.result.user.telegram_user_id, 111);
  assert.equal(login.result.user.first_name, "Tanya");
  assert.equal(login.result.user.onboarding_completed, 0);
  assert.equal(login.result.user.status, "active");
  assert.equal(login.result.next, "onboarding");
  assert.ok(login.result.sessionToken.length > 0);
});

test("first valid authentication creates default user_settings", async () => {
  const { db } = createTestDb();
  const initData = await buildValidInitData({ id: 222, first_name: "Anna" });

  const login = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData,
  });
  assert.equal(login.ok, true);
  if (!login.ok) return;

  const settings = await getUserSettings(db, login.result.user.id);
  assert.ok(settings);
  assert.equal(settings?.daily_minutes, 10);
});

test("second authentication returns the same user instead of duplicating it", async () => {
  const { db, sqlite } = createTestDb();
  const first = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData: await buildValidInitData({ id: 333, first_name: "Duo" }),
  });
  assert.equal(first.ok, true);
  if (!first.ok) return;

  const second = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData: await buildValidInitData({ id: 333, first_name: "Duo" }),
  });
  assert.equal(second.ok, true);
  if (!second.ok) return;

  assert.equal(second.result.user.id, first.result.user.id);

  const count = sqlite
    .prepare("SELECT COUNT(*) as n FROM users WHERE telegram_user_id = ?")
    .get(333) as { n: number };
  assert.equal(count.n, 1);
});

test("existing settings are not overwritten on repeat login", async () => {
  const { db } = createTestDb();
  const first = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData: await buildValidInitData({ id: 444, first_name: "Settings" }),
  });
  assert.equal(first.ok, true);
  if (!first.ok) return;

  await updateUserSettings(db, first.result.user.id, { dailyMinutes: 5 });

  const second = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData: await buildValidInitData({ id: 444, first_name: "Settings" }),
  });
  assert.equal(second.ok, true);
  if (!second.ok) return;

  const settings = await getUserSettings(db, second.result.user.id);
  assert.equal(settings?.daily_minutes, 5);
});

test("safe Telegram profile changes update the user, but onboarding/level state is untouched", async () => {
  const { db } = createTestDb();
  const first = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData: await buildValidInitData({
      id: 555,
      first_name: "Old Name",
      username: "old_username",
    }),
  });
  assert.equal(first.ok, true);
  if (!first.ok) return;

  // Simulate onboarding having completed via some later phase's logic —
  // this test only needs to prove login doesn't reset it.
  await db.run("UPDATE users SET onboarding_completed = 1 WHERE id = ?", [
    first.result.user.id,
  ]);
  await updateUserSettings(db, first.result.user.id, { dailyMinutes: 15 });

  const second = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData: await buildValidInitData({
      id: 555,
      first_name: "New Name",
      username: "new_username",
    }),
  });
  assert.equal(second.ok, true);
  if (!second.ok) return;

  assert.equal(second.result.user.first_name, "New Name");
  assert.equal(second.result.user.username, "new_username");
  assert.equal(second.result.user.onboarding_completed, 1);
  assert.equal(second.result.next, "today");

  const settings = await getUserSettings(db, second.result.user.id);
  assert.equal(settings?.daily_minutes, 15);
});

test("resolveCurrentUser returns null without a valid session (routes map this to 401)", async () => {
  const { db } = createTestDb();

  assert.equal(await resolveCurrentUser(db, undefined), null);
  assert.equal(await resolveCurrentUser(db, "not-a-real-token"), null);
});

test("resolveCurrentUser returns the current user with a valid session", async () => {
  const { db } = createTestDb();
  const login = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData: await buildValidInitData({ id: 666, first_name: "Session" }),
  });
  assert.equal(login.ok, true);
  if (!login.ok) return;

  const resolved = await resolveCurrentUser(db, login.result.sessionToken);
  assert.equal(resolved?.id, login.result.user.id);
});

test("logout invalidates the session", async () => {
  const { db } = createTestDb();
  const login = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData: await buildValidInitData({ id: 777, first_name: "Logout" }),
  });
  assert.equal(login.ok, true);
  if (!login.ok) return;

  assert.ok(await resolveCurrentUser(db, login.result.sessionToken));

  await logout(db, login.result.sessionToken);

  assert.equal(await resolveCurrentUser(db, login.result.sessionToken), null);
});

test("no secret/session/raw initData leaks through the public user DTO", async () => {
  const { db } = createTestDb();
  const login = await loginWithTelegramInitData(db, {
    ...LOGIN_OPTIONS_BASE,
    initData: await buildValidInitData({
      id: 888,
      first_name: "Safe",
      username: "safe_user",
    }),
  });
  assert.equal(login.ok, true);
  if (!login.ok) return;

  const dto = toPublicUser(login.result.user);

  assert.deepEqual(Object.keys(dto).sort(), [
    "currentCefrLevel",
    "firstName",
    "id",
    "interfaceLanguage",
    "onboardingCompleted",
    "timezone",
    "username",
  ]);
  for (const forbidden of [
    "telegram_user_id",
    "telegramUserId",
    "status",
    "created_at",
    "updated_at",
    "last_active_at",
    "session",
    "sessionToken",
    "token_hash",
    "initData",
  ]) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(dto, forbidden),
      false,
      `PublicUser must not expose "${forbidden}"`,
    );
  }
});
