import type {
  Db,
  DbStatement,
  ExerciseAttemptRow,
  ExerciseTypeRow,
  LessonItemContentTypeRow,
} from "../db/types.ts";
import { generateId } from "../db/ids.ts";

/** The idempotency lookup: has this client-generated attemptId already
 * been recorded for this session? See `UNIQUE(session_id, attempt_key)`
 * in migrations/0006_lesson_sessions.sql. */
export function findAttemptByKey(
  db: Db,
  sessionId: string,
  attemptKey: string,
): Promise<ExerciseAttemptRow | null> {
  return db.first<ExerciseAttemptRow>(
    "SELECT * FROM exercise_attempts WHERE session_id = ? AND attempt_key = ?",
    [sessionId, attemptKey],
  );
}

export interface RecordAttemptInput {
  userId: string;
  sessionId: string;
  activityId: string;
  activityIndex: number;
  targetType: LessonItemContentTypeRow;
  targetId: string;
  exerciseType: ExerciseTypeRow;
  /** The user's actual submitted answer — never the correct answer. */
  answer: string;
  isCorrect: boolean;
  responseTimeMs: number | null;
  attemptKey: string;
}

/** Builds (without executing) the insert statement for one attempt — pure,
 * so it can be combined with the session/progress updates in one
 * `db.batch()` transaction. */
export function recordAttemptStatement(input: RecordAttemptInput): DbStatement {
  return {
    sql: `INSERT INTO exercise_attempts
       (id, user_id, session_id, activity_id, activity_index, target_type,
        target_id, exercise_type, answer, is_correct, response_time_ms,
        attempt_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      generateId("att"),
      input.userId,
      input.sessionId,
      input.activityId,
      input.activityIndex,
      input.targetType,
      input.targetId,
      input.exerciseType,
      input.answer,
      input.isCorrect ? 1 : 0,
      input.responseTimeMs,
      input.attemptKey,
    ],
  };
}
