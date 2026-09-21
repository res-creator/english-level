import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { createUser } from "../src/repositories/usersRepository.ts";
import {
  createDefaultUserSettings,
  getUserSettings,
  updateUserSettings,
} from "../src/repositories/userSettingsRepository.ts";

test("creates default settings and enforces one row per user", async () => {
  const { db } = createTestDb();
  const user = await createUser(db, { telegramUserId: 1, firstName: "Tanya" });

  const settings = await createDefaultUserSettings(db, user.id);
  assert.equal(settings.daily_minutes, 10);
  assert.equal(settings.review_notifications, 1);
  assert.equal(settings.learning_goals_json, "[]");

  await assert.rejects(
    createDefaultUserSettings(db, user.id),
    /UNIQUE constraint failed|PRIMARY KEY/,
  );
});

test("updateUserSettings only accepts 5, 10, or 15 for dailyMinutes", async () => {
  const { db } = createTestDb();
  const user = await createUser(db, { telegramUserId: 2, firstName: "Anna" });
  await createDefaultUserSettings(db, user.id);

  const updated = await updateUserSettings(db, user.id, { dailyMinutes: 5 });
  assert.equal(updated.daily_minutes, 5);

  await assert.rejects(() =>
    updateUserSettings(db, user.id, { dailyMinutes: 7 as 5 }),
  );

  const stillFive = await getUserSettings(db, user.id);
  assert.equal(stillFive?.daily_minutes, 5);
});

test("updateUserSettings serializes learningGoals as JSON", async () => {
  const { db } = createTestDb();
  const user = await createUser(db, { telegramUserId: 3, firstName: "Duo" });
  await createDefaultUserSettings(db, user.id);

  const updated = await updateUserSettings(db, user.id, {
    learningGoals: ["travel", "work"],
  });

  assert.deepEqual(JSON.parse(updated.learning_goals_json), ["travel", "work"]);
});
