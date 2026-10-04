import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import {
  TelegramAuthRequestSchema,
  TelegramAuthResponseSchema,
  LogoutResponseSchema,
} from "@english-level/contracts";
import { createD1Db } from "../db/d1Adapter.ts";
import {
  loginWithTelegramInitData,
  loginDemoUser,
  logout,
} from "../services/authService.ts";
import { toPublicUser } from "../dto/userDto.ts";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  DEFAULT_TELEGRAM_AUTH_MAX_AGE_SECONDS,
  cookieOptionsFor,
} from "../auth/session.ts";
import { isPreviewEnvironment } from "../previewMode.ts";
import type { AppEnv } from "../types/appEnv.ts";

const auth = new Hono<AppEnv>();

function isHttpsRequest(url: string): boolean {
  return new URL(url).protocol === "https:";
}

auth.post("/telegram", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsedBody = TelegramAuthRequestSchema.safeParse(json);
  if (!parsedBody.success) {
    return c.json({ error: "invalid_request" }, 400);
  }

  const maxAgeSeconds = c.env.TELEGRAM_AUTH_MAX_AGE_SECONDS
    ? Number(c.env.TELEGRAM_AUTH_MAX_AGE_SECONDS)
    : DEFAULT_TELEGRAM_AUTH_MAX_AGE_SECONDS;

  const db = createD1Db(c.env.DB);
  const login = await loginWithTelegramInitData(db, {
    initData: parsedBody.data.initData,
    botToken: c.env.TELEGRAM_BOT_TOKEN,
    maxAgeSeconds,
    sessionTtlSeconds: SESSION_TTL_SECONDS,
  });

  if (!login.ok) {
    return c.json({ error: login.error.code }, 401);
  }

  setCookie(
    c,
    SESSION_COOKIE_NAME,
    login.result.sessionToken,
    cookieOptionsFor(isHttpsRequest(c.req.url)),
  );

  const response = TelegramAuthResponseSchema.parse({
    user: toPublicUser(login.result.user),
    next: login.result.next,
  });
  return c.json(response);
});

/**
 * Preview-only: creates a demo session without Telegram auth, so the app
 * can be opened in a plain browser for design review / external feedback.
 * Outside preview this responds 404 — the endpoint does not even advertise
 * its existence in production.
 */
auth.post("/demo", async (c) => {
  if (!isPreviewEnvironment(c.env)) {
    return c.json({ error: "not found" }, 404);
  }

  const db = createD1Db(c.env.DB);
  const result = await loginDemoUser(db, SESSION_TTL_SECONDS);

  setCookie(
    c,
    SESSION_COOKIE_NAME,
    result.sessionToken,
    cookieOptionsFor(isHttpsRequest(c.req.url)),
  );

  const response = TelegramAuthResponseSchema.parse({
    user: toPublicUser(result.user),
    next: result.next,
  });
  return c.json(response);
});

auth.post("/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  const db = createD1Db(c.env.DB);
  await logout(db, token);
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.json(LogoutResponseSchema.parse({ ok: true }));
});

export default auth;
