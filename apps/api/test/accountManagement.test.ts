import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { createFakeD1 } from "./helpers/fakeD1.ts";
import { app } from "../src/index.ts";
import type { Env } from "../src/env.ts";
import { createUser } from "../src/repositories/usersRepository.ts";
import { createDefaultUserSettings } from "../src/repositories/userSettingsRepository.ts";
import { createSession } from "../src/repositories/sessionsRepository.ts";
import { SESSION_COOKIE_NAME } from "../src/auth/session.ts";
import type { Db } from "../src/db/types.ts";

/**
 * HTTP-level coverage for the two account-lifecycle routes public V1
 * needed: changing settings after onboarding, and real (non-preview)
 * account deletion. Both go through the real Hono app with a genuine
 * minted session, the same way a real request would authenticate —
 * `requireAuth`'s cookie lookup is exactly what's being exercised.
 */

function testEnv(sqlite: ReturnType<typeof createTestDb>["sqlite"]): Env {
  return {
    DB: createFakeD1(sqlite),
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ALLOWED_ORIGINS: "http://localhost:5173",
    ENVIRONMENT: "development",
  };
}

async function signedInUser(db: Db) {
  const user = await createUser(db, {
    telegramUserId: Math.floor(Math.random() * 1_000_000_000),
    firstName: "Test",
  });
  await createDefaultUserSettings(db, user.id);
  const { token } = await createSession(db, user.id, 3600);
  return { user, cookie: `${SESSION_COOKIE_NAME}=${token}` };
}

// --- GET/PATCH /my/settings ------------------------------------------------

test("settings default to onboarding's defaults and can be read back", async () => {
  const { db, sqlite } = createTestDb();
  const { cookie } = await signedInUser(db);
  const res = await app.request(
    "/api/v1/my/settings",
    { headers: { Cookie: cookie } },
    testEnv(sqlite),
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    dailyMinutes: 10,
    dailyReminderEnabled: true,
  });
});

test("the daily goal can be changed after onboarding", async () => {
  const { db, sqlite } = createTestDb();
  const { cookie } = await signedInUser(db);
  const res = await app.request(
    "/api/v1/my/settings",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ dailyMinutes: 15 }),
    },
    testEnv(sqlite),
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    dailyMinutes: 15,
    dailyReminderEnabled: true,
  });
});

test("the daily reminder can be turned off, independent of the goal", async () => {
  const { db, sqlite } = createTestDb();
  const { cookie } = await signedInUser(db);
  const res = await app.request(
    "/api/v1/my/settings",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ dailyReminderEnabled: false }),
    },
    testEnv(sqlite),
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    dailyMinutes: 10,
    dailyReminderEnabled: false,
  });
});

test("an empty settings update is rejected rather than silently doing nothing", async () => {
  const { db, sqlite } = createTestDb();
  const { cookie } = await signedInUser(db);
  const res = await app.request(
    "/api/v1/my/settings",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({}),
    },
    testEnv(sqlite),
  );
  assert.equal(res.status, 400);
});

test("settings are gated by auth exactly like every other /my route", async () => {
  const { sqlite } = createTestDb();
  const res = await app.request("/api/v1/my/settings", {}, testEnv(sqlite));
  assert.equal(res.status, 401);
});

// --- POST /my/account/delete ------------------------------------------------

test("without the confirmation literal, nothing is deleted", async () => {
  const { db, sqlite } = createTestDb();
  const { user, cookie } = await signedInUser(db);
  const res = await app.request(
    "/api/v1/my/account/delete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ confirm: "yes" }),
    },
    testEnv(sqlite),
  );
  assert.equal(res.status, 400);
  const row = sqlite.prepare("SELECT id FROM users WHERE id = ?").get(user.id);
  assert.ok(row, "the account must still exist");
});

test("with the exact confirmation, the account is really gone — works outside preview too", async () => {
  const { db, sqlite } = createTestDb();
  const { user, cookie } = await signedInUser(db);
  const res = await app.request(
    "/api/v1/my/account/delete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ confirm: "УДАЛИТЬ" }),
    },
    testEnv(sqlite), // ENVIRONMENT: "development" — deliberately not preview
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });

  const row = sqlite.prepare("SELECT id FROM users WHERE id = ?").get(user.id);
  assert.equal(row, undefined);
});

test("after deletion, the same session cookie is simply unauthenticated, not an error", async () => {
  const { db, sqlite } = createTestDb();
  const { cookie } = await signedInUser(db);
  await app.request(
    "/api/v1/my/account/delete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ confirm: "УДАЛИТЬ" }),
    },
    testEnv(sqlite),
  );
  const res = await app.request(
    "/api/v1/my/settings",
    { headers: { Cookie: cookie } },
    testEnv(sqlite),
  );
  assert.equal(res.status, 401);
});

test("deleting one account never touches another user's row", async () => {
  const { db, sqlite } = createTestDb();
  const { cookie } = await signedInUser(db);
  const other = await signedInUser(db);

  await app.request(
    "/api/v1/my/account/delete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ confirm: "УДАЛИТЬ" }),
    },
    testEnv(sqlite),
  );

  const row = sqlite
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(other.user.id);
  assert.ok(row, "the other account must be untouched");
});
