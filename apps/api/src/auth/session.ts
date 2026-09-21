export const SESSION_COOKIE_NAME = "el_session";

/** 30 days. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

/** Default Telegram `initData` freshness window if not overridden by env. */
export const DEFAULT_TELEGRAM_AUTH_MAX_AGE_SECONDS = 60 * 60; // 1 hour

export interface CookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "Lax" | "None";
  path: "/";
  maxAge: number;
}

/**
 * Cookie attributes for the session cookie. `isHttps` should come from the
 * inbound request's protocol: over HTTPS (preview/production, and any real
 * Telegram Mini App, which is always served over HTTPS) the Mini App and
 * this API are different origins, so the cookie needs `SameSite=None` +
 * `Secure` to be sent cross-site at all. Over plain HTTP (local dev, where
 * frontend and backend are both on localhost and therefore same-site)
 * `SameSite=None` isn't usable (browsers require `Secure` with it), so we
 * fall back to `Lax`, which works fine for same-site requests.
 */
export function cookieOptionsFor(isHttps: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "None" : "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
