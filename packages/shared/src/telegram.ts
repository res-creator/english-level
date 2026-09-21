/**
 * Telegram Mini App `initData` validation and signing, per Telegram's
 * documented algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Pure WebCrypto (no Node/Workers/browser-specific APIs), so this module
 * runs unmodified in the Cloudflare Worker (validating real requests), in
 * tests (building fixtures), and in the browser dev build (signing a mock
 * initData with a well-known, non-production dev token).
 */

export interface TelegramInitDataUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export type TelegramInitDataValidationResult =
  | { ok: true; user: TelegramInitDataUser; authDate: number }
  | {
      ok: false;
      reason: "malformed" | "invalid_hash" | "expired" | "missing_user";
    };

/**
 * Validates a Telegram Mini App `initData` string: checks the HMAC hash
 * against `botToken`, checks `auth_date` freshness against `maxAgeSeconds`,
 * and extracts the signed Telegram user. Never throws — all failure modes
 * are represented in the returned result.
 */
export async function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number,
): Promise<TelegramInitDataValidationResult> {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const hash = params.get("hash");
  const authDateRaw = params.get("auth_date");
  const userRaw = params.get("user");
  if (!hash || !authDateRaw || !userRaw) {
    return { ok: false, reason: "malformed" };
  }

  const authDate = Number(authDateRaw);
  if (!Number.isFinite(authDate) || authDate <= 0) {
    return { ok: false, reason: "malformed" };
  }

  const dataCheckString = buildDataCheckString(params);
  const expectedHash = await computeInitDataHash(botToken, dataCheckString);
  if (!timingSafeEqual(expectedHash, hash)) {
    return { ok: false, reason: "invalid_hash" };
  }

  // Small allowance for clock skew if auth_date is very slightly in the future.
  const ageSeconds = Date.now() / 1000 - authDate;
  if (ageSeconds > maxAgeSeconds || ageSeconds < -60) {
    return { ok: false, reason: "expired" };
  }

  let parsedUser: unknown;
  try {
    parsedUser = JSON.parse(userRaw);
  } catch {
    return { ok: false, reason: "missing_user" };
  }
  if (!isTelegramInitDataUser(parsedUser)) {
    return { ok: false, reason: "missing_user" };
  }

  return { ok: true, user: parsedUser, authDate };
}

/**
 * Builds a signed `initData` string from raw fields, using the same
 * algorithm `validateTelegramInitData` checks against. Used to build a
 * dev-mode mock `initData` (frontend) and test fixtures (backend) — never
 * used for real Telegram traffic, where Telegram itself provides the
 * already-signed string.
 */
export async function signTelegramInitData(
  fields: Record<string, string>,
  botToken: string,
): Promise<string> {
  const params = new URLSearchParams(fields);
  const dataCheckString = buildDataCheckString(params);
  const hash = await computeInitDataHash(botToken, dataCheckString);
  params.set("hash", hash);
  return params.toString();
}

function isTelegramInitDataUser(value: unknown): value is TelegramInitDataUser {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "number" && typeof v.first_name === "string";
}

function buildDataCheckString(params: URLSearchParams): string {
  const entries: [string, string][] = [];
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    entries.push([key, value]);
  }
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return entries.map(([k, v]) => `${k}=${v}`).join("\n");
}

async function computeInitDataHash(
  botToken: string,
  dataCheckString: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = await hmacSha256(
    encoder.encode("WebAppData"),
    encoder.encode(botToken),
  );
  const signature = await hmacSha256(
    secretKey,
    encoder.encode(dataCheckString),
  );
  return toHex(signature);
}

async function hmacSha256(
  keyBytes: Uint8Array,
  message: Uint8Array,
): Promise<Uint8Array> {
  // `Uint8Array`'s generic `ArrayBufferLike` doesn't structurally match the
  // `BufferSource` (`ArrayBuffer`-only) parameter type in some lib.dom
  // versions, even though every runtime accepts a plain Uint8Array here.
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    message as unknown as ArrayBuffer,
  );
  return new Uint8Array(signature);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
