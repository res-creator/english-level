import type { TelegramWebApp } from "../telegram/types.ts";
import { buildDevInitData } from "./devTelegramFixture.ts";

/**
 * Decides what `initData` (if any) to send to the backend. Extracted out
 * of `AuthProvider` so this decision is independently testable: a real
 * Telegram environment's `initData` always wins over the dev mock, and a
 * missing/empty `initData` must never be treated as "good enough" —
 * callers fail closed (unauthenticated), never bypass auth.
 */
export async function resolveInitData(
  webApp: TelegramWebApp,
  isMock: boolean,
  isDev: boolean,
): Promise<string | null> {
  if (!isMock) {
    return webApp.initData || null;
  }
  if (isDev && webApp.initDataUnsafe.user) {
    return buildDevInitData(webApp.initDataUnsafe.user);
  }
  return null;
}
