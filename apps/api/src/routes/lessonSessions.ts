import { Hono, type Context } from "hono";
import {
  AnswerSessionResponseSchema,
  EpisodeSessionDTOSchema,
  SessionResultDTOSchema,
} from "@english-level/contracts";
import { createD1Db } from "../db/d1Adapter.ts";
import { requireAuth } from "../auth/middleware.ts";
import {
  answerActivity,
  getLessonSession,
  getSessionResult,
  startLessonSession,
  type LessonSessionFailure,
} from "../services/lessonSessionService.ts";
import type { AppEnv } from "../types/appEnv.ts";

const lessonSessions = new Hono<AppEnv>();

// Per route, not `lessonSessions.use("*", ...)` — this router is also
// mounted at "/" (top-level, alongside curriculum). See the comment in
// routes/curriculum.ts for why a blanket "*" there leaks auth onto every
// other router in the API, including ones that must stay public.

function statusFor(code: LessonSessionFailure["code"]): 400 | 403 | 404 | 409 {
  switch (code) {
    case "validation_error":
      return 400;
    case "not_eligible":
    case "wrong_level":
    case "prerequisite_locked":
      return 403;
    case "not_found":
      return 404;
    case "session_not_active":
    case "activity_not_current":
    case "not_completed":
      return 409;
  }
}

function fail(c: Context<AppEnv>, error: LessonSessionFailure) {
  return c.json({ error: error.message }, statusFor(error.code));
}

lessonSessions.post("/lessons/:lessonId/start", requireAuth, async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await startLessonSession(
    db,
    c.get("currentUser").id,
    c.req.param("lessonId"),
  );
  if (!result.ok) return fail(c, result.error);
  return c.json(EpisodeSessionDTOSchema.parse(result.session));
});

lessonSessions.get("/sessions/:sessionId", requireAuth, async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await getLessonSession(
    db,
    c.get("currentUser").id,
    c.req.param("sessionId"),
  );
  if (!result.ok) return fail(c, result.error);
  return c.json(EpisodeSessionDTOSchema.parse(result.session));
});

lessonSessions.get("/sessions/:sessionId/result", requireAuth, async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await getSessionResult(
    db,
    c.get("currentUser").id,
    c.req.param("sessionId"),
  );
  if (!result.ok) return fail(c, result.error);
  return c.json(SessionResultDTOSchema.parse(result.result));
});

lessonSessions.post("/sessions/:sessionId/answer", requireAuth, async (c) => {
  const db = createD1Db(c.env.DB);
  const body = await c.req.json().catch(() => null);
  const result = await answerActivity(
    db,
    c.get("currentUser").id,
    c.req.param("sessionId"),
    body,
  );
  if (!result.ok) return fail(c, result.error);
  return c.json(
    AnswerSessionResponseSchema.parse({
      feedback: result.feedback,
      session: result.session,
    }),
  );
});

export default lessonSessions;
