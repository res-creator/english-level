import type {
  Db,
  DbStatement,
  RewardSourceKindRow,
  UserCompanionRow,
  UserRewardRow,
} from "../db/types.ts";

// --- companion ------------------------------------------------------------

export function findCompanion(
  db: Db,
  userId: string,
): Promise<UserCompanionRow | null> {
  return db.first<UserCompanionRow>(
    "SELECT * FROM user_companion WHERE user_id = ?",
    [userId],
  );
}

/** Choosing again simply replaces the choice — nothing is lost by it. */
export function selectCompanionStatement(
  userId: string,
  companionId: string,
  now: string,
): DbStatement {
  return {
    sql: `INSERT INTO user_companion (user_id, companion_id, selected_at)
     VALUES (?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       companion_id = excluded.companion_id,
       selected_at = excluded.selected_at`,
    params: [userId, companionId, now],
  };
}

// --- rewards --------------------------------------------------------------

export function listRewards(db: Db, userId: string): Promise<UserRewardRow[]> {
  return db.all<UserRewardRow>(
    "SELECT * FROM user_rewards WHERE user_id = ? ORDER BY unlocked_at ASC",
    [userId],
  );
}

export function findReward(
  db: Db,
  userId: string,
  rewardId: string,
): Promise<UserRewardRow | null> {
  return db.first<UserRewardRow>(
    "SELECT * FROM user_rewards WHERE user_id = ? AND reward_id = ?",
    [userId, rewardId],
  );
}

/** Idempotent by construction: the primary key means the same reward can
 * never be granted twice, however many times the trigger fires. */
export function unlockRewardStatement(
  userId: string,
  rewardId: string,
  sourceKind: RewardSourceKindRow,
  sourceId: string | null,
  now: string,
): DbStatement {
  return {
    sql: `INSERT INTO user_rewards (user_id, reward_id, source_kind, source_id, unlocked_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id, reward_id) DO NOTHING`,
    params: [userId, rewardId, sourceKind, sourceId, now],
  };
}
