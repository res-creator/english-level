import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import {
  createUser,
  findUserById,
} from "../src/repositories/usersRepository.ts";
import { createDefaultUserSettings } from "../src/repositories/userSettingsRepository.ts";
import { resolveCurrentUser } from "../src/services/authService.ts";
import {
  getOnboardingState,
  updateOnboardingDailyTime,
  updateOnboardingGoals,
  updateOnboardingLevel,
} from "../src/services/onboardingService.ts";
import type { Db } from "../src/db/types.ts";

async function makeUser(db: Db, telegramUserId: number) {
  const user = await createUser(db, {
    telegramUserId,
    firstName: "Test",
  });
  await createDefaultUserSettings(db, user.id);
  return user;
}

test("unauthenticated access is rejected (the same requireAuth gate onboarding routes use)", async () => {
  const { db } = createTestDb();
  assert.equal(await resolveCurrentUser(db, undefined), null);
  assert.equal(await resolveCurrentUser(db, "not-a-real-token"), null);
});

test("a new authenticated user begins at the goals stage", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 1);

  const state = await getOnboardingState(db, user.id);

  assert.deepEqual(state, {
    stage: "goals",
    goals: [],
    dailyMinutes: null,
    selfReportedCefrLevel: null,
  });
});

test("zero goals are rejected", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 2);

  const result = await updateOnboardingGoals(db, user.id, { goals: [] });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "validation_error");
});

test("more than 3 goals are rejected", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 3);

  const result = await updateOnboardingGoals(db, user.id, {
    goals: ["everyday", "travel", "work", "study"],
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "validation_error");
});

test("duplicate goals are rejected", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 4);

  const result = await updateOnboardingGoals(db, user.id, {
    goals: ["travel", "travel"],
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "validation_error");
});

test("an unknown goal code is rejected", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 5);

  const result = await updateOnboardingGoals(db, user.id, {
    goals: ["parkour"],
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "validation_error");
});

test("valid goals persist and the stage advances to daily_time", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 6);

  const result = await updateOnboardingGoals(db, user.id, {
    goals: ["travel", "work"],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.state.goals, ["travel", "work"]);
  assert.equal(result.state.stage, "daily_time");
});

test("invalid daily minutes are rejected", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 7);
  await updateOnboardingGoals(db, user.id, { goals: ["everyday"] });

  const result = await updateOnboardingDailyTime(db, user.id, { minutes: 7 });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "validation_error");
});

test("only 5, 10, or 15 minutes are accepted, and daily time persists", async () => {
  for (const minutes of [5, 10, 15]) {
    const { db } = createTestDb();
    const user = await makeUser(db, 100 + minutes);
    await updateOnboardingGoals(db, user.id, { goals: ["everyday"] });

    const result = await updateOnboardingDailyTime(db, user.id, { minutes });

    assert.equal(result.ok, true);
    if (!result.ok) continue;
    assert.equal(result.state.dailyMinutes, minutes);
    assert.equal(result.state.stage, "level_choice");
  }
});

test("a valid self-reported level persists", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 8);
  await updateOnboardingGoals(db, user.id, { goals: ["everyday"] });
  await updateOnboardingDailyTime(db, user.id, { minutes: 10 });

  const result = await updateOnboardingLevel(db, user.id, { level: "B1" });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.selfReportedCefrLevel, "B1");
});

test('null ("I don\'t know") level is handled correctly, distinct from "not yet answered"', async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 9);
  await updateOnboardingGoals(db, user.id, { goals: ["everyday"] });
  await updateOnboardingDailyTime(db, user.id, { minutes: 10 });

  const before = await getOnboardingState(db, user.id);
  assert.equal(before.selfReportedCefrLevel, null); // not yet answered

  const result = await updateOnboardingLevel(db, user.id, { level: null });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.selfReportedCefrLevel, null); // explicitly "I don't know"
  assert.equal(result.state.stage, "placement_required"); // but the step IS complete
});

test("an unknown CEFR level (e.g. C1) is rejected", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 10);
  await updateOnboardingGoals(db, user.id, { goals: ["everyday"] });
  await updateOnboardingDailyTime(db, user.id, { minutes: 10 });

  const result = await updateOnboardingLevel(db, user.id, { level: "C1" });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, "validation_error");
});

test("current_cefr_level remains unconfirmed/null after onboarding preferences are complete", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 11);
  await updateOnboardingGoals(db, user.id, { goals: ["everyday"] });
  await updateOnboardingDailyTime(db, user.id, { minutes: 10 });
  await updateOnboardingLevel(db, user.id, { level: "B2" });

  const stored = await findUserById(db, user.id);
  assert.equal(stored?.current_cefr_level, null);
});

test("completed preferences end at placement_required, not completed", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 12);
  await updateOnboardingGoals(db, user.id, { goals: ["everyday"] });
  await updateOnboardingDailyTime(db, user.id, { minutes: 10 });
  const result = await updateOnboardingLevel(db, user.id, { level: "A2" });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.stage, "placement_required");

  const stored = await findUserById(db, user.id);
  assert.equal(stored?.onboarding_completed, 0);
});

test("a client cannot skip required steps by calling a later step directly", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 13);

  const dailyTimeFirst = await updateOnboardingDailyTime(db, user.id, {
    minutes: 10,
  });
  assert.equal(dailyTimeFirst.ok, false);
  if (!dailyTimeFirst.ok)
    assert.equal(dailyTimeFirst.error.code, "step_locked");

  const levelFirst = await updateOnboardingLevel(db, user.id, { level: "A1" });
  assert.equal(levelFirst.ok, false);
  if (!levelFirst.ok) assert.equal(levelFirst.error.code, "step_locked");
});

test("onboarding resumes at the correct step after a simulated app reopen", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 14);

  assert.equal((await getOnboardingState(db, user.id)).stage, "goals");

  await updateOnboardingGoals(db, user.id, { goals: ["everyday"] });
  assert.equal((await getOnboardingState(db, user.id)).stage, "daily_time");

  await updateOnboardingDailyTime(db, user.id, { minutes: 5 });
  assert.equal((await getOnboardingState(db, user.id)).stage, "level_choice");

  await updateOnboardingLevel(db, user.id, { level: null });
  assert.equal(
    (await getOnboardingState(db, user.id)).stage,
    "placement_required",
  );
});

test("editing a prior answer persists without corrupting the other answers or the stage", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 15);
  await updateOnboardingGoals(db, user.id, { goals: ["travel"] });
  await updateOnboardingDailyTime(db, user.id, { minutes: 10 });
  await updateOnboardingLevel(db, user.id, { level: "A2" });

  const before = await getOnboardingState(db, user.id);
  assert.equal(before.stage, "placement_required");

  const edited = await updateOnboardingDailyTime(db, user.id, { minutes: 5 });

  assert.equal(edited.ok, true);
  if (!edited.ok) return;
  assert.equal(edited.state.dailyMinutes, 5);
  assert.equal(edited.state.stage, "placement_required"); // unchanged
  assert.deepEqual(edited.state.goals, ["travel"]); // unaffected
  assert.equal(edited.state.selfReportedCefrLevel, "A2"); // unaffected
});

test("repeat requests do not create duplicate user_settings rows", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 16);

  await updateOnboardingGoals(db, user.id, { goals: ["everyday"] });
  await updateOnboardingGoals(db, user.id, { goals: ["travel", "work"] });
  await updateOnboardingDailyTime(db, user.id, { minutes: 10 });
  await updateOnboardingDailyTime(db, user.id, { minutes: 15 });

  const count = sqlite
    .prepare("SELECT COUNT(*) as n FROM user_settings WHERE user_id = ?")
    .get(user.id) as { n: number };
  assert.equal(count.n, 1);
});
