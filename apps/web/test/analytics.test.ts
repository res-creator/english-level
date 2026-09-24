import test from "node:test";
import assert from "node:assert/strict";
import { track } from "../src/lib/analytics.ts";

/**
 * `track` talks to the network and to `localStorage`, neither of which
 * `node:test` provides — so each test stands up the minimal stand-ins it
 * needs and tears them down again, the same pattern already used for
 * `window.Telegram` in webapp.test.ts.
 */

function withLocalStorage<T>(fn: () => Promise<T> | T): Promise<T> | T {
  const store = new Map<string, string>();
  const original = (globalThis as { localStorage?: unknown }).localStorage;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  const restore = () => {
    if (original === undefined) {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
      (globalThis as { localStorage?: unknown }).localStorage = original;
    }
  };
  try {
    const result = fn();
    if (result instanceof Promise) return result.finally(restore) as T;
    restore();
    return result;
  } catch (err) {
    restore();
    throw err;
  }
}

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

function withFetch<T>(
  respond: (req: CapturedRequest) => Response | Promise<Response>,
  fn: (calls: CapturedRequest[]) => Promise<T> | T,
): Promise<T> | T {
  const calls: CapturedRequest[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = { url: String(input), init: init ?? {} };
    calls.push(req);
    return respond(req);
  }) as typeof fetch;
  const restore = () => {
    globalThis.fetch = original;
  };
  try {
    const result = fn(calls);
    if (result instanceof Promise) return result.finally(restore) as T;
    restore();
    return result;
  } catch (err) {
    restore();
    throw err;
  }
}

function ok(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("posts to /api/v1/events with the event name and an anonymous id", async () => {
  await withLocalStorage(() =>
    withFetch(
      () => ok(),
      async (calls) => {
        track("welcome_viewed");
        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.equal(calls.length, 1);
        assert.ok(calls[0]!.url.endsWith("/api/v1/events"));
        const body = JSON.parse(String(calls[0]!.init.body));
        assert.equal(body.event, "welcome_viewed");
        assert.ok(
          typeof body.anonymousId === "string" && body.anonymousId.length > 0,
        );
      },
    ),
  );
});

test("the anonymous id is generated once and reused across calls", async () => {
  await withLocalStorage(() =>
    withFetch(
      () => ok(),
      async (calls) => {
        track("demo_started");
        track("demo_completed");
        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.equal(calls.length, 2);
        const first = JSON.parse(String(calls[0]!.init.body)).anonymousId;
        const second = JSON.parse(String(calls[1]!.init.body)).anonymousId;
        assert.equal(first, second);
      },
    ),
  );
});

test("properties travel with the event when given", async () => {
  await withLocalStorage(() =>
    withFetch(
      () => ok(),
      async (calls) => {
        track("demo_skipped", { step: 1 });
        await new Promise((resolve) => setTimeout(resolve, 0));

        const body = JSON.parse(String(calls[0]!.init.body));
        assert.deepEqual(body.properties, { step: 1 });
      },
    ),
  );
});

test("a network failure is swallowed — track never throws", async () => {
  await withLocalStorage(() =>
    withFetch(
      () => {
        throw new Error("offline");
      },
      async () => {
        assert.doesNotThrow(() => track("welcome_viewed"));
        // Let the rejected promise's .catch run before the test exits,
        // so an unhandled rejection can't leak into another test.
        await new Promise((resolve) => setTimeout(resolve, 0));
      },
    ),
  );
});

test("without localStorage at all, track still sends — it just can't join later calls", async () => {
  const originalLocalStorage = (globalThis as { localStorage?: unknown })
    .localStorage;
  delete (globalThis as { localStorage?: unknown }).localStorage;
  try {
    await withFetch(
      () => ok(),
      async (calls) => {
        assert.doesNotThrow(() => track("welcome_viewed"));
        await new Promise((resolve) => setTimeout(resolve, 0));
        assert.equal(calls.length, 1);
      },
    );
  } finally {
    if (originalLocalStorage !== undefined) {
      (globalThis as { localStorage?: unknown }).localStorage =
        originalLocalStorage;
    }
  }
});
