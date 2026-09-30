import type { CefrLevel } from "@english-level/contracts";
import type { Db, DbStatement, LessonRow, ModuleRow } from "../db/types.ts";
import {
  findPublishedLessonById,
  findPublishedModuleById,
  listPublishedLessonsByModule,
  listPublishedModulesByLevel,
} from "../repositories/curriculumRepository.ts";
import { listCapabilitiesForLessons } from "../repositories/capabilitiesRepository.ts";

const LEVELS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2"];

function levelId(code: string): string {
  return `lvl_${code.toLowerCase()}`;
}

export function nextCefrLevel(level: string): CefrLevel | null {
  const index = LEVELS.indexOf(level as CefrLevel);
  return index >= 0 ? (LEVELS[index + 1] ?? null) : null;
}

/** Reconciles accounts that completed a level before automatic transitions
 * existed. It is idempotent and advances only through fully earned levels. */
export async function resolveCourseLevel(
  db: Db,
  userId: string,
  storedLevel: string | null,
): Promise<string | null> {
  let level = storedLevel;
  while (level) {
    const next = nextCefrLevel(level);
    if (!next) return level;
    const course = await orderedLessons(db, level);
    if (course.length === 0) return level;
    const capabilities = await listCapabilitiesForLessons(
      db,
      userId,
      course.map((entry) => entry.lesson.id),
    );
    const complete = course.every((entry) => {
      const state = capabilities.get(entry.lesson.id)?.state;
      return state === "can_do" || state === "consolidated";
    });
    if (!complete) return level;
    const now = new Date().toISOString();
    await db.batch([
      {
        sql: `UPDATE users SET current_cefr_level = ?, updated_at = ?
              WHERE id = ? AND current_cefr_level = ?`,
        params: [next, now, userId, level],
      },
    ]);
    level = next;
  }
  return level;
}

async function orderedLessons(
  db: Db,
  level: string,
): Promise<Array<{ lesson: LessonRow; module: ModuleRow }>> {
  const modules = await listPublishedModulesByLevel(db, levelId(level));
  const result: Array<{ lesson: LessonRow; module: ModuleRow }> = [];
  for (const module_ of modules) {
    const lessons = await listPublishedLessonsByModule(db, module_.id);
    result.push(...lessons.map((lesson) => ({ lesson, module: module_ })));
  }
  return result;
}

export type LessonAccessFailure =
  | { code: "not_found"; message: string }
  | { code: "not_eligible"; message: string }
  | { code: "wrong_level"; message: string }
  | { code: "prerequisite_locked"; message: string };

export type LessonAccessResult =
  | { ok: true; lesson: LessonRow; module: ModuleRow }
  | { ok: false; error: LessonAccessFailure };

/**
 * One backend-owned access rule for Course, direct previews and session
 * starts. A learner may open the first unfinished situation in their level,
 * or any situation they already started/earned. Everything later is locked.
 */
export async function checkLessonAccess(
  db: Db,
  userId: string,
  lessonId: string,
  currentCefrLevel: string | null,
): Promise<LessonAccessResult> {
  const lesson = await findPublishedLessonById(db, lessonId);
  if (!lesson) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }
  const module_ = await findPublishedModuleById(db, lesson.module_id);
  if (!module_) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }
  if (!currentCefrLevel) {
    return {
      ok: false,
      error: { code: "not_eligible", message: "no verified level yet" },
    };
  }
  if (module_.level_id !== levelId(currentCefrLevel)) {
    return {
      ok: false,
      error: {
        code: "wrong_level",
        message: "this lesson is not available at your current level",
      },
    };
  }

  const course = await orderedLessons(db, currentCefrLevel);
  const targetIndex = course.findIndex((entry) => entry.lesson.id === lessonId);
  if (targetIndex === -1) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }
  const capabilities = await listCapabilitiesForLessons(
    db,
    userId,
    course.map((entry) => entry.lesson.id),
  );

  // Started situations and completed situations remain resumable/replayable.
  if (capabilities.has(lessonId)) return { ok: true, lesson, module: module_ };

  const previousEarned = course.slice(0, targetIndex).every((entry) => {
    const state = capabilities.get(entry.lesson.id)?.state;
    return state === "can_do" || state === "consolidated";
  });
  if (!previousEarned) {
    return {
      ok: false,
      error: {
        code: "prerequisite_locked",
        message: "complete the previous situation first",
      },
    };
  }
  return { ok: true, lesson, module: module_ };
}

/**
 * Returns an atomic user update only when the current Mission completes the
 * last missing capability of A1, A2 or B1. B2 deliberately has no successor.
 */
export async function levelTransitionStatement(
  db: Db,
  userId: string,
  currentLevel: string,
  completingLessonId: string,
  now: string,
): Promise<DbStatement | null> {
  const nextLevel = nextCefrLevel(currentLevel);
  if (!nextLevel) return null;

  const course = await orderedLessons(db, currentLevel);
  if (!course.some((entry) => entry.lesson.id === completingLessonId)) {
    return null;
  }
  const otherLessons = course
    .map((entry) => entry.lesson.id)
    .filter((id) => id !== completingLessonId);
  const capabilities = await listCapabilitiesForLessons(
    db,
    userId,
    otherLessons,
  );
  const allOthersEarned = otherLessons.every((id) => {
    const state = capabilities.get(id)?.state;
    return state === "can_do" || state === "consolidated";
  });
  if (!allOthersEarned) return null;

  return {
    sql: `UPDATE users
      SET current_cefr_level = ?, updated_at = ?
      WHERE id = ? AND current_cefr_level = ?`,
    params: [nextLevel, now, userId, currentLevel],
  };
}

/** Course-order successor, including chapter and level boundaries. */
export async function nextPublishedLessonId(
  db: Db,
  lesson: LessonRow,
): Promise<string | null> {
  const module_ = await findPublishedModuleById(db, lesson.module_id);
  if (!module_) return null;
  const currentLevel = module_.level_id.replace(/^lvl_/, "").toUpperCase();
  const course = await orderedLessons(db, currentLevel);
  const index = course.findIndex((entry) => entry.lesson.id === lesson.id);
  const sameLevelNext = index >= 0 ? course[index + 1]?.lesson.id : null;
  if (sameLevelNext) return sameLevelNext;

  const nextLevel = nextCefrLevel(currentLevel);
  if (!nextLevel) return null;
  return (await orderedLessons(db, nextLevel))[0]?.lesson.id ?? null;
}
