import type { PublicUser } from "@english-level/contracts";
import type { UserRow } from "../db/types.ts";

/**
 * Maps a raw database row to the public API DTO. This is the only place
 * a `UserRow` should be translated for a response — never return a
 * `UserRow` (or spread it) directly from a route.
 */
export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    firstName: row.first_name,
    username: row.username,
    interfaceLanguage: row.interface_language,
    timezone: row.timezone,
    currentCefrLevel: row.current_cefr_level,
    onboardingCompleted: row.onboarding_completed === 1,
  };
}
