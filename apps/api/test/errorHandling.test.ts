import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { createFakeD1 } from "./helpers/fakeD1.ts";
import { app } from "../src/index.ts";
import type { Env } from "../src/env.ts";

/**
 * `app.onError` is the entire error-monitoring story for the pilot — no
 * third-party service, just a row in `error_logs` and a safe response.
 * This exercises it exactly the way `routingAuth.test.ts` exercises
 * routing: real HTTP, through the real Hono app, because a handler
 * wired up but never actually triggered proves nothing.
 *
 * To trigger a genuine failure without adding a throwaway route to
 * production code, this wraps the working fake D1 so one specific SQL
 * statement — the analytics insert `/api/v1/events` depends on — throws,
 * while everything else (including the error_logs insert `onError`
 * itself makes) keeps working normally.
 */
function testEnv(sqlite: ReturnType<typeof createTestDb>["sqlite"]): Env {
  return {
    DB: createFakeD1(sqlite),
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ALLOWED_ORIGINS: "http://localhost:5173",
    ENVIRONMENT: "development",
  };
}

function withOneStatementBroken(
  sqlite: ReturnType<typeof createTestDb>["sqlite"],
  breakOn: string,
): D1Database {
  const real = createFakeD1(sqlite);
  return {
    ...real,
    prepare(sql: string) {
      if (sql.includes(breakOn)) {
        throw new Error(`simulated failure for: ${breakOn}`);
      }
      return real.prepare(sql);
    },
  } as unknown as D1Database;
}

test("a route that throws returns a safe 500, never the raw error message", async () => {
  const { sqlite } = createTestDb();
  const env: Env = {
    DB: withOneStatementBroken(sqlite, "INSERT INTO analytics_events"),
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ALLOWED_ORIGINS: "http://localhost:5173",
    ENVIRONMENT: "development",
  };

  const res = await app.request(
    "/api/v1/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "welcome_viewed",
        anonymousId: "will-fail",
      }),
    },
    env,
  );

  assert.equal(res.status, 500);
  const body = await res.json();
  assert.deepEqual(body, { error: "internal error" });
  assert.ok(!JSON.stringify(body).includes("simulated failure"));
});

test("the same failure is durably recorded, with the real message and path", async () => {
  const { sqlite } = createTestDb();
  const env: Env = {
    DB: withOneStatementBroken(sqlite, "INSERT INTO analytics_events"),
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ALLOWED_ORIGINS: "http://localhost:5173",
    ENVIRONMENT: "development",
  };

  await app.request(
    "/api/v1/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "welcome_viewed",
        anonymousId: "will-fail",
      }),
    },
    env,
  );

  const row = sqlite
    .prepare("SELECT source, path, message FROM error_logs LIMIT 1")
    .get() as { source: string; path: string; message: string } | undefined;
  assert.equal(row?.source, "POST");
  assert.equal(row?.path, "/api/v1/events");
  assert.match(row?.message ?? "", /simulated failure/);
});

test("a route that works normally never writes to error_logs", async () => {
  const { sqlite } = createTestDb();
  await app.request(
    "/api/v1/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "welcome_viewed", anonymousId: "fine" }),
    },
    testEnv(sqlite),
  );

  const row = sqlite.prepare("SELECT COUNT(*) n FROM error_logs").get() as {
    n: number;
  };
  assert.equal(row.n, 0);
});
