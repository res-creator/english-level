import type { Db, DbStatement, UserLessonProgressRow } from "../db/types.ts";

export function findProgress(
  db: Db,
  userId: string,
  lessonId: string,
): Promise<UserLessonProgressRow | null> {
  return db.first<UserLessonProgressRow>(
    "SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id = ?",
    [userId, lessonId],
  );
}

/** All progress rows for a user across a set of lessons, keyed by lesson
 * id — used to annotate a module's lesson list without one query per
 * lesson. Lessons with no row are simply absent from the map (treat as
 * not_started). */
export async function listProgressForLessons(
  db: Db,
  userId: string,
  lessonIds: string[],
): Promise<Map<string, UserLessonProgressRow>> {
  if (lessonIds.length === 0) return new Map();
  const placeholders = lessonIds.map(() => "?").join(", ");
  const rows = await db.all<UserLessonProgressRow>(
    `SELECT * FROM user_lesson_progress WHERE user_id = ? AND lesson_id IN (${placeholders})`,
    [userId, ...lessonIds],
  );
  return new Map(rows.map((r) => [r.lesson_id, r]));
}

/**
 * Builds (without executing) the upsert run exactly once per NEW session
 * (a resumed session does not call this again). Bumps `attempt_count` on
 * every start, including a replay of an already-completed lesson — see
 * docs/lesson-engine.md ("Replay"). Never regresses a completed lesson
 * back to in_progress.
 */
export function startProgressStatement(
  userId: string,
  lessonId: string,
  sessionId: string,
  now: string,
): DbStatement {
  return {
    sql: `INSERT INTO user_lesson_progress
       (user_id, lesson_id, status, started_at, attempt_count, last_session_id, updated_at)
     VALUES (?, ?, 'in_progress', ?, 1, ?, ?)
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET
       status = CASE WHEN status = 'completed' THEN status ELSE 'in_progress' END,
       started_at = COALESCE(started_at, excluded.started_at),
       attempt_count = attempt_count + 1,
       last_session_id = excluded.last_session_id,
       updated_at = excluded.updated_at`,
    params: [userId, lessonId, now, sessionId, now],
  };
}

/** Builds (without executing) the statement that marks a lesson's
 * progress completed — combined with the matching `learning_sessions`
 * completion statement in one `db.batch()`, same pattern as Phase 4
 * placement finalization. */
export function completeProgressStatement(
  userId: string,
  lessonId: string,
  patch: { sessionId: string; accuracy: number },
  now: string,
): DbStatement {
  return {
    sql: `UPDATE user_lesson_progress
     SET status = 'completed', completed_at = ?, accuracy = ?, last_session_id = ?, updated_at = ?
     WHERE user_id = ? AND lesson_id = ?`,
    params: [now, patch.accuracy, patch.sessionId, now, userId, lessonId],
  };
}
