import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { createFakeD1 } from "./helpers/fakeD1.ts";
import { app } from "../src/index.ts";
import type { Env } from "../src/env.ts";

/**
 * A router mounted at the app's own root ("/", not "/something") had its
 * blanket `.use("*", requireAuth)` compile to a middleware matching every
 * path in the whole API — not just that router's own routes. It went
 * unnoticed because, until the analytics endpoint, every route mounted
 * after it also wanted auth. `/api/v1/events` doesn't, and surfaced it:
 * every request, including ones for paths that don't exist anywhere,
 * came back 401 instead of reaching its real handler (or a plain 404).
 *
 * These tests exercise the real HTTP layer end to end — real Hono
 * routing and middleware composition, not a service call — because that
 * is exactly the layer the bug lived in and every other test in this
 * suite skips.
 */

function testEnv(sqlite: ReturnType<typeof createTestDb>["sqlite"]): Env {
  return {
    DB: createFakeD1(sqlite),
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ALLOWED_ORIGINS: "http://localhost:5173",
    ENVIRONMENT: "development",
  };
}

test("an unauthenticated request to the public events endpoint succeeds", async () => {
  const { sqlite } = createTestDb();
  const res = await app.request(
    "/api/v1/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "welcome_viewed",
        anonymousId: "routing-test-anon",
      }),
    },
    testEnv(sqlite),
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });

  const row = sqlite
    .prepare("SELECT event_name FROM analytics_events WHERE anonymous_id = ?")
    .get("routing-test-anon") as { event_name: string } | undefined;
  assert.equal(row?.event_name, "welcome_viewed");
});

test("an unknown event name is rejected with 400, not silently dropped or 401", async () => {
  const { sqlite } = createTestDb();
  const res = await app.request(
    "/api/v1/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "not_a_real_event", anonymousId: "x" }),
    },
    testEnv(sqlite),
  );
  assert.equal(res.status, 400);
});

test("a genuinely protected route still requires a session, exactly as before", async () => {
  const { sqlite } = createTestDb();
  const res = await app.request("/api/v1/course", {}, testEnv(sqlite));
  assert.equal(res.status, 401);
});

test("a protected lesson-session route still requires a session, exactly as before", async () => {
  const { sqlite } = createTestDb();
  const res = await app.request(
    "/api/v1/lessons/les_does_not_matter/start",
    { method: "POST" },
    testEnv(sqlite),
  );
  assert.equal(res.status, 401);
});

test("a path that matches no route at all returns 404, never a leaked 401", async () => {
  const { sqlite } = createTestDb();
  const res = await app.request(
    "/api/v1/this-path-matches-nothing",
    {},
    testEnv(sqlite),
  );
  assert.equal(res.status, 404);
});

test("/health stays public, unaffected by any of this", async () => {
  const { sqlite } = createTestDb();
  const res = await app.request("/api/v1/health", {}, testEnv(sqlite));
  assert.equal(res.status, 200);
});
