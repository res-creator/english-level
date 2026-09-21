import { z } from "zod";
import type { Db, UserAcquisitionRow } from "../db/types.ts";

export const RecordFirstTouchInputSchema = z.object({
  userId: z.string().min(1),
  source: z.string().min(1).optional(),
  campaign: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  referrerUserId: z.string().min(1).optional(),
});
export type RecordFirstTouchInput = z.input<typeof RecordFirstTouchInputSchema>;

export function getUserAcquisition(
  db: Db,
  userId: string,
): Promise<UserAcquisitionRow | null> {
  return db.first<UserAcquisitionRow>(
    "SELECT * FROM user_acquisition WHERE user_id = ?",
    [userId],
  );
}

/**
 * Records the first-touch acquisition row for a user, if one doesn't exist
 * yet. Idempotent: calling it again for the same user is a no-op that
 * returns the original record rather than overwriting it.
 */
export async function recordFirstTouch(
  db: Db,
  input: RecordFirstTouchInput,
): Promise<UserAcquisitionRow> {
  const parsed = RecordFirstTouchInputSchema.parse(input);

  const existing = await getUserAcquisition(db, parsed.userId);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO user_acquisition
       (user_id, source, campaign, content, referrer_user_id, first_touch_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      parsed.userId,
      parsed.source ?? null,
      parsed.campaign ?? null,
      parsed.content ?? null,
      parsed.referrerUserId ?? null,
      now,
    ],
  );

  const created = await getUserAcquisition(db, parsed.userId);
  if (!created) {
    throw new Error(
      `Failed to load acquisition record for user ${parsed.userId} after insert`,
    );
  }
  return created;
}
