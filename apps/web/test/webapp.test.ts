import test from "node:test";
import assert from "node:assert/strict";
import { resolveTelegramWebApp } from "../src/telegram/webapp.ts";

function withWindow<T>(telegram: unknown, fn: () => T): T {
  const original = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = { Telegram: telegram };
  try {
    return fn();
  } finally {
    if (original === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = original;
    }
  }
}

test("a real Telegram.WebApp is preferred over the dev mock when present", () => {
  const realWebApp = {
    initData: "real_query_id=abc&user=%7B%22id%22%3A1%7D",
    initDataUnsafe: { user: { id: 1, first_name: "Real" } },
    colorScheme: "light" as const,
    platform: "ios",
    ready: () => {},
    expand: () => {},
  };

  const { webApp, isMock } = withWindow({ WebApp: realWebApp }, () =>
    resolveTelegramWebApp(),
  );

  assert.equal(isMock, false);
  assert.equal(webApp, realWebApp);
  assert.equal(webApp.initData, realWebApp.initData);
});

test("falls back to the dev mock when window.Telegram is absent (plain browser dev)", () => {
  const { webApp, isMock } = withWindow(undefined, () =>
    resolveTelegramWebApp(),
  );

  assert.equal(isMock, true);
  assert.equal(webApp.initData, "mock_init_data");
  assert.equal(webApp.initDataUnsafe.user?.id, 1);
});

test("falls back to the dev mock when window.Telegram.WebApp is absent", () => {
  const { webApp, isMock } = withWindow({}, () => resolveTelegramWebApp());

  assert.equal(isMock, true);
  assert.equal(webApp.initData, "mock_init_data");
});
