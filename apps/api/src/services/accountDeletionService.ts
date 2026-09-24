import type { Db } from "../db/types.ts";
import { clearLearningStateStatements } from "./previewResetService.ts";

/**
 * Real, production-safe account deletion — unlike the preview reset, this
 * removes the account itself. It reuses the exact same learning-state
 * clearing statements the preview reset already uses (and that
 * `test/previewReset.test.ts` already verifies clear every table they
 * claim to), then deletes the user's sessions and the `users` row.
 *
 * `analytics_events`/`error_logs` are deliberately left alone: both
 * columns are `user_id ... ON DELETE SET NULL`, so deleting the account
 * anonymizes those rows instead of erasing them — the account disappears,
 * the record of what happened during the pilot doesn't, same principle
 * the preview reset already applies to `preview_account_reset` events.
 *
 * Runs as one `db.batch()`: a half-deleted account would be worse than a
 * failed delete.
 */
export async function deleteAccount(db: Db, userId: string): Promise<void> {
  await db.batch([
    ...clearLearningStateStatements(userId),
    { sql: "DELETE FROM sessions WHERE user_id = ?", params: [userId] },
    { sql: "DELETE FROM users WHERE id = ?", params: [userId] },
  ]);
}
