import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { createD1Db } from "../db/d1Adapter.ts";
import { resolveCurrentUser } from "../services/authService.ts";
import { SESSION_COOKIE_NAME } from "./session.ts";
import type { AppEnv } from "../types/appEnv.ts";

/**
 * Resolves `currentUser` from the session cookie and makes it available via
 * `c.get("currentUser")`. Responds 401 and short-circuits if there is no
 * valid session. Routes must use this rather than re-implementing session
 * lookup themselves.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  const db = createD1Db(c.env.DB);
  const user = await resolveCurrentUser(db, token);

  if (!user) {
    return c.json({ error: "unauthorized" }, 401);
  }

  c.set("currentUser", user);
  await next();
});
