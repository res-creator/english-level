import { z } from "zod";
import type { Db, UserSettingsRow } from "../db/types.ts";

export const DAILY_MINUTES_VALUES = [5, 10, 15] as const;

export const UpdateUserSettingsInputSchema = z.object({
  dailyMinutes: z
    .union([z.literal(5), z.literal(10), z.literal(15)])
    .optional(),
  learningGoals: z.array(z.string()).optional(),
  preferredAccent: z.string().min(1).optional(),
  interfaceLanguage: z.string().min(2).max(10).optional(),
  dailyReminderEnabled: z.boolean().optional(),
  dailyReminderPeriod: z.string().min(1).optional(),
  reviewNotifications: z.boolean().optional(),
  streakNotifications: z.boolean().optional(),
  duoNotifications: z.boolean().optional(),
  weeklyReportNotifications: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietStart: z.string().min(1).optional(),
  quietEnd: z.string().min(1).optional(),
  showLevelToDuo: z.boolean().optional(),
});
export type UpdateUserSettingsInput = z.infer<
  typeof UpdateUserSettingsInputSchema
>;

// camelCase input field -> snake_case column, plus how to serialize it.
const FIELD_COLUMNS: Record<
  keyof UpdateUserSettingsInput,
  { column: string; kind: "raw" | "bool" | "json" }
> = {
  dailyMinutes: { column: "daily_minutes", kind: "raw" },
  learningGoals: { column: "learning_goals_json", kind: "json" },
  preferredAccent: { column: "preferred_accent", kind: "raw" },
  interfaceLanguage: { column: "interface_language", kind: "raw" },
  dailyReminderEnabled: { column: "daily_reminder_enabled", kind: "bool" },
  dailyReminderPeriod: { column: "daily_reminder_period", kind: "raw" },
  reviewNotifications: { column: "review_notifications", kind: "bool" },
  streakNotifications: { column: "streak_notifications", kind: "bool" },
  duoNotifications: { column: "duo_notifications", kind: "bool" },
  weeklyReportNotifications: {
    column: "weekly_report_notifications",
    kind: "bool",
  },
  quietHoursEnabled: { column: "quiet_hours_enabled", kind: "bool" },
  quietStart: { column: "quiet_start", kind: "raw" },
  quietEnd: { column: "quiet_end", kind: "raw" },
  showLevelToDuo: { column: "show_level_to_duo", kind: "bool" },
};

export function getUserSettings(
  db: Db,
  userId: string,
): Promise<UserSettingsRow | null> {
  return db.first<UserSettingsRow>(
    "SELECT * FROM user_settings WHERE user_id = ?",
    [userId],
  );
}

/** Inserts a settings row with the schema's defaults for a newly created user. */
export async function createDefaultUserSettings(
  db: Db,
  userId: string,
): Promise<UserSettingsRow> {
  const now = new Date().toISOString();
  await db.run(
    "INSERT INTO user_settings (user_id, created_at, updated_at) VALUES (?, ?, ?)",
    [userId, now, now],
  );
  const created = await getUserSettings(db, userId);
  if (!created) {
    throw new Error(`Failed to load settings for user ${userId} after insert`);
  }
  return created;
}

export async function updateUserSettings(
  db: Db,
  userId: string,
  input: UpdateUserSettingsInput,
): Promise<UserSettingsRow> {
  const parsed = UpdateUserSettingsInputSchema.parse(input);

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, { column, kind }] of Object.entries(FIELD_COLUMNS)) {
    const value = parsed[key as keyof UpdateUserSettingsInput];
    if (value === undefined) continue;
    sets.push(`${column} = ?`);
    values.push(
      kind === "json"
        ? JSON.stringify(value)
        : kind === "bool"
          ? value
            ? 1
            : 0
          : value,
    );
  }

  const existing = await getUserSettings(db, userId);
  if (!existing) {
    throw new Error(`No settings found for user ${userId}`);
  }
  if (sets.length === 0) {
    return existing;
  }

  sets.push("updated_at = ?");
  values.push(new Date().toISOString(), userId);

  await db.run(
    `UPDATE user_settings SET ${sets.join(", ")} WHERE user_id = ?`,
    values,
  );

  const updated = await getUserSettings(db, userId);
  if (!updated) {
    throw new Error(`No settings found for user ${userId}`);
  }
  return updated;
}
