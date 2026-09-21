import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { createUser } from "../src/repositories/usersRepository.ts";
import {
  getUserAcquisition,
  recordFirstTouch,
} from "../src/repositories/userAcquisitionRepository.ts";

test("records a first-touch acquisition row", async () => {
  const { db } = createTestDb();
  const user = await createUser(db, { telegramUserId: 1, firstName: "Tanya" });

  const recorded = await recordFirstTouch(db, {
    userId: user.id,
    source: "tiktok",
    campaign: "launch",
  });

  assert.equal(recorded.user_id, user.id);
  assert.equal(recorded.source, "tiktok");
  assert.ok(recorded.first_touch_at);
});

test("first-touch is not duplicated on repeated calls", async () => {
  const { db } = createTestDb();
  const user = await createUser(db, { telegramUserId: 2, firstName: "Anna" });

  const first = await recordFirstTouch(db, {
    userId: user.id,
    source: "tiktok",
  });
  const second = await recordFirstTouch(db, {
    userId: user.id,
    source: "telegram", // different source: should be ignored, first-touch wins
  });

  assert.deepEqual(second, first);

  const stored = await getUserAcquisition(db, user.id);
  assert.equal(stored?.source, "tiktok");
});

test("referrer_user_id may be null", async () => {
  const { db } = createTestDb();
  const user = await createUser(db, { telegramUserId: 3, firstName: "Duo" });

  const recorded = await recordFirstTouch(db, { userId: user.id });
  assert.equal(recorded.referrer_user_id, null);
});
