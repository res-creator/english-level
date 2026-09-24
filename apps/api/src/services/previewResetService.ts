import type { Db, DbStatement } from "../db/types.ts";
import { eventStatement } from "./analyticsService.ts";

/**
 * Preview-only account reset, for testing the first-run experience without
 * needing a second Telegram account.
 *
 * It wipes the signed-in user's **learning state** and puts their account
 * back to the moment before onboarding — but it never deletes the account
 * itself, and never touches another user's rows. The environment guard
 * lives in the route (`routes/me.ts`); this module is the plain data
 * operation, which is what makes it testable.
 *
 * Everything runs in one `db.batch()`, so the reset either happens
 * completely or not at all: a half-reset account would be worse than no
 * reset at all.
 */

/** What the reset cleared, counted from the rows that were really there —
 * the UI shows this rather than claiming success generically. */
export interface PreviewResetSummary {
  learningSessions: number;
  exerciseAttempts: number;
  reviewSessions: number;
  itemMemory: number;
  capabilities: number;
  lessonProgress: number;
  placementAttempts: number;
  rewards: number;
  companion: number;
  friendships: number;
  friendInvites: number;
}

async function countRows(
  db: Db,
  sql: string,
  params: unknown[],
): Promise<number> {
  const row = await db.first<{ n: number }>(sql, params);
  return row?.n ?? 0;
}

async function summarize(db: Db, userId: string): Promise<PreviewResetSummary> {
  const count = (sql: string, params: unknown[] = [userId]) =>
    countRows(db, sql, params);
  return {
    learningSessions: await count(
      "SELECT COUNT(*) n FROM learning_sessions WHERE user_id = ?",
    ),
    exerciseAttempts: await count(
      "SELECT COUNT(*) n FROM exercise_attempts WHERE user_id = ?",
    ),
    reviewSessions: await count(
      "SELECT COUNT(*) n FROM review_sessions WHERE user_id = ?",
    ),
    itemMemory: await count(
      "SELECT COUNT(*) n FROM user_item_memory WHERE user_id = ?",
    ),
    capabilities: await count(
      "SELECT COUNT(*) n FROM user_capabilities WHERE user_id = ?",
    ),
    lessonProgress: await count(
      "SELECT COUNT(*) n FROM user_lesson_progress WHERE user_id = ?",
    ),
    placementAttempts: await count(
      "SELECT COUNT(*) n FROM placement_attempts WHERE user_id = ?",
    ),
    rewards: await count(
      "SELECT COUNT(*) n FROM user_rewards WHERE user_id = ?",
    ),
    companion: await count(
      "SELECT COUNT(*) n FROM user_companion WHERE user_id = ?",
    ),
    friendships: await count(
      "SELECT COUNT(*) n FROM friendships WHERE user_id = ? OR friend_user_id = ?",
      [userId, userId],
    ),
    friendInvites: await count(
      "SELECT COUNT(*) n FROM friend_invites WHERE inviter_user_id = ? OR accepted_by_user_id = ?",
      [userId, userId],
    ),
  };
}

function resetStatements(userId: string, now: string): DbStatement[] {
  const own = (sql: string): DbStatement => ({ sql, params: [userId] });
  return [
    // --- lesson execution ---------------------------------------------
    // Order matters: `user_lesson_progress.last_session_id` points at a
    // session row, so the progress rows have to go first.
    own("DELETE FROM exercise_attempts WHERE user_id = ?"),
    own("DELETE FROM user_lesson_progress WHERE user_id = ?"),
    own("DELETE FROM learning_sessions WHERE user_id = ?"),

    // --- review, memory and proven capability --------------------------
    own("DELETE FROM review_sessions WHERE user_id = ?"),
    own("DELETE FROM user_item_memory WHERE user_id = ?"),
    own("DELETE FROM user_capabilities WHERE user_id = ?"),

    // --- placement ------------------------------------------------------
    own(
      `DELETE FROM placement_answers
       WHERE attempt_id IN (SELECT id FROM placement_attempts WHERE user_id = ?)`,
    ),
    own("DELETE FROM placement_attempts WHERE user_id = ?"),

    // --- companion, rewards and the space -------------------------------
    own("DELETE FROM user_rewards WHERE user_id = ?"),
    own("DELETE FROM user_companion WHERE user_id = ?"),

    // --- the friend connection ------------------------------------------
    // Both directions, so the other side isn't left with a dangling
    // friend who no longer has them.
    {
      sql: "DELETE FROM friendships WHERE user_id = ? OR friend_user_id = ?",
      params: [userId, userId],
    },
    {
      sql: `DELETE FROM friend_invites
            WHERE inviter_user_id = ? OR accepted_by_user_id = ?`,
      params: [userId, userId],
    },

    // --- onboarding, level and return state -----------------------------
    // The account survives; only what it learned is cleared. Telegram
    // identity (id, telegram_user_id, name) is deliberately untouched, so
    // the current session stays valid and the app simply reopens at
    // onboarding.
    {
      sql: `UPDATE users
            SET onboarding_completed = 0,
                onboarding_stage = 'goals',
                self_reported_cefr_level = NULL,
                current_cefr_level = NULL,
                last_active_at = NULL,
                updated_at = ?
            WHERE id = ?`,
      params: [now, userId],
    },
    // Preferences collected during onboarding go back to their defaults,
    // so the flow asks for them again instead of silently pre-filling.
    {
      sql: `UPDATE user_settings
            SET daily_minutes = 10,
                learning_goals_json = '[]',
                updated_at = ?
            WHERE user_id = ?`,
      params: [now, userId],
    },
  ];
}

/**
 * Resets the user and reports what was actually cleared. Idempotent: a
 * second reset succeeds and simply reports zeroes.
 */
export async function resetPreviewAccount(
  db: Db,
  userId: string,
  now: Date = new Date(),
): Promise<PreviewResetSummary> {
  const summary = await summarize(db, userId);
  const nowIso = now.toISOString();
  await db.batch([
    ...resetStatements(userId, nowIso),
    // Recorded, not cleared: the reset wipes what the account *knows*,
    // never the log of what it *did* — a pilot tester resetting their
    // own account mid-session is itself a data point worth keeping.
    eventStatement("preview_account_reset", { userId }, nowIso),
  ]);
  return summary;
}
