import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { createFakeD1 } from "./helpers/fakeD1.ts";
import { app } from "../src/index.ts";
import type { Env } from "../src/env.ts";

/**
 * HTTP-level coverage for the auth gate only — whether `handleTelegramUpdate`
 * actually sends a message for a given body is already covered by
 * `telegramWebhookService.test.ts` with a fake sender, so these bodies are
 * deliberately non-"/start" ones: real delivery would attempt a genuine
 * network call to the Telegram API, which no test here should ever do.
 */

function testEnv(secret?: string): Env {
  const { sqlite } = createTestDb();
  return {
    DB: createFakeD1(sqlite),
    TELEGRAM_BOT_TOKEN: "test-bot-token",
    ALLOWED_ORIGINS: "http://localhost:5173",
    ENVIRONMENT: "development",
    TELEGRAM_WEBHOOK_SECRET: secret,
  };
}

test("a request with no secret header is rejected", async () => {
  const res = await app.request(
    "/api/v1/telegram/webhook",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: { chat: { id: 1 }, text: "hi" } }),
    },
    testEnv("real-secret"),
  );
  assert.equal(res.status, 401);
});

test("a request with the wrong secret is rejected", async () => {
  const res = await app.request(
    "/api/v1/telegram/webhook",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "wrong",
      },
      body: JSON.stringify({ message: { chat: { id: 1 }, text: "hi" } }),
    },
    testEnv("real-secret"),
  );
  assert.equal(res.status, 401);
});

test("with no secret configured at all (e.g. before setWebhook runs), every request is rejected", async () => {
  const res = await app.request(
    "/api/v1/telegram/webhook",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: { chat: { id: 1 }, text: "hi" } }),
    },
    testEnv(undefined),
  );
  assert.equal(res.status, 401);
});

test("the right secret is accepted, and a non-/start update is a safe no-op", async () => {
  const res = await app.request(
    "/api/v1/telegram/webhook",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "real-secret",
      },
      body: JSON.stringify({ message: { chat: { id: 1 }, text: "hi" } }),
    },
    testEnv("real-secret"),
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("a malformed body is still answered 200 rather than retried forever", async () => {
  const res = await app.request(
    "/api/v1/telegram/webhook",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "real-secret",
      },
      body: "not json",
    },
    testEnv("real-secret"),
  );
  assert.equal(res.status, 200);
});
