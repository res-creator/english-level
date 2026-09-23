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

const curriculum = new Hono<AppEnv>();

curriculum.use("*", requireAuth);

curriculum.get("/course", async (c) => {
  const db = createD1Db(c.env.DB);
  const user = c.get("currentUser");
  const course = await getCourse(db, user.current_cefr_level, user.id);
  return c.json(CourseResponseSchema.parse(course));
});

curriculum.get("/today", async (c) => {
  const db = createD1Db(c.env.DB);
  const user = c.get("currentUser");
  const today = await getToday(db, user.id, user.current_cefr_level);
  return c.json(TodayResponseSchema.parse(today));
});

curriculum.get("/lessons/:lessonId", async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await getLessonContent(
    db,
    c.req.param("lessonId"),
    c.get("currentUser").id,
  );
  if (!result.ok) {
    return c.json({ error: result.error.message }, 404);
  }
  return c.json(LessonContentDTOSchema.parse(result.content));
});

export default curriculum;
