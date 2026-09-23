/**
 * Preview-only testing tools (currently the account reset) are enabled by
 * this and nothing else.
 *
 * It fails closed: an unset, misspelled or production value all mean "not
 * preview", so the tools simply do not exist outside the preview Worker.
 * `ENVIRONMENT` is set to `"preview"` in exactly one place —
 * `[env.preview.vars]` in `wrangler.toml` — and is deliberately absent
 * from the production environment.
 *
 * It lives in its own module, free of Workers types, so the guard can be
 * tested directly.
 */
export function isPreviewEnvironment(env: { ENVIRONMENT?: string }): boolean {
  return env.ENVIRONMENT === "preview";
}
