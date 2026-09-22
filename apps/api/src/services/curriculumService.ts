import type {
  CurriculumPathResponse,
  LessonContentDTO,
  LessonContentEntry,
  LessonProgressStatus,
  CefrLevel,
} from "@english-level/contracts";
import type { Db } from "../db/types.ts";
import { findLevelById } from "../repositories/levelsRepository.ts";
import {
  countPublishedLessonsByModule,
  findPublishedLessonById,
  findPublishedModuleById,
  listLessonItemsByLesson,
  listPublishedLessonsByModule,
  listPublishedModulesByLevel,
} from "../repositories/curriculumRepository.ts";
import {
  findLearningItemLocalization,
  findPrimaryExample,
  findPublishedLearningItemById,
} from "../repositories/learningItemRepository.ts";
import {
  findGrammarPatternLocalization,
  findPublishedGrammarPatternById,
} from "../repositories/grammarRepository.ts";
import { listProgressForLessons } from "../repositories/userLessonProgressRepository.ts";

/** Only Russian is seeded for V1 — no language negotiation yet. */
const CONTENT_LANGUAGE = "ru";

function levelId(code: CefrLevel): string {
  return `lvl_${code.toLowerCase()}`;
}

/**
 * The curriculum path for a user's *verified* level. No progress or
 * completion percentages exist yet — a module here is just "exists in
 * this level's published curriculum", nothing more. A level with no
 * seeded content (or no verified level yet) returns an empty module list
 * rather than an error.
 */
export async function getCurriculumPath(
  db: Db,
  currentCefrLevel: string | null,
): Promise<CurriculumPathResponse> {
  if (!currentCefrLevel) {
    return { currentLevel: null, modules: [] };
  }

  const modules = await listPublishedModulesByLevel(
    db,
    levelId(currentCefrLevel as CefrLevel),
  );

  const withCounts = await Promise.all(
    modules.map(async (m) => {
      const count = await countPublishedLessonsByModule(db, m.id);
      return {
        id: m.id,
        title: m.title,
        order: m.order_index,
        lessons: count?.n ?? 0,
      };
    }),
  );

  return {
    currentLevel: currentCefrLevel as CefrLevel,
    modules: withCounts,
  };
}

export type ModuleDetailResult =
  | {
      ok: true;
      detail: {
        id: string;
        title: string;
        description: string | null;
        level: CefrLevel;
        order: number;
        lessons: {
          id: string;
          title: string;
          type: string;
          order: number;
          estimatedMinutes: number | null;
          progressStatus: LessonProgressStatus;
        }[];
      };
    }
  | { ok: false; error: { code: "not_found"; message: string } };

/**
 * `userId` is used only to annotate each lesson with the user's own
 * `user_lesson_progress` status (Phase 6) — not_started/in_progress/
 * completed. No mastery/knowledge is inferred or invented; a lesson with
 * no progress row is simply "not_started".
 */
export async function getModuleDetail(
  db: Db,
  moduleId: string,
  userId: string,
): Promise<ModuleDetailResult> {
  const module_ = await findPublishedModuleById(db, moduleId);
  if (!module_) {
    return {
      ok: false,
      error: { code: "not_found", message: "module not found" },
    };
  }

  const level = await findLevelById(db, module_.level_id);
  const lessons = await listPublishedLessonsByModule(db, moduleId);
  const progressByLesson = await listProgressForLessons(
    db,
    userId,
    lessons.map((l) => l.id),
  );

  return {
    ok: true,
    detail: {
      id: module_.id,
      title: module_.title,
      description: module_.description,
      level: (level?.code ?? "A1") as CefrLevel,
      order: module_.order_index,
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.lesson_type,
        order: l.order_index,
        estimatedMinutes: l.estimated_minutes,
        progressStatus: progressByLesson.get(l.id)?.status ?? "not_started",
      })),
    },
  };
}

export type LessonContentResult =
  | { ok: true; content: LessonContentDTO }
  | { ok: false; error: { code: "not_found"; message: string } };

/**
 * Lesson content STRUCTURE only — target learning items and grammar
 * patterns, in order. Read-only: this never starts a session, never
 * marks anything started/completed, and never processes an answer.
 */
export async function getLessonContent(
  db: Db,
  lessonId: string,
): Promise<LessonContentResult> {
  const lesson = await findPublishedLessonById(db, lessonId);
  if (!lesson) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }

  const links = await listLessonItemsByLesson(db, lessonId);
  const content: LessonContentEntry[] = [];

  for (const link of links) {
    if (link.content_type === "learning_item") {
      const item = await findPublishedLearningItemById(db, link.content_id);
      if (!item) continue;
      const localization = await findLearningItemLocalization(
        db,
        item.id,
        CONTENT_LANGUAGE,
      );
      const example = await findPrimaryExample(db, item.id);
      content.push({
        contentType: "learning_item",
        role: link.role,
        item: {
          id: item.id,
          itemType: item.item_type,
          displayForm: item.display_form,
          translation: localization?.translation ?? "",
          usageNote: localization?.usage_note ?? null,
          primaryExample: example?.example_text ?? null,
        },
      });
    } else {
      const pattern = await findPublishedGrammarPatternById(
        db,
        link.content_id,
      );
      if (!pattern) continue;
      const localization = await findGrammarPatternLocalization(
        db,
        pattern.id,
        CONTENT_LANGUAGE,
      );
      content.push({
        contentType: "grammar_pattern",
        role: link.role,
        pattern: {
          id: pattern.id,
          title: pattern.title,
          formula: pattern.formula,
          explanation: localization?.explanation ?? pattern.explanation_en,
          usageNote: localization?.usage_note ?? null,
        },
      });
    }
  }

  return {
    ok: true,
    content: {
      id: lesson.id,
      title: lesson.title,
      type: lesson.lesson_type,
      moduleId: lesson.module_id,
      content,
    },
  };
}
