import type {
  Db,
  DbStatement,
  FriendInviteRow,
  FriendshipRow,
} from "../db/types.ts";

export function findInviteByCode(
  db: Db,
  code: string,
): Promise<FriendInviteRow | null> {
  return db.first<FriendInviteRow>(
    "SELECT * FROM friend_invites WHERE code = ?",
    [code],
  );
}

export function findOpenInviteByUser(
  db: Db,
  userId: string,
): Promise<FriendInviteRow | null> {
  return db.first<FriendInviteRow>(
    `SELECT * FROM friend_invites
     WHERE inviter_user_id = ? AND accepted_by_user_id IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
}

export function createInviteStatement(
  code: string,
  inviterUserId: string,
  now: string,
): DbStatement {
  return {
    sql: `INSERT INTO friend_invites (code, inviter_user_id, created_at)
     VALUES (?, ?, ?)`,
    params: [code, inviterUserId, now],
  };
}

export function acceptInviteStatement(
  code: string,
  acceptedByUserId: string,
  now: string,
): DbStatement {
  return {
    sql: `UPDATE friend_invites
     SET accepted_by_user_id = ?, accepted_at = ?
     WHERE code = ? AND accepted_by_user_id IS NULL`,
    params: [acceptedByUserId, now, code],
  };
}

export function findFriend(
  db: Db,
  userId: string,
): Promise<FriendshipRow | null> {
  return db.first<FriendshipRow>(
    "SELECT * FROM friendships WHERE user_id = ? ORDER BY created_at ASC LIMIT 1",
    [userId],
  );
}

/** Stored in both directions so either side can look the pair up directly. */
export function linkFriendsStatements(
  userA: string,
  userB: string,
  now: string,
): DbStatement[] {
  const insert = (a: string, b: string): DbStatement => ({
    sql: `INSERT INTO friendships (user_id, friend_user_id, created_at)
     VALUES (?, ?, ?)
     ON CONFLICT (user_id, friend_user_id) DO NOTHING`,
    params: [a, b, now],
  });
  return [insert(userA, userB), insert(userB, userA)];
}

/** Completed learning sessions in a date range — the raw signal behind both
 * the personal and the shared weekly goal. */
export function countCompletedSessionsBetween(
  db: Db,
  userId: string,
  fromIso: string,
  toIso: string,
): Promise<{ n: number } | null> {
  return db.first<{ n: number }>(
    `SELECT
       (SELECT COUNT(*) FROM learning_sessions
         WHERE user_id = ? AND status = 'completed'
           AND completed_at >= ? AND completed_at < ?)
     + (SELECT COUNT(*) FROM review_sessions
         WHERE user_id = ? AND status = 'completed'
           AND completed_at >= ? AND completed_at < ?) AS n`,
    [userId, fromIso, toIso, userId, fromIso, toIso],
  );
}

/** Distinct days with at least one completed session — used for the honest
 * "sessions this week" and for re-entry detection. */
export function listActiveDays(
  db: Db,
  userId: string,
  fromIso: string,
): Promise<{ day: string }[]> {
  return db.all<{ day: string }>(
    `SELECT DISTINCT substr(completed_at, 1, 10) AS day
     FROM learning_sessions
     WHERE user_id = ? AND status = 'completed' AND completed_at >= ?
     ORDER BY day DESC`,
    [userId, fromIso],
  );
}

export function findLastCompletedSessionAt(
  db: Db,
  userId: string,
): Promise<{ completed_at: string } | null> {
  return db.first<{ completed_at: string }>(
    `SELECT completed_at FROM learning_sessions
     WHERE user_id = ? AND status = 'completed'
     ORDER BY completed_at DESC LIMIT 1`,
    [userId],
  );
}
