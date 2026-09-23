import type {
  CapabilityStateRow,
  Db,
  DbStatement,
  UserCapabilityRow,
} from "../db/types.ts";

export function findCapability(
  db: Db,
  userId: string,
  lessonId: string,
): Promise<UserCapabilityRow | null> {
  return db.first<UserCapabilityRow>(
    "SELECT * FROM user_capabilities WHERE user_id = ? AND lesson_id = ?",
    [userId, lessonId],
  );
}

export function listCapabilities(
  db: Db,
  userId: string,
): Promise<UserCapabilityRow[]> {
  return db.all<UserCapabilityRow>(
    "SELECT * FROM user_capabilities WHERE user_id = ?",
    [userId],
  );
}

export async function listCapabilitiesForLessons(
  db: Db,
  userId: string,
  lessonIds: string[],
): Promise<Map<string, UserCapabilityRow>> {
  if (lessonIds.length === 0) return new Map();
  const placeholders = lessonIds.map(() => "?").join(", ");
  const rows = await db.all<UserCapabilityRow>(
    `SELECT * FROM user_capabilities WHERE user_id = ? AND lesson_id IN (${placeholders})`,
    [userId, ...lessonIds],
  );
  return new Map(rows.map((r) => [r.lesson_id, r]));
}

/** Records that the learner has started this episode, without ever
 * regressing a capability that is already earned. */
export function startCapabilityStatement(
  userId: string,
  lessonId: string,
  sessionsTotal: number,
  now: string,
): DbStatement {
  return {
    sql: `INSERT INTO user_capabilities
       (user_id, lesson_id, state, sessions_done, sessions_total, started_at, updated_at)
     VALUES (?, ?, 'learning', 0, ?, ?, ?)
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET
       sessions_total = excluded.sessions_total,
       updated_at = excluded.updated_at`,
    params: [userId, lessonId, sessionsTotal, now, now],
  };
}

/** One finished daily session of the episode. */
export function advanceSessionsDoneStatement(
  userId: string,
  lessonId: string,
  sessionsDone: number,
  now: string,
): DbStatement {
  return {
    sql: `UPDATE user_capabilities
     SET sessions_done = ?, updated_at = ?
     WHERE user_id = ? AND lesson_id = ?`,
    params: [sessionsDone, now, userId, lessonId],
  };
}

export function recordMissionAttemptStatement(
  userId: string,
  lessonId: string,
  passed: boolean,
  now: string,
): DbStatement {
  if (!passed) {
    return {
      sql: `UPDATE user_capabilities
       SET mission_attempts = mission_attempts + 1, updated_at = ?
       WHERE user_id = ? AND lesson_id = ?`,
      params: [now, userId, lessonId],
    };
  }
  // A passed Mission promotes LEARNING -> CAN DO. An already consolidated
  // capability is never demoted by a replay.
  return {
    sql: `UPDATE user_capabilities
     SET mission_attempts = mission_attempts + 1,
         state = CASE WHEN state = 'consolidated' THEN 'consolidated' ELSE 'can_do' END,
         can_do_at = COALESCE(can_do_at, ?),
         updated_at = ?
     WHERE user_id = ? AND lesson_id = ?`,
    params: [now, now, userId, lessonId],
  };
}

/** CAN DO -> CONSOLIDATED, only ever from a successful spaced review. */
export function consolidateStatement(
  userId: string,
  lessonId: string,
  now: string,
): DbStatement {
  return {
    sql: `UPDATE user_capabilities
     SET state = 'consolidated', consolidated_at = ?, updated_at = ?
     WHERE user_id = ? AND lesson_id = ? AND state = 'can_do'`,
    params: [now, now, userId, lessonId],
  };
}

export function isAtLeast(
  state: CapabilityStateRow,
  target: CapabilityStateRow,
): boolean {
  const order: CapabilityStateRow[] = ["learning", "can_do", "consolidated"];
  return order.indexOf(state) >= order.indexOf(target);
}
