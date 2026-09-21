import type { Db, PlacementQuestionRow } from "../../src/db/types.ts";
import { findQuestionById } from "../../src/repositories/placementQuestionsRepository.ts";
import {
  startPlacementAttempt,
  submitPlacementAnswer,
  getPlacementResult,
  type PlacementResultResult,
} from "../../src/services/placementService.ts";

const WRONG_ANSWER = "zzz_definitely_not_the_answer_zzz";

function correctAnswerFor(question: PlacementQuestionRow): string {
  const accepted: string[] = JSON.parse(question.accepted_answers_json);
  const first = accepted[0];
  if (!first)
    throw new Error(`question ${question.id} has no accepted answers`);
  return first;
}

/**
 * Drives a placement attempt to completion using the real service
 * functions (start -> repeated answer -> completed), deciding correctness
 * per question via `shouldAnswerCorrectly`. Used to build deterministic
 * fixture learners (a clear A1 learner, a clear B2 learner, a mixed
 * profile, ...).
 */
export async function runFixtureAttempt(
  db: Db,
  userId: string,
  shouldAnswerCorrectly: (question: PlacementQuestionRow) => boolean,
): Promise<{
  attemptId: string;
  result: PlacementResultResult;
  answeredCount: number;
}> {
  const start = await startPlacementAttempt(db, userId);
  if (!start.ok) {
    throw new Error(`start failed: ${JSON.stringify(start.error)}`);
  }

  const attemptId = start.attemptId;
  let currentQuestionId = start.question.id;
  let answeredCount = 0;

  for (let guard = 0; guard < 100; guard++) {
    const questionRow = await findQuestionById(db, currentQuestionId);
    if (!questionRow)
      throw new Error(`question ${currentQuestionId} not found`);

    const correct = shouldAnswerCorrectly(questionRow);
    const answer = correct ? correctAnswerFor(questionRow) : WRONG_ANSWER;

    const res = await submitPlacementAnswer(db, userId, attemptId, {
      questionId: currentQuestionId,
      answer,
    });
    if (!res.ok) throw new Error(`answer failed: ${JSON.stringify(res.error)}`);
    answeredCount += 1;

    if (res.status === "completed") {
      const result = await getPlacementResult(db, userId, attemptId);
      return { attemptId, result, answeredCount };
    }
    currentQuestionId = res.question.id;
  }

  throw new Error("fixture attempt did not complete within 100 answers");
}

export function onlyLevel(level: "A1" | "A2" | "B1" | "B2") {
  return (question: PlacementQuestionRow) => question.cefr_level === level;
}

export function upToLevel(maxLevel: "A1" | "A2" | "B1" | "B2") {
  const order = ["A1", "A2", "B1", "B2"];
  const maxIndex = order.indexOf(maxLevel);
  return (question: PlacementQuestionRow) =>
    order.indexOf(question.cefr_level) <= maxIndex;
}

export function always(correct: boolean) {
  return () => correct;
}
