import { Hono } from "hono";
import {
  FriendStateResponseSchema,
  InviteCodeResponseSchema,
  MyEnglishResponseSchema,
  MySpaceResponseSchema,
  SelectCompanionRequestSchema,
  AcceptInviteRequestSchema,
  CompanionDTOSchema,
  ResetPreviewRequestSchema,
  ResetPreviewResponseSchema,
  MySettingsResponseSchema,
  UpdateMySettingsRequestSchema,
  DeleteAccountRequestSchema,
  DeleteAccountResponseSchema,
} from "@english-level/contracts";
import { createD1Db } from "../db/d1Adapter.ts";
import { requireAuth } from "../auth/middleware.ts";
import { getMyEnglish } from "../services/myEnglishService.ts";
import { getMySpace, selectCompanion } from "../services/spaceService.ts";
import {
  acceptInvite,
  createInvite,
  getFriendState,
} from "../services/friendService.ts";
import { resetPreviewAccount } from "../services/previewResetService.ts";
import { deleteAccount } from "../services/accountDeletionService.ts";
import {
  getUserSettings,
  updateUserSettings,
} from "../repositories/userSettingsRepository.ts";
import { isPreviewEnvironment } from "../previewMode.ts";
import type { AppEnv } from "../types/appEnv.ts";

/** "My English", the companion's space, and the one friend connection —
 * everything the learner owns rather than everything they must do. */
const me = new Hono<AppEnv>();

me.use("*", requireAuth);

me.get("/english", async (c) => {
  const db = createD1Db(c.env.DB);
  const user = c.get("currentUser");
  const result = await getMyEnglish(db, user.id, user.current_cefr_level);
  return c.json(MyEnglishResponseSchema.parse(result));
});

me.get("/space", async (c) => {
  const db = createD1Db(c.env.DB);
  const space = await getMySpace(db, c.get("currentUser").id);
  return c.json(MySpaceResponseSchema.parse(space));
});

me.post("/companion", async (c) => {
  const db = createD1Db(c.env.DB);
  const body = await c.req.json().catch(() => null);
  const parsed = SelectCompanionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "companionId is required" }, 400);
  }
  const result = await selectCompanion(
    db,
    c.get("currentUser").id,
    parsed.data.companionId,
  );
  if (!result.ok) return c.json({ error: result.error.message }, 404);
  return c.json(CompanionDTOSchema.parse(result.companion));
});

me.get("/friend", async (c) => {
  const db = createD1Db(c.env.DB);
  const state = await getFriendState(db, c.get("currentUser").id);
  return c.json(FriendStateResponseSchema.parse(state));
});

me.post("/friend/invite", async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await createInvite(db, c.get("currentUser").id);
  if (!result.ok) return c.json({ error: result.error.message }, 409);
  return c.json(InviteCodeResponseSchema.parse({ code: result.code }));
});

me.post("/friend/accept", async (c) => {
  const db = createD1Db(c.env.DB);
  const body = await c.req.json().catch(() => null);
  const parsed = AcceptInviteRequestSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "code is required" }, 400);
  const result = await acceptInvite(
    db,
    c.get("currentUser").id,
    parsed.data.code,
  );
  if (!result.ok) {
    return c.json(
      { error: result.error.message },
      result.error.code === "not_found" ? 404 : 409,
    );
  }
  return c.json(FriendStateResponseSchema.parse(result.state));
});

/**
 * The only two settings a learner can change after onboarding: the daily
 * goal and whether the daily reminder is sent at all. Both already exist
 * as columns `updateUserSettings` supports — this just exposes exactly
 * those two, not the rest of `user_settings`.
 */
me.get("/settings", async (c) => {
  const db = createD1Db(c.env.DB);
  const settings = await getUserSettings(db, c.get("currentUser").id);
  if (!settings) return c.json({ error: "not found" }, 404);
  return c.json(
    MySettingsResponseSchema.parse({
      dailyMinutes: settings.daily_minutes,
      dailyReminderEnabled: !!settings.daily_reminder_enabled,
    }),
  );
});

me.patch("/settings", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = UpdateMySettingsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "invalid settings" }, 400);
  }
  const db = createD1Db(c.env.DB);
  const updated = await updateUserSettings(
    db,
    c.get("currentUser").id,
    parsed.data,
  );
  return c.json(
    MySettingsResponseSchema.parse({
      dailyMinutes: updated.daily_minutes,
      dailyReminderEnabled: !!updated.daily_reminder_enabled,
    }),
  );
});

/**
 * Preview-only: wipes the signed-in account's learning state so the
 * first-run experience can be tested again.
 *
 * Outside preview this responds 404 — not 403 — so the endpoint does not
 * even advertise its own existence in production. The confirmation
 * literal in the body is a second, independent guard: no accidental or
 * replayed POST can reach the reset by itself.
 */
me.post("/reset", async (c) => {
  if (!isPreviewEnvironment(c.env)) {
    return c.json({ error: "not found" }, 404);
  }
  const body = await c.req.json().catch(() => null);
  const parsed = ResetPreviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "confirmation required" }, 400);
  }
  const db = createD1Db(c.env.DB);
  const cleared = await resetPreviewAccount(db, c.get("currentUser").id);
  return c.json(ResetPreviewResponseSchema.parse({ ok: true, cleared }));
});

/**
 * Real, permanent account deletion — unlike `/reset`, this runs in every
 * environment, including production: a learner's right to actually delete
 * their data doesn't stop at the pilot. The confirmation literal guards
 * it the same way `/reset`'s does, against any stray or replayed POST.
 */
me.post("/account/delete", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = DeleteAccountRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "confirmation required" }, 400);
  }
  const db = createD1Db(c.env.DB);
  await deleteAccount(db, c.get("currentUser").id);
  return c.json(DeleteAccountResponseSchema.parse({ ok: true }));
});

export default me;
