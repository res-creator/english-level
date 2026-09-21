import { z } from "zod";
import type {
  Db,
  DbStatement,
  OnboardingStageRow,
  UserRow,
} from "../db/types.ts";
import { generateId } from "../db/ids.ts";

export const CreateUserInputSchema = z.object({
  telegramUserId: z.number().int().positive(),
  username: z.string().min(1).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1).optional(),
  interfaceLanguage: z.string().min(2).max(10).default("en"),
  timezone: z.string().min(1).optional(),
});
export type CreateUserInput = z.input<typeof CreateUserInputSchema>;

export function findUserById(db: Db, id: string): Promise<UserRow | null> {
  return db.first<UserRow>("SELECT * FROM users WHERE id = ?", [id]);
}

export function findUserByTelegramUserId(
  db: Db,
  telegramUserId: number,
): Promise<UserRow | null> {
  return db.first<UserRow>("SELECT * FROM users WHERE telegram_user_id = ?", [
    telegramUserId,
  ]);
}

export async function createUser(
  db: Db,
  input: CreateUserInput,
): Promise<UserRow> {
  const parsed = CreateUserInputSchema.parse(input);
  const id = generateId("usr");
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO users
       (id, telegram_user_id, username, first_name, last_name, interface_language, timezone, created_at, updated_at, last_active_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      parsed.telegramUserId,
      parsed.username ?? null,
      parsed.firstName,
      parsed.lastName ?? null,
      parsed.interfaceLanguage,
      parsed.timezone ?? null,
      now,
      now,
      now,
    ],
  );

  const created = await findUserById(db, id);
  if (!created) {
    throw new Error(`Failed to load user ${id} after insert`);
  }
  return created;
}

export const SyncTelegramProfileInputSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1).nullable(),
  username: z.string().min(1).nullable(),
  interfaceLanguage: z.string().min(2).max(10).optional(),
});
export type SyncTelegramProfileInput = z.infer<
  typeof SyncTelegramProfileInputSchema
>;

/**
 * Safely syncs the current Telegram-reported profile fields onto an
 * existing user (first/last name, username, and interface language when
 * Telegram provides one) and bumps `last_active_at`. Never touches
 * onboarding/level/status or anything owned by `user_settings`.
 */
export async function syncTelegramProfile(
  db: Db,
  userId: string,
  input: SyncTelegramProfileInput,
): Promise<UserRow> {
  const parsed = SyncTelegramProfileInputSchema.parse(input);
  const now = new Date().toISOString();

  const sets = [
    "first_name = ?",
    "last_name = ?",
    "username = ?",
    "updated_at = ?",
    "last_active_at = ?",
  ];
  const values: unknown[] = [
    parsed.firstName,
    parsed.lastName,
    parsed.username,
    now,
    now,
  ];
  if (parsed.interfaceLanguage !== undefined) {
    sets.push("interface_language = ?");
    values.push(parsed.interfaceLanguage);
  }
  values.push(userId);

  await db.run(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, values);

  const updated = await findUserById(db, userId);
  if (!updated) {
    throw new Error(`User ${userId} not found after profile sync`);
  }
  return updated;
}

/** Advances (or otherwise sets) `onboarding_stage`. Onboarding-internal —
 * callers should go through `onboardingService`, not call this directly. */
export async function setOnboardingStage(
  db: Db,
  userId: string,
  stage: OnboardingStageRow,
): Promise<UserRow> {
  await db.run(
    "UPDATE users SET onboarding_stage = ?, updated_at = ? WHERE id = ?",
    [stage, new Date().toISOString(), userId],
  );
  const updated = await findUserById(db, userId);
  if (!updated) {
    throw new Error(`User ${userId} not found after onboarding stage update`);
  }
  return updated;
}

/** Sets the user's self-reported (unverified) CEFR level, or null for
 * "I don't know". Never touches `current_cefr_level`. */
export async function setSelfReportedCefrLevel(
  db: Db,
  userId: string,
  level: "A1" | "A2" | "B1" | "B2" | null,
): Promise<UserRow> {
  await db.run(
    "UPDATE users SET self_reported_cefr_level = ?, updated_at = ? WHERE id = ?",
    [level, new Date().toISOString(), userId],
  );
  const updated = await findUserById(db, userId);
  if (!updated) {
    throw new Error(`User ${userId} not found after level update`);
  }
  return updated;
}

/**
 * Builds (without executing) the statement that sets `current_cefr_level`
 * and completes onboarding — the one legitimate way those fields change.
 * Pure, so `placementService.finalizeAttempt` can combine it with the
 * matching `placement_attempts` completion statement in a single
 * `db.batch()` transaction: both rows change together or neither does.
 */
export function completeOnboardingWithVerifiedLevelStatement(
  userId: string,
  verifiedLevel: "A1" | "A2" | "B1" | "B2",
  now: string,
): DbStatement {
  return {
    sql: `UPDATE users
     SET current_cefr_level = ?, onboarding_stage = 'completed', onboarding_completed = 1, updated_at = ?
     WHERE id = ?`,
    params: [verifiedLevel, now, userId],
  };
}

/**
 * Executes the same update as `completeOnboardingWithVerifiedLevelStatement`
 * directly (not batched). Used only to *repair* a user row that's fallen
 * out of sync with an already-completed, already-scored attempt — see
 * `placementService.repairUserStateIfNeeded`. The normal completion path
 * goes through the batch, not this.
 */
export async function completeOnboardingWithVerifiedLevel(
  db: Db,
  userId: string,
  verifiedLevel: "A1" | "A2" | "B1" | "B2",
): Promise<UserRow> {
  const statement = completeOnboardingWithVerifiedLevelStatement(
    userId,
    verifiedLevel,
    new Date().toISOString(),
  );
  await db.run(statement.sql, statement.params);
  const updated = await findUserById(db, userId);
  if (!updated) {
    throw new Error(`User ${userId} not found after placement completion`);
  }
  return updated;
}
