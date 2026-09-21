import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import {
  createUser,
  findUserById,
  setOnboardingStage,
} from "../src/repositories/usersRepository.ts";
import { createDefaultUserSettings } from "../src/repositories/userSettingsRepository.ts";
import {
  getCurrentPlacementAttempt,
  getPlacementResult,
  startPlacementAttempt,
  submitPlacementAnswer,
} from "../src/services/placementService.ts";
import { runFixtureAttempt, always } from "./helpers/placementFixtures.ts";
import type { Db } from "../src/db/types.ts";

async function makeUser(db: Db, telegramUserId: number) {
  const user = await createUser(db, { telegramUserId, firstName: "Test" });
  await createDefaultUserSettings(db, user.id);
  await setOnboardingStage(db, user.id, "placement_required");
  return user;
}

// --- Db.batch atomicity (the mechanism the fix relies on) ----------------

test("Db.batch is atomic: a failing statement rolls back the entire batch", async () => {
  const { db, sqlite } = createTestDb();
  const user = await createUser(db, {
    telegramUserId: 900,
    firstName: "Original",
  });

  await assert.rejects(
    db.batch([
      {
        sql: "UPDATE users SET first_name = ? WHERE id = ?",
        params: ["Changed", user.id],
      },
      // Deliberately invalid — this statement must fail...
      { sql: "UPDATE this_table_does_not_exist SET x = 1" },
    ]),
  );

  // ...and because the batch is atomic, the *valid* statement before it
  // must also have been rolled back, not partially applied.
  const after = sqlite
    .prepare("SELECT first_name FROM users WHERE id = ?")
    .get(user.id) as { first_name: string };
  assert.equal(after.first_name, "Original");
});

test("Db.batch commits every statement together on success", async () => {
  const { db, sqlite } = createTestDb();
  const user = await createUser(db, { telegramUserId: 901, firstName: "A" });

  await db.batch([
    {
      sql: "UPDATE users SET first_name = ? WHERE id = ?",
      params: ["B", user.id],
    },
    {
      sql: "UPDATE users SET last_name = ? WHERE id = ?",
      params: ["C", user.id],
    },
  ]);

  const after = sqlite
    .prepare("SELECT first_name, last_name FROM users WHERE id = ?")
    .get(user.id) as { first_name: string; last_name: string };
  assert.equal(after.first_name, "B");
  assert.equal(after.last_name, "C");
});

// --- 1. normal finalization updates both together -------------------------

test("normal finalization updates the placement attempt and the user together", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 1);

  const { attemptId, result } = await runFixtureAttempt(
    db,
    user.id,
    always(true),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const attemptRow = sqlite
    .prepare("SELECT status, result_level FROM placement_attempts WHERE id = ?")
    .get(attemptId) as { status: string; result_level: string };
  const userRow = await findUserById(db, user.id);

  assert.equal(attemptRow.status, "completed");
  assert.equal(attemptRow.result_level, result.result.level);
  assert.equal(userRow?.current_cefr_level, result.result.level);
  assert.equal(userRow?.onboarding_stage, "completed");
  assert.equal(userRow?.onboarding_completed, 1);
});

// --- 2. repeating finalization-adjacent calls is idempotent ---------------

test("repeatedly reading a completed attempt's result is idempotent (no error, state stays stable)", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 2);
  const { attemptId } = await runFixtureAttempt(db, user.id, always(true));

  const first = await getPlacementResult(db, user.id, attemptId);
  const second = await getPlacementResult(db, user.id, attemptId);
  const third = await getPlacementResult(db, user.id, attemptId);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(third.ok, true);
  if (first.ok && second.ok && third.ok) {
    assert.deepEqual(first.result, second.result);
    assert.deepEqual(second.result, third.result);
  }

  const user1 = await findUserById(db, user.id);
  const user2 = await findUserById(db, user.id);
  assert.equal(user1?.current_cefr_level, user2?.current_cefr_level);
  assert.equal(user1?.onboarding_stage, user2?.onboarding_stage);
});

test("repeatedly submitting an already-answered question after completion is idempotent", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 3);
  const start = await startPlacementAttempt(db, user.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  const firstQuestionId = start.question.id;

  // Drive to completion.
  const { attemptId } = await runFixtureAttempt(db, user.id, always(true));

  // Re-submit an answer for a question already answered earlier in the
  // (now-completed) attempt — this must not error or double-apply.
  const retry1 = await submitPlacementAnswer(db, user.id, attemptId, {
    questionId: firstQuestionId,
    answer: "irrelevant, already answered",
  });
  const retry2 = await submitPlacementAnswer(db, user.id, attemptId, {
    questionId: firstQuestionId,
    answer: "irrelevant, already answered",
  });

  assert.equal(retry1.ok, true);
  assert.equal(retry2.ok, true);
  if (retry1.ok && retry2.ok) {
    assert.deepEqual(retry1, retry2);
    assert.equal(retry1.status, "completed");
  }

  const answerCount = sqlite
    .prepare(
      "SELECT COUNT(*) as n FROM placement_answers WHERE attempt_id = ? AND question_id = ?",
    )
    .get(attemptId, firstQuestionId) as { n: number };
  assert.equal(answerCount.n, 1);
});

// --- 3. simulated partial failure is repaired ------------------------------

test("a simulated partial failure (attempt completed, user row not yet updated) is repaired by GET result", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 4);
  const start = await startPlacementAttempt(db, user.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  // Force the attempt into a "completed with a result" state directly,
  // bypassing finalizeAttempt entirely — this is exactly the state a
  // crash between the two writes (pre-fix) or any other partial failure
  // would leave behind.
  sqlite
    .prepare(
      `UPDATE placement_attempts
       SET status = 'completed', completed_at = ?, result_level = 'B1',
           vocabulary_score = 80, grammar_score = 70, reading_score = 90,
           active_english_score = 60, strongest_skill = 'reading',
           weakest_skill = 'active_english'
       WHERE id = ?`,
    )
    .run(new Date().toISOString(), start.attemptId);

  const before = await findUserById(db, user.id);
  assert.notEqual(before?.current_cefr_level, "B1");
  assert.notEqual(before?.onboarding_stage, "completed");
  assert.equal(before?.onboarding_completed, 0);

  const result = await getPlacementResult(db, user.id, start.attemptId);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.result.level, "B1");

  const after = await findUserById(db, user.id);
  assert.equal(after?.current_cefr_level, "B1");
  assert.equal(after?.onboarding_stage, "completed");
  assert.equal(after?.onboarding_completed, 1);
});

test("the same simulated partial failure is repaired by GET current and by a duplicate answer retry", async () => {
  const { db, sqlite } = createTestDb();

  // GET current path
  {
    const user = await makeUser(db, 5);
    const start = await startPlacementAttempt(db, user.id);
    assert.equal(start.ok, true);
    if (!start.ok) return;

    sqlite
      .prepare(
        `UPDATE placement_attempts
         SET status = 'completed', completed_at = ?, result_level = 'A2',
             vocabulary_score = 70, grammar_score = 70, reading_score = 70,
             active_english_score = 70, strongest_skill = 'vocabulary',
             weakest_skill = 'grammar'
         WHERE id = ?`,
      )
      .run(new Date().toISOString(), start.attemptId);

    const current = await getCurrentPlacementAttempt(db, user.id);
    assert.equal(current.status, "completed");

    const after = await findUserById(db, user.id);
    assert.equal(after?.current_cefr_level, "A2");
    assert.equal(after?.onboarding_stage, "completed");
  }

  // duplicate-answer-retry path
  {
    const user = await makeUser(db, 6);
    const start = await startPlacementAttempt(db, user.id);
    assert.equal(start.ok, true);
    if (!start.ok) return;

    // Answer the first question for real so a placement_answers row
    // exists to "retry" against.
    const firstAnswer = await submitPlacementAnswer(
      db,
      user.id,
      start.attemptId,
      {
        questionId: start.question.id,
        answer: "wrong on purpose",
      },
    );
    assert.equal(firstAnswer.ok, true);

    // Now force-complete the attempt directly, simulating the same
    // partial failure as above.
    sqlite
      .prepare(
        `UPDATE placement_attempts
         SET status = 'completed', completed_at = ?, result_level = 'A1',
             vocabulary_score = 50, grammar_score = 50, reading_score = 50,
             active_english_score = 50, strongest_skill = 'vocabulary',
             weakest_skill = 'grammar'
         WHERE id = ?`,
      )
      .run(new Date().toISOString(), start.attemptId);

    const before = await findUserById(db, user.id);
    assert.notEqual(before?.current_cefr_level, "A1");

    // Retry answering the same (already-answered) question.
    const retry = await submitPlacementAnswer(db, user.id, start.attemptId, {
      questionId: start.question.id,
      answer: "wrong on purpose",
    });
    assert.equal(retry.ok, true);
    if (retry.ok) assert.equal(retry.status, "completed");

    const after = await findUserById(db, user.id);
    assert.equal(after?.current_cefr_level, "A1");
    assert.equal(after?.onboarding_stage, "completed");
    assert.equal(after?.onboarding_completed, 1);
  }
});

test("repair is a no-op once the user row already matches the completed attempt", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 7);
  const { attemptId } = await runFixtureAttempt(db, user.id, always(true));

  const before = await findUserById(db, user.id);
  const updatedAtBefore = before?.updated_at;

  // Calling result/current again after a normal (already-consistent)
  // completion should not need to touch the user row at all.
  await getPlacementResult(db, user.id, attemptId);
  await getCurrentPlacementAttempt(db, user.id);

  const after = await findUserById(db, user.id);
  assert.equal(after?.updated_at, updatedAtBefore);
});
