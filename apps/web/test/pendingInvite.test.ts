import test from "node:test";
import assert from "node:assert/strict";
import {
  capturePendingInviteFromUrl,
  consumePendingInvite,
} from "../src/lib/pendingInvite.ts";

/**
 * Same isolation pattern as analytics.test.ts (localStorage) and
 * webapp.test.ts (window) — neither exists under plain `node:test`, so
 * each test stands up the minimal stand-ins it needs.
 */

function withEnv<T>(url: string, fn: () => T): T {
  const store = new Map<string, string>();
  const originalWindow = (globalThis as { window?: unknown }).window;
  const originalLocalStorage = (globalThis as { localStorage?: unknown })
    .localStorage;

  let currentHref = url;
  const fakeWindow = {
    get location() {
      const u = new URL(currentHref);
      return { search: u.search, href: currentHref };
    },
    history: {
      replaceState: (_state: unknown, _title: string, newUrl: string) => {
        currentHref = newUrl;
      },
    },
  };
  (globalThis as { window?: unknown }).window = fakeWindow;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };

  try {
    return fn();
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
    if (originalLocalStorage === undefined) {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
      (globalThis as { localStorage?: unknown }).localStorage =
        originalLocalStorage;
    }
  }
}

test("a code in the URL survives to consumePendingInvite, uppercased", () => {
  withEnv("https://example.com/?invite=ab12cd", () => {
    capturePendingInviteFromUrl();
    assert.equal(consumePendingInvite(), "AB12CD");
  });
});

test("the query param is stripped from the URL after capture, so it isn't shared again on reload", () => {
  withEnv("https://example.com/?invite=ab12cd", () => {
    capturePendingInviteFromUrl();
    assert.equal(window.location.search, "");
  });
});

test("a code is only ever offered once", () => {
  withEnv("https://example.com/?invite=ab12cd", () => {
    capturePendingInviteFromUrl();
    assert.equal(consumePendingInvite(), "AB12CD");
    assert.equal(consumePendingInvite(), null);
  });
});

test("no ?invite= at all leaves nothing pending", () => {
  withEnv("https://example.com/today", () => {
    capturePendingInviteFromUrl();
    assert.equal(consumePendingInvite(), null);
  });
});
