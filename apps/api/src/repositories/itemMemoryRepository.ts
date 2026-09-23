import type {
  Db,
  DbStatement,
  LessonItemContentTypeRow,
  UserItemMemoryRow,
} from "../db/types.ts";

/** Box -> how long until the item is worth seeing again. Deliberately
 * short and simple for V1; the table stores only box + due date, so the
 * curve can change later without a migration. */
const INTERVAL_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 16,
  5: 35,
};

export const MAX_BOX = 5;

export function intervalDaysFor(box: number): number {
  return INTERVAL_DAYS[Math.min(Math.max(box, 1), MAX_BOX)] ?? 1;
}

export function addDays(from: Date, days: number): string {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

export function listDueMemory(
  db: Db,
  userId: string,
  nowIso: string,
  limit: number,
): Promise<UserItemMemoryRow[]> {
  return db.all<UserItemMemoryRow>(
    `SELECT * FROM user_item_memory
     WHERE user_id = ? AND due_at <= ?
     ORDER BY box ASC, due_at ASC
     LIMIT ?`,
    [userId, nowIso, limit],
  );
}

export function countDueMemory(
  db: Db,
  userId: string,
  nowIso: string,
): Promise<{ n: number } | null> {
  return db.first<{ n: number }>(
    "SELECT COUNT(*) as n FROM user_item_memory WHERE user_id = ? AND due_at <= ?",
    [userId, nowIso],
  );
}

export function listMemory(
  db: Db,
  userId: string,
): Promise<UserItemMemoryRow[]> {
  return db.all<UserItemMemoryRow>(
    "SELECT * FROM user_item_memory WHERE user_id = ? ORDER BY updated_at DESC",
    [userId],
  );
}

export function findMemory(
  db: Db,
  userId: string,
  targetType: LessonItemContentTypeRow,
  targetId: string,
): Promise<UserItemMemoryRow | null> {
  return db.first<UserItemMemoryRow>(
    `SELECT * FROM user_item_memory
     WHERE user_id = ? AND target_type = ? AND target_id = ?`,
    [userId, targetType, targetId],
  );
}

/** First encounter: schedule the item for tomorrow. Re-running this for an
 * item already in memory must not reset its progress, so an existing row is
 * left alone apart from remembering which episode it came from. */
export function seedMemoryStatement(
  userId: string,
  targetType: LessonItemContentTypeRow,
  targetId: string,
  lessonId: string | null,
  now: Date,
): DbStatement {
  const nowIso = now.toISOString();
  return {
    sql: `INSERT INTO user_item_memory
       (user_id, target_type, target_id, lesson_id, box, due_at, first_seen_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?)
     ON CONFLICT (user_id, target_type, target_id) DO UPDATE SET
       lesson_id = COALESCE(user_item_memory.lesson_id, excluded.lesson_id)`,
    params: [
      userId,
      targetType,
      targetId,
      lessonId,
      addDays(now, intervalDaysFor(1)),
      nowIso,
      nowIso,
    ],
  };
}

/** A correct review moves the item one box up; a wrong one moves it a
 * single box down (never back to the start — that would punish a slip
 * harder than it deserves) and brings it back tomorrow. */
export function recordReviewStatement(
  userId: string,
  targetType: LessonItemContentTypeRow,
  targetId: string,
  currentBox: number,
  isCorrect: boolean,
  now: Date,
): DbStatement {
  const nextBox = isCorrect
    ? Math.min(currentBox + 1, MAX_BOX)
    : Math.max(currentBox - 1, 1);
  const dueAt = isCorrect
    ? addDays(now, intervalDaysFor(nextBox))
    : addDays(now, 1);
  return {
    sql: `UPDATE user_item_memory
     SET box = ?, due_at = ?, last_result = ?, reviews = reviews + 1,
         correct_streak = CASE WHEN ? = 1 THEN correct_streak + 1 ELSE 0 END,
         updated_at = ?
     WHERE user_id = ? AND target_type = ? AND target_id = ?`,
    params: [
      nextBox,
      dueAt,
      isCorrect ? "correct" : "wrong",
      isCorrect ? 1 : 0,
      now.toISOString(),
      userId,
      targetType,
      targetId,
    ],
  };
}

/** After a long absence intervals are recomputed from today rather than
 * leaving a pile of overdue items — coming back must never look like debt. */
export function rescheduleOverdueStatement(
  userId: string,
  nowIso: string,
  spreadFrom: Date,
  keepDueCount: number,
): DbStatement {
  return {
    sql: `UPDATE user_item_memory
     SET due_at = ?, updated_at = ?
     WHERE user_id = ? AND due_at <= ?
       AND target_id NOT IN (
         SELECT target_id FROM user_item_memory
         WHERE user_id = ? AND due_at <= ?
         ORDER BY box ASC, due_at ASC LIMIT ?
       )`,
    params: [
      addDays(spreadFrom, 1),
      nowIso,
      userId,
      nowIso,
      userId,
      nowIso,
      keepDueCount,
    ],
  };
}
