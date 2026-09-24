import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { createFakeD1 } from "./helpers/fakeD1.ts";
import { app } from "../src/index.ts";
import type { Env } from "../src/env.ts";

/**
 * `/debug/run-reminders` exists purely because `wrangler dev
 * --test-scheduled` cannot run on the maintainer's machine — it's the one
 * way to fire the exact cron logic on demand against a real preview
 * deployment. Gated exactly like `/my/reset`: HTTP-level tests, because
 * that gating (404 outside preview, 400 without confirmation) lives in
 * routing, not in a service function.
 */

function envWith(overrides: Partial<Env>): Env {
  const { sqlite } = createTestDb();
  return {
    DB: createFakeD1(sqlite),
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ALLOWED_ORIGINS: "http://localhost:5173",
    ENVIRONMENT: "development",
    ...overrides,
  };
}

test("outside preview, the route doesn't exist — 404, not 403", async () => {
  const res = await app.request(
    "/api/v1/debug/run-reminders",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "ЗАПУСТИТЬ" }),
    },
    envWith({ ENVIRONMENT: "development" }),
  );
  assert.equal(res.status, 404);
});

test("production (ENVIRONMENT unset) is also 404", async () => {
  const res = await app.request(
    "/api/v1/debug/run-reminders",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "ЗАПУСТИТЬ" }),
    },
    envWith({ ENVIRONMENT: undefined }),
  );
  assert.equal(res.status, 404);
});

test("in preview, a missing confirmation is rejected with 400", async () => {
  const res = await app.request(
    "/api/v1/debug/run-reminders",
    { method: "POST", headers: { "Content-Type": "application/json" } },
    envWith({ ENVIRONMENT: "preview" }),
  );
  assert.equal(res.status, 400);
});

test("in preview, the wrong confirmation text is also rejected with 400", async () => {
  const res = await app.request(
    "/api/v1/debug/run-reminders",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "yes" }),
    },
    envWith({ ENVIRONMENT: "preview" }),
  );
  assert.equal(res.status, 400);
});

test("in preview, with the exact confirmation, it runs and returns a summary", async () => {
  const res = await app.request(
    "/api/v1/debug/run-reminders",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "ЗАПУСТИТЬ" }),
    },
    envWith({ ENVIRONMENT: "preview" }),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    ok: boolean;
    summary: Record<string, number>;
  };
  assert.equal(body.ok, true);
  // No seeded users in this DB — an empty pass is still a real, complete
  // pass, and proves the route reaches `runDailyReminders` end to end.
  assert.deepEqual(body.summary, {
    candidates: 0,
    sent: 0,
    alreadyActiveToday: 0,
    alreadyRemindedToday: 0,
    nothingToOffer: 0,
    blocked: 0,
  });
});
