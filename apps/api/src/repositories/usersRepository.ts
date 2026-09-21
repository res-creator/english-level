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
       (id, telegram_user_id, username, first_name, last_name, interface_language, timezone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ],
  );

  const created = await findUserById(db, id);
  if (!created) {
    throw new Error(`Failed to load user ${id} after insert`);
  }
  return created;
}
