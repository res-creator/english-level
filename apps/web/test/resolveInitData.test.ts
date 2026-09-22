import test from "node:test";
import assert from "node:assert/strict";
import { resolveInitData } from "../src/auth/resolveInitData.ts";
import type { TelegramWebApp } from "../src/telegram/types.ts";

function makeWebApp(overrides: Partial<TelegramWebApp> = {}): TelegramWebApp {
  return {
    initData: "",
    initDataUnsafe: {},
    colorScheme: "light",
    platform: "ios",
    ready: () => {},
    expand: () => {},
    ...overrides,
  };
}

test("a real Telegram environment's initData is forwarded as-is", async () => {
  const webApp = makeWebApp({ initData: "query_id=abc&user=%7B%7D" });
  const result = await resolveInitData(webApp, false, false);
  assert.equal(result, "query_id=abc&user=%7B%7D");
});

test("an empty initData from a real Telegram environment does not masquerade as authenticated", async () => {
  const webApp = makeWebApp({ initData: "" });
  const result = await resolveInitData(webApp, false, false);
  assert.equal(result, null);
});

test("outside Telegram in a production build, no initData is produced (fails closed, no dev bypass)", async () => {
  const webApp = makeWebApp({
    initData: "mock_init_data",
    initDataUnsafe: { user: { id: 0, first_name: "Dev" } },
  });
  // isMock: true (no real Telegram present), isDev: false (production
  // build) — must not fabricate an authenticated session.
  const result = await resolveInitData(webApp, true, false);
  assert.equal(result, null);
});

test("a real environment's initData wins even if it happens to look like the mock's shape", async () => {
  // Regression guard for the actual deployed bug: isMock must be driven
  // only by whether window.Telegram.WebApp is real, never by the shape
  // of initData/initDataUnsafe.
  const webApp = makeWebApp({
    initData: "real_from_telegram",
    initDataUnsafe: { user: { id: 0, first_name: "Dev" } },
  });
  const result = await resolveInitData(webApp, false, true);
  assert.equal(result, "real_from_telegram");
});
