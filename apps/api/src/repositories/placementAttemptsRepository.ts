import type {
  CefrLevelRow,
  Db,
  DbStatement,
  PlacementAttemptRow,
  PlacementSkillRow,
} from "../db/types.ts";
import { generateId } from "../db/ids.ts";

export function findAttemptById(
  db: Db,
  id: string,
): Promise<PlacementAttemptRow | null> {
  return db.first<PlacementAttemptRow>(
    "SELECT * FROM placement_attempts WHERE id = ?",
    [id],
  );
}

/** The user's current in_progress attempt for this test version, if any. */
export function findActiveAttempt(
  db: Db,
  userId: string,
  testVersion: string,
): Promise<PlacementAttemptRow | null> {
  return db.first<PlacementAttemptRow>(
    `SELECT * FROM placement_attempts
     WHERE user_id = ? AND test_version = ? AND status = 'in_progress'
     ORDER BY started_at DESC LIMIT 1`,
    [userId, testVersion],
  );
}

export function findLatestCompletedAttempt(
  db: Db,
  userId: string,
  testVersion: string,
): Promise<PlacementAttemptRow | null> {
  return db.first<PlacementAttemptRow>(
    `SELECT * FROM placement_attempts
     WHERE user_id = ? AND test_version = ? AND status = 'completed'
     ORDER BY completed_at DESC LIMIT 1`,
    [userId, testVersion],
  );
}

export async function createAttempt(
  db: Db,
  userId: string,
  testVersion: string,
  startLevel: CefrLevelRow,
  firstQuestionId: string,
): Promise<PlacementAttemptRow> {
  const id = generateId("pat");
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO placement_attempts
       (id, user_id, test_version, status, started_at, current_level_pointer, current_question_id)
     VALUES (?, ?, ?, 'in_progress', ?, ?, ?)`,
    [id, userId, testVersion, now, startLevel, firstQuestionId],
  );
  const created = await findAttemptById(db, id);
  if (!created) throw new Error(`Failed to load attempt ${id} after insert`);
  return created;
}

/** Persists adaptive-engine state and issues the next question. */
export async function advanceAttempt(
  db: Db,
  attemptId: string,
  patch: {
    currentLevelPointer: CefrLevelRow;
    consecutiveCorrect: number;
    consecutiveIncorrect: number;
    answersSinceLevelChange: number;
    currentQuestionId: string | null;
  },
): Promise<PlacementAttemptRow> {
  await db.run(
    `UPDATE placement_attempts
     SET current_level_pointer = ?, consecutive_correct = ?, consecutive_incorrect = ?,
         answers_since_level_change = ?, current_question_id = ?
     WHERE id = ?`,
    [
      patch.currentLevelPointer,
      patch.consecutiveCorrect,
      patch.consecutiveIncorrect,
      patch.answersSinceLevelChange,
      patch.currentQuestionId,
      attemptId,
    ],
  );
  const updated = await findAttemptById(db, attemptId);
  if (!updated) throw new Error(`Attempt ${attemptId} not found after update`);
  return updated;
}

export interface PlacementCompletionResult {
  resultLevel: CefrLevelRow;
  vocabularyScore: number;
  grammarScore: number;
  readingScore: number;
  activeEnglishScore: number;
  strongestSkill: PlacementSkillRow;
  weakestSkill: PlacementSkillRow;
}

/**
 * Builds (without executing) the statement that marks an attempt
 * completed and persists its result. Pure, so callers can combine it with
 * the matching user-row update in a single `db.batch()` transaction — see
 * `placementService.finalizeAttempt`, which is the only place this should
 * be used; nothing else should complete an attempt non-atomically.
 */
export function completeAttemptStatement(
  attemptId: string,
  result: PlacementCompletionResult,
  now: string,
): DbStatement {
  return {
    sql: `UPDATE placement_attempts
     SET status = 'completed', completed_at = ?, current_question_id = NULL,
         result_level = ?, vocabulary_score = ?, grammar_score = ?,
         reading_score = ?, active_english_score = ?,
         strongest_skill = ?, weakest_skill = ?
     WHERE id = ?`,
    params: [
      now,
      result.resultLevel,
      result.vocabularyScore,
      result.grammarScore,
      result.readingScore,
      result.activeEnglishScore,
      result.strongestSkill,
      result.weakestSkill,
      attemptId,
    ],
  };
}
