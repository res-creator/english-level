import { Hono, type Context } from "hono";
import {
  PlacementStartResponseSchema,
  PlacementCurrentResponseSchema,
  PlacementAnswerResponseSchema,
  PlacementResultResponseSchema,
} from "@english-level/contracts";
import { createD1Db } from "../db/d1Adapter.ts";
import { requireAuth } from "../auth/middleware.ts";
import {
  startPlacementAttempt,
  getCurrentPlacementAttempt,
  submitPlacementAnswer,
  getPlacementResult,
  type PlacementFailure,
} from "../services/placementService.ts";
import type { AppEnv } from "../types/appEnv.ts";

const placement = new Hono<AppEnv>();

placement.use("*", requireAuth);

function statusFor(code: PlacementFailure["code"]): 400 | 403 | 404 | 409 {
  switch (code) {
    case "validation_error":
      return 400;
    case "not_eligible":
      return 403;
    case "not_found":
      return 404;
    case "question_not_issued":
    case "attempt_not_active":
      return 409;
  }
}

function fail(c: Context<AppEnv>, error: PlacementFailure) {
  return c.json({ error: error.message }, statusFor(error.code));
}

placement.post("/start", async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await startPlacementAttempt(db, c.get("currentUser").id);
  if (!result.ok) return fail(c, result.error);
  return c.json(
    PlacementStartResponseSchema.parse({
      attemptId: result.attemptId,
      question: result.question,
      progress: result.progress,
    }),
  );
});

placement.get("/current", async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await getCurrentPlacementAttempt(db, c.get("currentUser").id);
  return c.json(PlacementCurrentResponseSchema.parse(result));
});

placement.post("/:attemptId/answer", async (c) => {
  const db = createD1Db(c.env.DB);
  const body = await c.req.json().catch(() => null);
  const result = await submitPlacementAnswer(
    db,
    c.get("currentUser").id,
    c.req.param("attemptId"),
    body,
  );
  if (!result.ok) return fail(c, result.error);
  return c.json(PlacementAnswerResponseSchema.parse(result));
});

placement.get("/:attemptId/result", async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await getPlacementResult(
    db,
    c.get("currentUser").id,
    c.req.param("attemptId"),
  );
  if (!result.ok) return fail(c, result.error);
  return c.json(PlacementResultResponseSchema.parse(result.result));
});

export default placement;
