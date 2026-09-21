import { Hono, type Context } from "hono";
import { OnboardingStateResponseSchema } from "@english-level/contracts";
import { createD1Db } from "../db/d1Adapter.ts";
import { requireAuth } from "../auth/middleware.ts";
import {
  getOnboardingState,
  updateOnboardingDailyTime,
  updateOnboardingGoals,
  updateOnboardingLevel,
  type OnboardingResult,
} from "../services/onboardingService.ts";
import type { AppEnv } from "../types/appEnv.ts";

const onboarding = new Hono<AppEnv>();

onboarding.use("*", requireAuth);

function respond(c: Context<AppEnv>, result: OnboardingResult) {
  if (result.ok) {
    return c.json(OnboardingStateResponseSchema.parse(result.state));
  }
  const status = result.error.code === "step_locked" ? 409 : 400;
  return c.json({ error: result.error.message }, status);
}

onboarding.get("/", async (c) => {
  const db = createD1Db(c.env.DB);
  const state = await getOnboardingState(db, c.get("currentUser").id);
  return c.json(OnboardingStateResponseSchema.parse(state));
});

onboarding.put("/goals", async (c) => {
  const db = createD1Db(c.env.DB);
  const body = await c.req.json().catch(() => null);
  const result = await updateOnboardingGoals(db, c.get("currentUser").id, body);
  return respond(c, result);
});

onboarding.put("/daily-time", async (c) => {
  const db = createD1Db(c.env.DB);
  const body = await c.req.json().catch(() => null);
  const result = await updateOnboardingDailyTime(
    db,
    c.get("currentUser").id,
    body,
  );
  return respond(c, result);
});

onboarding.put("/level", async (c) => {
  const db = createD1Db(c.env.DB);
  const body = await c.req.json().catch(() => null);
  const result = await updateOnboardingLevel(db, c.get("currentUser").id, body);
  return respond(c, result);
});

export default onboarding;
