import { z } from "zod";
import type { Db, UserRow } from "../db/types.ts";
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
