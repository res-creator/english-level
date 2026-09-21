import test from "node:test";
import assert from "node:assert/strict";
import {
  signTelegramInitData,
  validateTelegramInitData,
} from "../src/telegram.ts";

const TEST_BOT_TOKEN = "test-bot-token:not-a-real-secret";

function fields(overrides: Partial<Record<string, string>> = {}) {
  return {
    query_id: "AAtest",
    user: JSON.stringify({
      id: 12345,
      first_name: "Tanya",
      username: "tanya",
      language_code: "ru",
    }),
    auth_date: Math.floor(Date.now() / 1000).toString(),
    ...overrides,
  };
}

test("valid Telegram initData is accepted", async () => {
  const initData = await signTelegramInitData(fields(), TEST_BOT_TOKEN);

  const result = await validateTelegramInitData(initData, TEST_BOT_TOKEN, 3600);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.user.id, 12345);
    assert.equal(result.user.first_name, "Tanya");
  }
});

test("invalid hash is rejected", async () => {
  const initData = await signTelegramInitData(fields(), TEST_BOT_TOKEN);
  const tampered = initData.replace(/hash=[0-9a-f]+/, "hash=deadbeef");

  const result = await validateTelegramInitData(tampered, TEST_BOT_TOKEN, 3600);

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "invalid_hash");
});

test("tampered user payload is rejected", async () => {
  const initData = await signTelegramInitData(fields(), TEST_BOT_TOKEN);
  // Swap in a different user after signing — the hash no longer matches.
  const tampered = initData.replace(
    encodeURIComponent(
      JSON.stringify({
        id: 12345,
        first_name: "Tanya",
        username: "tanya",
        language_code: "ru",
      }),
    ),
    encodeURIComponent(JSON.stringify({ id: 99999, first_name: "Attacker" })),
  );
  assert.notEqual(tampered, initData);

  const result = await validateTelegramInitData(tampered, TEST_BOT_TOKEN, 3600);

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "invalid_hash");
});

test("expired auth_date is rejected", async () => {
  const twoHoursAgo = Math.floor(Date.now() / 1000) - 2 * 60 * 60;
  const initData = await signTelegramInitData(
    fields({ auth_date: twoHoursAgo.toString() }),
    TEST_BOT_TOKEN,
  );

  const result = await validateTelegramInitData(
    initData,
    TEST_BOT_TOKEN,
    3600, // 1 hour max age
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "expired");
});

test("malformed initData is rejected", async () => {
  const cases = [
    "",
    "not-a-query-string-at-all",
    "auth_date=123&user={bad json",
    "hash=onlyhash",
  ];

  for (const initData of cases) {
    const result = await validateTelegramInitData(
      initData,
      TEST_BOT_TOKEN,
      3600,
    );
    assert.equal(result.ok, false, `expected rejection for: ${initData}`);
  }
});

test("wrong bot token is rejected", async () => {
  const initData = await signTelegramInitData(fields(), TEST_BOT_TOKEN);

  const result = await validateTelegramInitData(
    initData,
    "a-different-bot-token",
    3600,
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "invalid_hash");
});
