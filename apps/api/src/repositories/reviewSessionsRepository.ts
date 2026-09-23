import type { Db, DbStatement, ReviewSessionRow } from "../db/types.ts";
import { generateId } from "../db/ids.ts";

export function newReviewSessionId(): string {
  return generateId("rev");
}

export function findReviewSessionById(
  db: Db,
  id: string,
): Promise<ReviewSessionRow | null> {
  return db.first<ReviewSessionRow>(
    "SELECT * FROM review_sessions WHERE id = ?",
    [id],
  );
}

export function findActiveReviewSession(
  db: Db,
  userId: string,
): Promise<ReviewSessionRow | null> {
  return db.first<ReviewSessionRow>(
    `SELECT * FROM review_sessions
     WHERE user_id = ? AND status = 'in_progress'
     ORDER BY started_at DESC LIMIT 1`,
    [userId],
  );
}

export function createReviewSessionStatement(
  id: string,
  userId: string,
  activitiesJson: string,
  now: string,
): DbStatement {
  return {
    sql: `INSERT INTO review_sessions
       (id, user_id, status, started_at, current_position, correct_count,
        wrong_count, activities_json, created_at, updated_at)
     VALUES (?, ?, 'in_progress', ?, 0, 0, 0, ?, ?, ?)`,
    params: [id, userId, now, activitiesJson, now, now],
  };
}

export function advanceReviewSessionStatement(
  id: string,
  patch: { currentPosition: number; correctCount: number; wrongCount: number },
  now: string,
): DbStatement {
  return {
    sql: `UPDATE review_sessions
     SET current_position = ?, correct_count = ?, wrong_count = ?, updated_at = ?
     WHERE id = ?`,
    params: [
      patch.currentPosition,
      patch.correctCount,
      patch.wrongCount,
      now,
      id,
    ],
  };
}

export function completeReviewSessionStatement(
  id: string,
  patch: { currentPosition: number; correctCount: number; wrongCount: number },
  now: string,
): DbStatement {
  return {
    sql: `UPDATE review_sessions
     SET status = 'completed', completed_at = ?, current_position = ?,
         correct_count = ?, wrong_count = ?, updated_at = ?
     WHERE id = ?`,
    params: [
      now,
      patch.currentPosition,
      patch.correctCount,
      patch.wrongCount,
      now,
      id,
    ],
  };
}
