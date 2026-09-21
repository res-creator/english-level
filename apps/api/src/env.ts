export interface Env {
  DB: D1Database;
  /** Server-only. Never expose to Vite/browser code, API responses, or logs. */
  TELEGRAM_BOT_TOKEN: string;
  /** Optional override for initData freshness, in seconds (default: 1 hour). */
  TELEGRAM_AUTH_MAX_AGE_SECONDS?: string;
}
