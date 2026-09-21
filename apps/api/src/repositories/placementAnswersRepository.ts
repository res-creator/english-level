import type { Db, PlacementAnswerRow } from "../db/types.ts";
import { generateId } from "../db/ids.ts";

export function findAnswer(
  db: Db,
  attemptId: string,
  questionId: string,
): Promise<PlacementAnswerRow | null> {
  return db.first<PlacementAnswerRow>(
    "SELECT * FROM placement_answers WHERE attempt_id = ? AND question_id = ?",
    [attemptId, questionId],
  );
}

export function listAnswersForAttempt(
  db: Db,
  attemptId: string,
): Promise<PlacementAnswerRow[]> {
  return db.all<PlacementAnswerRow>(
    "SELECT * FROM placement_answers WHERE attempt_id = ? ORDER BY created_at ASC",
    [attemptId],
  );
}

/**
 * Records a graded answer. The `UNIQUE (attempt_id, question_id)` DB
 * constraint is a second line of defense against double-counting; callers
 * should check `findAnswer` first so a duplicate submission gets a clean
 * response instead of a constraint-violation error.
 */
export async function recordAnswer(
  db: Db,
  input: {
    attemptId: string;
    questionId: string;
    answer: string;
    isCorrect: boolean;
    responseTimeMs?: number;
  },
): Promise<PlacementAnswerRow> {
  const id = generateId("pans");
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO placement_answers
       (id, attempt_id, question_id, answer, is_correct, response_time_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.attemptId,
      input.questionId,
      input.answer,
      input.isCorrect ? 1 : 0,
      input.responseTimeMs ?? null,
      now,
    ],
  );
  const created = await db.first<PlacementAnswerRow>(
    "SELECT * FROM placement_answers WHERE id = ?",
    [id],
  );
  if (!created) throw new Error(`Failed to load answer ${id} after insert`);
  return created;
}
