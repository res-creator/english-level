import {
  TelegramAuthResponseSchema,
  MeResponseSchema,
  type TelegramAuthResponse,
  type MeResponse,
} from "@english-level/contracts";
import { API_BASE_URL } from "../lib/apiBaseUrl.ts";

/** Every auth call needs cookies sent/received across the web<->api origins. */
const CREDENTIALS: RequestCredentials = "include";

export async function telegramLogin(
  initData: string,
): Promise<TelegramAuthResponse | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/telegram`, {
    method: "POST",
    credentials: CREDENTIALS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`Telegram login failed with status ${res.status}`);
  }
  return TelegramAuthResponseSchema.parse(await res.json());
}

/**
 * Preview-only: logs in as a demo user without Telegram auth. Used when the
 * app is opened in a plain browser with `?demo=1` in the URL.
 */
export async function demoLogin(): Promise<TelegramAuthResponse | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/demo`, {
    method: "POST",
    credentials: CREDENTIALS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (res.status === 404 || res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`Demo login failed with status ${res.status}`);
  }
  return TelegramAuthResponseSchema.parse(await res.json());
}

export async function getMe(): Promise<MeResponse | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/me`, {
    credentials: CREDENTIALS,
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`Failed to load current user: status ${res.status}`);
  }
  return MeResponseSchema.parse(await res.json());
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    credentials: CREDENTIALS,
  });
  if (!res.ok) {
    throw new Error(`Logout failed with status ${res.status}`);
  }
}
