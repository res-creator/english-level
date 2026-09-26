import type { TelegramWebApp } from "./types";

function getRealTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

function createMockTelegramWebApp(): TelegramWebApp {
  return {
    initData: "mock_init_data",
    initDataUnsafe: {
      user: {
        // Must be a positive integer: real Telegram user ids always are,
        // and the backend's own user-creation validation enforces that
        // (`telegramUserId` > 0), so a mock id of 0 fails there.
        id: 1,
        first_name: "Dev",
        username: "dev_user",
        language_code: "en",
      },
    },
    colorScheme: "light",
    platform: "mock",
    ready: () => {},
    expand: () => {},
  };
}

/**
 * Resolves the Telegram WebApp instance: the real one when running inside
 * Telegram, otherwise a mock so the app works in a plain browser during
 * local development. This is the only place that should read
 * `window.Telegram` directly — everything else goes through this module.
 */
export function resolveTelegramWebApp(): {
  webApp: TelegramWebApp;
  isMock: boolean;
} {
  const real = getRealTelegramWebApp();
  if (real) return { webApp: real, isMock: false };
  return { webApp: createMockTelegramWebApp(), isMock: true };
}
