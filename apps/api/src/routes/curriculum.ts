import { Hono } from "hono";
import {
  CourseResponseSchema,
  LessonContentDTOSchema,
  TodayResponseSchema,
} from "@english-level/contracts";
import { createD1Db } from "../db/d1Adapter.ts";
import { requireAuth } from "../auth/middleware.ts";
import { getCourse, getLessonContent } from "../services/curriculumService.ts";
import { getToday } from "../services/todayService.ts";
import type { AppEnv } from "../types/appEnv.ts";
import { resolveCourseLevel } from "../services/courseProgressionService.ts";

const curriculum = new Hono<AppEnv>();

// `requireAuth` is applied per route, not via `curriculum.use("*", ...)`:
// this router is mounted at "/" (see index.ts, "top-level, not nested
// under a shared prefix"), and a blanket `.use("*")` on a router mounted
// at the app root compiles to a middleware matching *every* path in the
// whole API, not just this router's own — including sibling routers
// mounted afterwards at their own prefixes (e.g. `/events`, which must
// stay reachable without a session). Per-route middleware gives every
// handler here the exact same auth requirement without that leak.
curriculum.get("/course", requireAuth, async (c) => {
  const db = createD1Db(c.env.DB);
  const user = c.get("currentUser");
  const level = await resolveCourseLevel(db, user.id, user.current_cefr_level);
  const course = await getCourse(db, level, user.id);
  return c.json(CourseResponseSchema.parse(course));
});

curriculum.get("/today", requireAuth, async (c) => {
  const db = createD1Db(c.env.DB);
  const user = c.get("currentUser");
  const level = await resolveCourseLevel(db, user.id, user.current_cefr_level);
  const today = await getToday(db, user.id, level);
  return c.json(TodayResponseSchema.parse(today));
});

curriculum.get("/lessons/:lessonId", requireAuth, async (c) => {
  const db = createD1Db(c.env.DB);
  const user = c.get("currentUser");
  const level = await resolveCourseLevel(db, user.id, user.current_cefr_level);
  const result = await getLessonContent(
    db,
    c.req.param("lessonId"),
    user.id,
    level,
  );
  if (!result.ok) {
    return c.json(
      { error: result.error.message },
      result.error.code === "not_found" ? 404 : 403,
    );
  }
  return c.json(LessonContentDTOSchema.parse(result.content));
});

export default curriculum;
