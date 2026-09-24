export interface Env {
  DB: D1Database;
  /** Server-only. Never expose to Vite/browser code, API responses, or logs. */
  TELEGRAM_BOT_TOKEN: string;
  /** Optional override for initData freshness, in seconds (default: 1 hour). */
  TELEGRAM_AUTH_MAX_AGE_SECONDS?: string;
  /**
   * Comma-separated list of origins allowed to make credentialed CORS
   * requests (the deployed Mini App's own origin, plus local dev servers
   * as needed). Not a secret — it's just a URL. Unset locally (falls back
   * to the Vite dev server origin, see `index.ts`); always set explicitly
   * per environment in `wrangler.toml` for preview/production.
   */
  ALLOWED_ORIGINS?: string;
  /**
   * Which deployment this is. Only ever `"preview"` on the preview
   * Worker; production deliberately leaves it unset, so anything gated on
   * it fails closed. See `isPreviewEnvironment`.
   */
  ENVIRONMENT?: string;
  /**
   * The deployed Mini App's own origin for this environment — the target
   * of the `web_app` button on the daily reminder (see
   * `services/notificationService.ts`). Not a secret, just a URL; kept
   * separate from `ALLOWED_ORIGINS` because that one is a CORS allow-list
   * (semantically a set) and this is a single deep-link target.
   */
  WEB_APP_URL?: string;
  /**
   * Server-only. Telegram includes this exact value in the
   * `X-Telegram-Bot-Api-Secret-Token` header on every webhook delivery
   * once `setWebhook` is registered with it — the one thing standing
   * between `/api/v1/telegram/webhook` and anyone on the internet who
   * finds the URL and starts sending it fake updates. See
   * `routes/telegramWebhook.ts`.
   */
  TELEGRAM_WEBHOOK_SECRET?: string;
}
