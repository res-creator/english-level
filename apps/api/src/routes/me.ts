import { Hono } from "hono";
import {
  FriendStateResponseSchema,
  InviteCodeResponseSchema,
  MyEnglishResponseSchema,
  MySpaceResponseSchema,
  SelectCompanionRequestSchema,
  AcceptInviteRequestSchema,
  CompanionDTOSchema,
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

export default me;
