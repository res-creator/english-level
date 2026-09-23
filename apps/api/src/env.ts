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
}
