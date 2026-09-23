import { Hono, type Context } from "hono";
import {
  AnswerReviewResponseSchema,
  ReviewSessionDTOSchema,
  ReviewStateResponseSchema,
} from "@english-level/contracts";
import { createD1Db } from "../db/d1Adapter.ts";
import { requireAuth } from "../auth/middleware.ts";
import {
  answerReviewActivity,
  getReviewSession,
  getReviewState,
  startReviewSession,
  type ReviewFailure,
} from "../services/reviewService.ts";
import type { AppEnv } from "../types/appEnv.ts";

const review = new Hono<AppEnv>();

review.use("*", requireAuth);

function statusFor(code: ReviewFailure["code"]): 400 | 403 | 404 | 409 {
  switch (code) {
    case "validation_error":
      return 400;
    case "not_eligible":
      return 403;
    case "not_found":
    case "nothing_due":
      return 404;
    case "session_not_active":
    case "activity_not_current":
      return 409;
  }
}

function fail(c: Context<AppEnv>, error: ReviewFailure) {
  return c.json({ error: error.message }, statusFor(error.code));
}

review.get("/", async (c) => {
  const db = createD1Db(c.env.DB);
  const state = await getReviewState(db, c.get("currentUser").id);
  return c.json(ReviewStateResponseSchema.parse(state));
});

review.post("/start", async (c) => {
  const db = createD1Db(c.env.DB);
  // `?extra=1` is the "Хочу ещё" path: practice on demand, without
  // pulling scheduled reviews forward.
  const extraPractice = c.req.query("extra") === "1";
  const result = await startReviewSession(db, c.get("currentUser").id, {
    extraPractice,
  });
  if (!result.ok) return fail(c, result.error);
  return c.json(ReviewSessionDTOSchema.parse(result.session));
});

review.get("/sessions/:sessionId", async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await getReviewSession(
    db,
    c.get("currentUser").id,
    c.req.param("sessionId"),
  );
  if (!result.ok) return fail(c, result.error);
  return c.json(ReviewSessionDTOSchema.parse(result.session));
});

review.post("/sessions/:sessionId/answer", async (c) => {
  const db = createD1Db(c.env.DB);
  const body = await c.req.json().catch(() => null);
  const result = await answerReviewActivity(
    db,
    c.get("currentUser").id,
    c.req.param("sessionId"),
    body,
  );
  if (!result.ok) return fail(c, result.error);
  return c.json(
    AnswerReviewResponseSchema.parse({
      feedback: result.feedback,
      session: result.session,
    }),
  );
});

export default review;
