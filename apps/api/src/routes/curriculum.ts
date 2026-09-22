import { Hono } from "hono";
import {
  CurriculumPathResponseSchema,
  ModuleDetailResponseSchema,
  LessonContentDTOSchema,
} from "@english-level/contracts";
import { createD1Db } from "../db/d1Adapter.ts";
import { requireAuth } from "../auth/middleware.ts";
import {
  getCurriculumPath,
  getLessonContent,
  getModuleDetail,
} from "../services/curriculumService.ts";
import type { AppEnv } from "../types/appEnv.ts";

const curriculum = new Hono<AppEnv>();

curriculum.use("*", requireAuth);

curriculum.get("/path", async (c) => {
  const db = createD1Db(c.env.DB);
  const path = await getCurriculumPath(
    db,
    c.get("currentUser").current_cefr_level,
  );
  return c.json(CurriculumPathResponseSchema.parse(path));
});

curriculum.get("/modules/:moduleId", async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await getModuleDetail(
    db,
    c.req.param("moduleId"),
    c.get("currentUser").id,
  );
  if (!result.ok) {
    return c.json({ error: result.error.message }, 404);
  }
  return c.json(ModuleDetailResponseSchema.parse(result.detail));
});

curriculum.get("/lessons/:lessonId", async (c) => {
  const db = createD1Db(c.env.DB);
  const result = await getLessonContent(db, c.req.param("lessonId"));
  if (!result.ok) {
    return c.json({ error: result.error.message }, 404);
  }
  return c.json(LessonContentDTOSchema.parse(result.content));
});

export default curriculum;
