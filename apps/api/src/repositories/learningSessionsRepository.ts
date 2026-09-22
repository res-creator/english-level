import type { Db, DbStatement, LearningSessionRow } from "../db/types.ts";
import { generateId } from "../db/ids.ts";

export function findSessionById(
  db: Db,
  id: string,
): Promise<LearningSessionRow | null> {
  return db.first<LearningSessionRow>(
    "SELECT * FROM learning_sessions WHERE id = ?",
    [id],
  );
}

/** The user's current in_progress session for this lesson, if any — used
 * so starting a lesson resumes rather than creating a second session. */
export function findActiveSessionForLesson(
  db: Db,
  userId: string,
  lessonId: string,
): Promise<LearningSessionRow | null> {
  return db.first<LearningSessionRow>(
    `SELECT * FROM learning_sessions
     WHERE user_id = ? AND lesson_id = ? AND status = 'in_progress'
     ORDER BY started_at DESC LIMIT 1`,
    [userId, lessonId],
  );
}

/** Generates the new session's id up front so the caller can reference it
 * (e.g. `user_lesson_progress.last_session_id`) in the same `db.batch()`
 * as the insert statement this returns. */
export function newSessionId(): string {
  return generateId("lsn");
}

/** Builds (without executing) the insert statement for a new session —
 * pure, so callers can combine it with the matching `user_lesson_progress`
 * start statement in one `db.batch()`. */
export function createSessionStatement(
  id: string,
  userId: string,
  lessonId: string,
  activitiesJson: string,
  now: string,
): DbStatement {
  return {
    sql: `INSERT INTO learning_sessions
       (id, user_id, lesson_id, session_type, status, started_at,
        current_position, correct_count, wrong_count, activities_json,
        created_at, updated_at)
     VALUES (?, ?, ?, 'lesson', 'in_progress', ?, 0, 0, 0, ?, ?, ?)`,
    params: [id, userId, lessonId, now, activitiesJson, now, now],
  };
}

/** Builds (without executing) the statement that advances a session's
 * position/counters/plan — the plan JSON is rewritten too since a wrong
 * answer may have spliced a retry activity into it. */
export function advanceSessionStatement(
  sessionId: string,
  patch: {
    currentPosition: number;
    correctCount: number;
    wrongCount: number;
    activitiesJson: string;
  },
): DbStatement {
  return {
    sql: `UPDATE learning_sessions
     SET current_position = ?, correct_count = ?, wrong_count = ?,
         activities_json = ?, updated_at = ?
     WHERE id = ?`,
    params: [
      patch.currentPosition,
      patch.correctCount,
      patch.wrongCount,
      patch.activitiesJson,
      new Date().toISOString(),
      sessionId,
    ],
  };
}

/** Builds (without executing) the statement that completes a session.
 * Pure, so callers combine it with the matching `user_lesson_progress`
 * update and the final `exercise_attempts` insert in one `db.batch()` —
 * see `lessonSessionService`, mirroring the Phase 4 placement pattern. */
export function completeSessionStatement(
  sessionId: string,
  patch: {
    currentPosition: number;
    correctCount: number;
    wrongCount: number;
    activitiesJson: string;
  },
  now: string,
): DbStatement {
  return {
    sql: `UPDATE learning_sessions
     SET status = 'completed', completed_at = ?, current_position = ?,
         correct_count = ?, wrong_count = ?, activities_json = ?, updated_at = ?
     WHERE id = ?`,
    params: [
      now,
      patch.currentPosition,
      patch.correctCount,
      patch.wrongCount,
      patch.activitiesJson,
      now,
      sessionId,
    ],
  };
}
