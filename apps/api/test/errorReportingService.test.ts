import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { reportError } from "../src/services/errorReportingService.ts";
import { listRecentErrors } from "../src/repositories/errorLogRepository.ts";
import { createUser } from "../src/repositories/usersRepository.ts";

/**
 * The whole point of this table is that it's still readable after
 * whatever broke — so every test here checks the row lands correctly,
 * never that reporting itself somehow throws.
 */

test("a real Error is recorded with its message, stack, source and path", async () => {
  const { db } = createTestDb();
  const err = new Error("something broke");
  await reportError(db, "POST", "/api/v1/course", null, err);

  const rows = await listRecentErrors(db);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.source, "POST");
  assert.equal(rows[0]?.path, "/api/v1/course");
  assert.equal(rows[0]?.message, "something broke");
  assert.ok(rows[0]?.stack?.includes("something broke"));
});

test("a string thrown as an error (not an Error instance) is still captured", async () => {
  const { db } = createTestDb();
  await reportError(db, "cron", "reminders", null, "plain string failure");

  const rows = await listRecentErrors(db);
  assert.equal(rows[0]?.message, "plain string failure");
  assert.equal(rows[0]?.stack, null);
});

test("a genuinely weird thrown value (not Error, not string) is still captured, never throws", async () => {
  const { db } = createTestDb();
  await reportError(db, "POST", "/api/v1/events", null, { odd: true, n: 3 });

  const rows = await listRecentErrors(db);
  assert.equal(rows.length, 1);
  assert.ok(rows[0]?.message.includes("odd"));
});

test("who it happened to is recorded when known", async () => {
  const { db } = createTestDb();
  const user = await createUser(db, { telegramUserId: 1, firstName: "Test" });
  await reportError(db, "POST", "/api/v1/my/reset", user.id, new Error("x"));
  const rows = await listRecentErrors(db);
  assert.equal(rows[0]?.user_id, user.id);
});

test("an oversized message and stack are capped, not stored unbounded", async () => {
  const { db } = createTestDb();
  const huge = new Error("x".repeat(10_000));
  huge.stack = "y".repeat(10_000);
  await reportError(db, "POST", "/p", null, huge);

  const rows = await listRecentErrors(db);
  assert.ok((rows[0]?.message.length ?? 0) <= 2000);
  assert.ok((rows[0]?.stack?.length ?? 0) <= 4000);
});

test("reportError never throws, even when the database itself is broken", async () => {
  const brokenDb = {
    run: async () => {
      throw new Error("db down");
    },
    all: async () => {
      throw new Error("db down");
    },
    first: async () => {
      throw new Error("db down");
    },
    batch: async () => {
      throw new Error("db down");
    },
  };
  await assert.doesNotReject(() =>
    reportError(brokenDb, "POST", "/p", null, new Error("original failure")),
  );
});

test("listRecentErrors returns newest first", async () => {
  const { db } = createTestDb();
  await reportError(
    db,
    "GET",
    "/a",
    null,
    new Error("first"),
    "2026-01-01T00:00:00Z",
  );
  await reportError(
    db,
    "GET",
    "/b",
    null,
    new Error("second"),
    "2026-01-02T00:00:00Z",
  );

  const rows = await listRecentErrors(db);
  assert.equal(rows[0]?.message, "second");
  assert.equal(rows[1]?.message, "first");
});
