import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
  TrackEventRequestSchema,
  TrackEventResponseSchema,
} from "@english-level/contracts";
import { createD1Db } from "../db/d1Adapter.ts";
import { resolveCurrentUser } from "../services/authService.ts";
import { trackClientEvent } from "../services/analyticsService.ts";
import { SESSION_COOKIE_NAME } from "../auth/session.ts";
import type { AppEnv } from "../types/appEnv.ts";

const events = new Hono<AppEnv>();

/**
 * The one client-facing analytics endpoint. Deliberately *not* gated by
 * `requireAuth`: the hook and the 48-second demo run before any account
 * exists, and a 401 there would silently blind the pilot to the very
 * screens most likely to lose someone.
 *
 * Auth is resolved when it's available (a signed-in learner tapping
 * "Выберу позже" still gets `user_id` on the row) and simply left null
 * when it isn't. Either way `anonymous_id` is always recorded, so a
 * funnel can be read across the login boundary without claiming that
 * join is exact identity.
 *
 * Never returns anything but `{ ok: true }` or a 400 for a malformed
 * body — there is nothing here for a client to branch on, and nothing
 * worth surfacing to the learner if it fails. A dropped event degrades
 * pilot visibility, never the product.
 */
events.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = TrackEventRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "invalid event" }, 400);
  }

  const db = createD1Db(c.env.DB);
  const token = getCookie(c, SESSION_COOKIE_NAME);
  const user = token ? await resolveCurrentUser(db, token) : null;

  await trackClientEvent(db, parsed.data.event, {
    userId: user?.id ?? null,
    anonymousId: parsed.data.anonymousId,
    properties: parsed.data.properties,
  });

  return c.json(TrackEventResponseSchema.parse({ ok: true }));
});

export default events;
