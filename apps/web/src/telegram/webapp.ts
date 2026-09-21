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
        id: 0,
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
