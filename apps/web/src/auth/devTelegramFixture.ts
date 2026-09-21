import { signTelegramInitData } from "@english-level/shared";
import type { TelegramUser } from "../telegram/types.ts";

/**
 * Local-dev-only fixture token. Must match apps/api/wrangler.toml's default
 * (unnamed/local) environment `[vars] TELEGRAM_BOT_TOKEN` exactly, and
 * nothing else — it is never a real Telegram bot token, and preview/
 * production intentionally have no matching value, so this can never
 * authenticate against a real deployment. See docs/authentication.md.
 */
const DEV_TELEGRAM_BOT_TOKEN = "dev-fixture-telegram-bot-token-000000";

/**
 * Signs a mock Telegram `initData` string with the dev fixture token, so
 * the exact same backend validation path (`validateTelegramInitData`) that
 * handles real Telegram traffic also handles local browser development —
 * no auth bypass branch exists anywhere in the backend for this.
 *
 * Only ever called when `import.meta.env.DEV` is true (enforced by the
 * caller) and Telegram itself isn't present (the existing Phase 0/1 mock
 * path); `vite build` for production never executes this in a real user's
 * browser, since real Telegram traffic never reaches this function.
 */
export function buildDevInitData(user: TelegramUser): Promise<string> {
  if (!import.meta.env.DEV) {
    throw new Error(
      "buildDevInitData must never run outside a development build",
    );
  }
  return signTelegramInitData(
    {
      query_id: "dev_mock_query_id",
      user: JSON.stringify(user),
      auth_date: Math.floor(Date.now() / 1000).toString(),
    },
    DEV_TELEGRAM_BOT_TOKEN,
  );
}
