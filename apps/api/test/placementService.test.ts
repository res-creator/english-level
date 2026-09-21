import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import {
  createUser,
  findUserById,
  setOnboardingStage,
  setSelfReportedCefrLevel,
} from "../src/repositories/usersRepository.ts";
import { createDefaultUserSettings } from "../src/repositories/userSettingsRepository.ts";
import { resolveCurrentUser } from "../src/services/authService.ts";
import {
  startPlacementAttempt,
  submitPlacementAnswer,
  getCurrentPlacementAttempt,
  getPlacementResult,
} from "../src/services/placementService.ts";
import { findQuestionById } from "../src/repositories/placementQuestionsRepository.ts";
import {
  runFixtureAttempt,
  onlyLevel,
  upToLevel,
  always,
} from "./helpers/placementFixtures.ts";
import type { Db, PlacementQuestionRow } from "../src/db/types.ts";

async function makeUser(db: Db, telegramUserId: number) {
  const user = await createUser(db, { telegramUserId, firstName: "Test" });
  await createDefaultUserSettings(db, user.id);
  await setOnboardingStage(db, user.id, "placement_required");
  return user;
}

// --- 1. auth gate -----------------------------------------------------

test("unauthenticated placement access is rejected (same requireAuth gate the routes use)", async () => {
  const { db } = createTestDb();
  assert.equal(await resolveCurrentUser(db, undefined), null);
});

// --- 2-3. start ---------------------------------------------------------

test("an eligible user can start the test and gets a question without an answer key", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 1);

  const start = await startPlacementAttempt(db, user.id);

  assert.equal(start.ok, true);
  if (!start.ok) return;
  assert.match(start.attemptId, /^pat_/);
  assert.match(start.question.id, /^pq_/);
  assert.equal(start.progress.answered, 0);

  const keys = Object.keys(start.question).sort();
  assert.deepEqual(keys, [
    "id",
    "options",
    "passage",
    "prompt",
    "skill",
    "type",
  ]);
  for (const forbidden of [
    "accepted",
    "acceptedAnswers",
    "correctAnswer",
    "cefrLevel",
    "difficulty",
  ]) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(start.question, forbidden),
      false,
    );
  }
});

test("a non-eligible user (not at placement_required) cannot start", async () => {
  const { db } = createTestDb();
  const user = await createUser(db, { telegramUserId: 2, firstName: "Early" });
  await createDefaultUserSettings(db, user.id);
  // still at "goals" — never advanced to placement_required

  const start = await startPlacementAttempt(db, user.id);

  assert.equal(start.ok, false);
  if (start.ok) return;
  assert.equal(start.error.code, "not_eligible");
});

// --- 4. resume ------------------------------------------------------------

test("an active attempt is reused rather than creating a second one", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 3);

  const first = await startPlacementAttempt(db, user.id);
  const second = await startPlacementAttempt(db, user.id);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.attemptId, second.attemptId);

  const count = sqlite
    .prepare("SELECT COUNT(*) as n FROM placement_attempts WHERE user_id = ?")
    .get(user.id) as { n: number };
  assert.equal(count.n, 1);

  const current = await getCurrentPlacementAttempt(db, user.id);
  assert.equal(current.status, "in_progress");
  if (current.status === "in_progress") {
    assert.equal(current.attemptId, first.attemptId);
  }
});

// --- 5. ownership -----------------------------------------------------

test("a user cannot access another user's attempt", async () => {
  const { db } = createTestDb();
  const owner = await makeUser(db, 4);
  const intruder = await makeUser(db, 5);

  const start = await startPlacementAttempt(db, owner.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  const answerAttempt = await submitPlacementAnswer(
    db,
    intruder.id,
    start.attemptId,
    {
      questionId: start.question.id,
      answer: "whatever",
    },
  );
  assert.equal(answerAttempt.ok, false);
  if (!answerAttempt.ok) assert.equal(answerAttempt.error.code, "not_found");

  const resultAttempt = await getPlacementResult(
    db,
    intruder.id,
    start.attemptId,
  );
  assert.equal(resultAttempt.ok, false);
  if (!resultAttempt.ok) assert.equal(resultAttempt.error.code, "not_found");
});

// --- 6-7. grading -----------------------------------------------------

test("a valid answer is graded correctly", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 6);
  const start = await startPlacementAttempt(db, user.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  const questionRow = await findQuestionById(db, start.question.id);
  const correctAnswer = JSON.parse(questionRow!.accepted_answers_json)[0];

  await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: start.question.id,
    answer: correctAnswer,
  });

  const row = sqlite
    .prepare(
      "SELECT is_correct FROM placement_answers WHERE attempt_id = ? AND question_id = ?",
    )
    .get(start.attemptId, start.question.id) as { is_correct: number };
  assert.equal(row.is_correct, 1);
});

test("an incorrect answer is graded correctly", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 7);
  const start = await startPlacementAttempt(db, user.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: start.question.id,
    answer: "totally wrong",
  });

  const row = sqlite
    .prepare(
      "SELECT is_correct FROM placement_answers WHERE attempt_id = ? AND question_id = ?",
    )
    .get(start.attemptId, start.question.id) as { is_correct: number };
  assert.equal(row.is_correct, 0);
});

// --- 8. idempotent retry -----------------------------------------------

test("a duplicate answer submission does not double-count", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 8);
  const start = await startPlacementAttempt(db, user.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  const questionRow = await findQuestionById(db, start.question.id);
  const correctAnswer = JSON.parse(questionRow!.accepted_answers_json)[0];

  const first = await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: start.question.id,
    answer: correctAnswer,
  });
  const retry = await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: start.question.id,
    answer: correctAnswer,
  });

  assert.equal(first.ok, true);
  assert.equal(retry.ok, true);
  if (first.ok && retry.ok) {
    assert.deepEqual(first, retry);
  }

  const count = sqlite
    .prepare(
      "SELECT COUNT(*) as n FROM placement_answers WHERE attempt_id = ? AND question_id = ?",
    )
    .get(start.attemptId, start.question.id) as { n: number };
  assert.equal(count.n, 1);
});

// --- 9. can't answer an unissued question -------------------------------

test("a question not issued for this attempt cannot be answered", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 9);
  const start = await startPlacementAttempt(db, user.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  const res = await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: "pq_b2_gram_1", // almost certainly not the issued question
    answer: "anything",
  });

  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.error.code, "question_not_issued");
});

// --- 10-12. adaptive movement -------------------------------------------

test("the adaptive engine moves to a harder level after 2 consecutive correct answers, not after 1", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 10);
  const start = await startPlacementAttempt(db, user.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  const q1 = await findQuestionById(db, start.question.id);
  const a1 = await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: start.question.id,
    answer: JSON.parse(q1!.accepted_answers_json)[0],
  });
  assert.equal(a1.ok, true);

  const afterOne = sqlite
    .prepare(
      "SELECT current_level_pointer FROM placement_attempts WHERE id = ?",
    )
    .get(start.attemptId) as { current_level_pointer: string };
  assert.equal(afterOne.current_level_pointer, "A2"); // one correct answer: no jump

  if (!a1.ok || a1.status !== "continue") return;
  const q2 = await findQuestionById(db, a1.question.id);
  await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: a1.question.id,
    answer: JSON.parse(q2!.accepted_answers_json)[0],
  });

  const afterTwo = sqlite
    .prepare(
      "SELECT current_level_pointer FROM placement_attempts WHERE id = ?",
    )
    .get(start.attemptId) as { current_level_pointer: string };
  assert.equal(afterTwo.current_level_pointer, "B1"); // two in a row: moved up one band
});

test("the adaptive engine moves to an easier level after 2 consecutive incorrect answers", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 11);
  const start = await startPlacementAttempt(db, user.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  const a1 = await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: start.question.id,
    answer: "wrong",
  });
  assert.equal(a1.ok, true);
  if (!a1.ok || a1.status !== "continue") return;

  await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: a1.question.id,
    answer: "wrong",
  });

  const after = sqlite
    .prepare(
      "SELECT current_level_pointer FROM placement_attempts WHERE id = ?",
    )
    .get(start.attemptId) as { current_level_pointer: string };
  assert.equal(after.current_level_pointer, "A1"); // started A2, two wrong -> A1
});

// --- 13. stopping condition ---------------------------------------------

test("the test eventually reaches a stopping condition", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 12);

  const { result, answeredCount } = await runFixtureAttempt(
    db,
    user.id,
    always(true),
  );

  assert.equal(result.ok, true);
  assert.ok(
    answeredCount >= 15 && answeredCount <= 25,
    `answeredCount=${answeredCount}`,
  );
});

// --- fixture learners: 14, 15, 19-20 covered here too -------------------

test("a clear A1 learner is classified A1", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 20);
  const { result } = await runFixtureAttempt(db, user.id, onlyLevel("A1"));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.result.level, "A1");
});

test("a clear A2 learner is classified A2", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 21);
  const { result } = await runFixtureAttempt(db, user.id, upToLevel("A2"));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.result.level, "A2");
});

test("a clear B1 learner is classified B1", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 22);
  const { result } = await runFixtureAttempt(db, user.id, upToLevel("B1"));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.result.level, "B1");
});

test("a clear B2 learner is classified B2 (and result is deterministic across runs)", async () => {
  const { db } = createTestDb();
  const userA = await makeUser(db, 23);
  const userB = await makeUser(db, 24);

  const runA = await runFixtureAttempt(db, userA.id, always(true));
  const runB = await runFixtureAttempt(db, userB.id, always(true));

  assert.equal(runA.result.ok, true);
  assert.equal(runB.result.ok, true);
  if (runA.result.ok && runB.result.ok) {
    assert.equal(runA.result.result.level, "B2");
    assert.equal(runA.result.result.level, runB.result.result.level);
  }
});

test("a mixed profile (strong vocabulary/reading/active English, weak grammar) does not get an absurdly high classification, and skill scores are separate", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 25);

  const { result } = await runFixtureAttempt(
    db,
    user.id,
    (question: PlacementQuestionRow) => question.skill !== "grammar",
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.result.scores.grammar, 0);
  assert.equal(result.result.scores.vocabulary, 100);
  assert.equal(result.result.scores.reading, 100);
  assert.equal(result.result.scores.activeEnglish, 100);
  assert.equal(result.result.weakestSkill, "grammar");
  assert.notEqual(result.result.strongestSkill, "grammar");
  // Zero grammar competence at every level tested is strong negative
  // evidence, not just "one weak skill" — the algorithm correctly refuses
  // to classify this profile above A1 despite 3 skills scoring 100%,
  // rather than blending it away into a falsely high overall level.
  assert.equal(result.result.level, "A1");
});

// --- 16. typed answer normalization --------------------------------------

test("typed answer normalization ignores case and surrounding whitespace", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 26);

  // An oscillating A1/A2 profile runs the full MAX_QUESTIONS budget
  // (never stabilizes), which reliably exhausts each skill's multiple
  // choice options at some level and reaches its typed question.
  const start = await startPlacementAttempt(db, user.id);
  assert.equal(start.ok, true);
  if (!start.ok) return;

  let currentId = start.question.id;
  let typedQuestion: PlacementQuestionRow | null = null;
  for (let i = 0; i < 25; i++) {
    const row = await findQuestionById(db, currentId);
    if (!row) break;
    if (row.question_type === "typed_short_answer") {
      typedQuestion = row;
      break;
    }
    const res = await submitPlacementAnswer(db, user.id, start.attemptId, {
      questionId: currentId,
      answer:
        row.cefr_level === "A1"
          ? JSON.parse(row.accepted_answers_json)[0]
          : "wrong",
    });
    if (!res.ok || res.status === "completed") break;
    currentId = res.question.id;
  }

  assert.ok(
    typedQuestion,
    "expected to encounter a typed_short_answer question",
  );
  if (!typedQuestion) return;

  const accepted = JSON.parse(typedQuestion.accepted_answers_json)[0] as string;
  const messy = `   ${accepted.toUpperCase()}   `;

  const res = await submitPlacementAnswer(db, user.id, start.attemptId, {
    questionId: typedQuestion.id,
    answer: messy,
  });
  assert.equal(res.ok, true);

  const row = sqlite
    .prepare(
      "SELECT is_correct FROM placement_answers WHERE attempt_id = ? AND question_id = ?",
    )
    .get(start.attemptId, typedQuestion.id) as { is_correct: number };
  assert.equal(row.is_correct, 1);
});

// --- 17-20. completion side effects --------------------------------------

test("completion sets current_cefr_level, preserves self_reported_cefr_level, and marks onboarding completed", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 27);
  await setSelfReportedCefrLevel(db, user.id, "B1");

  const { result } = await runFixtureAttempt(db, user.id, always(true));
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const stored = await findUserById(db, user.id);
  assert.equal(stored?.current_cefr_level, result.result.level);
  assert.equal(stored?.self_reported_cefr_level, "B1"); // untouched
  assert.equal(stored?.onboarding_stage, "completed");
  assert.equal(stored?.onboarding_completed, 1);
});

// --- 21. historical attempts preserved, no casual retake -----------------

test("a completed attempt remains stored, and starting again is not offered automatically", async () => {
  const { db, sqlite } = createTestDb();
  const user = await makeUser(db, 28);

  const { attemptId } = await runFixtureAttempt(db, user.id, always(true));

  const stored = sqlite
    .prepare("SELECT status FROM placement_attempts WHERE id = ?")
    .get(attemptId) as { status: string };
  assert.equal(stored.status, "completed");

  const retake = await startPlacementAttempt(db, user.id);
  assert.equal(retake.ok, false);
  if (!retake.ok) assert.equal(retake.error.code, "not_eligible");

  const attemptCount = sqlite
    .prepare("SELECT COUNT(*) as n FROM placement_attempts WHERE user_id = ?")
    .get(user.id) as { n: number };
  assert.equal(attemptCount.n, 1); // no accidental second attempt was created
});

// --- 22-23. safe DTOs -----------------------------------------------------

test("the result endpoint returns a safe DTO with no answer keys or internal fields", async () => {
  const { db } = createTestDb();
  const user = await makeUser(db, 29);
  const { attemptId } = await runFixtureAttempt(db, user.id, always(true));

  const result = await getPlacementResult(db, user.id, attemptId);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(Object.keys(result.result).sort(), [
    "level",
    "scores",
    "selfReportedLevel",
    "strongestSkill",
    "weakestSkill",
  ]);
  for (const forbidden of [
    "answers",
    "acceptedAnswers",
    "rawScoring",
    "attemptId",
    "internal",
  ]) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(result.result, forbidden),
      false,
    );
  }
});
