import type {
  ChapterDTO,
  CourseResponse,
  LessonContentDTO,
  LessonContentEntry,
  CefrLevel,
} from "@english-level/contracts";
import type { Db } from "../db/types.ts";
import {
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
import { findProgress } from "../repositories/userLessonProgressRepository.ts";
import { listCapabilitiesForLessons } from "../repositories/capabilitiesRepository.ts";
import { buildEpisodeDTO } from "./lessonSessionService.ts";

/** Only Russian is seeded for V1 — no language negotiation yet. */
const CONTENT_LANGUAGE = "ru";

function levelId(code: CefrLevel): string {
  return `lvl_${code.toLowerCase()}`;
}

export type LessonContentResult =
  | { ok: true; content: LessonContentDTO }
  | { ok: false; error: { code: "not_found"; message: string } };

/**
 * Lesson content STRUCTURE only — target learning items and grammar
 * patterns, in order. Read-only: this never starts a session, never
 * marks anything started/completed, and never processes an answer.
 * `userId` is used solely to attach the user's own persisted
 * `user_lesson_progress` status, so Lesson Preview can resolve
 * start-vs-resume from server state rather than navigation state.
 */
export async function getLessonContent(
  db: Db,
  lessonId: string,
  userId: string,
): Promise<LessonContentResult> {
  const lesson = await findPublishedLessonById(db, lessonId);
  if (!lesson) {
    return {
      ok: false,
      error: { code: "not_found", message: "lesson not found" },
    };
  }

  const module_ = await findPublishedModuleById(db, lesson.module_id);
  const progress = await findProgress(db, userId, lessonId);

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
      moduleTitle: module_?.title ?? "",
      estimatedMinutes: lesson.estimated_minutes,
      progressStatus: progress?.status ?? "not_started",
      situationTitle: lesson.situation_title,
      scene: lesson.scene,
      capability: lesson.capability,
      content,
    },
  };
}

// ---------------------------------------------------------------------------
// Course (Speak in English V1)
// ---------------------------------------------------------------------------

/**
 * The course as one guided path: chapters of situations, each situation
 * carrying the capability it unlocks and how far through it the learner is.
 *
 * "Current" is a single episode across the whole course — the first one
 * whose capability isn't earned yet. Everything before it is done,
 * everything after it is simply ahead; there is no locking, because a
 * guided path doesn't need a gate to be clear.
 */
export async function getCourse(
  db: Db,
  currentCefrLevel: string | null,
  userId: string,
): Promise<CourseResponse> {
  if (!currentCefrLevel) {
    return {
      level: null,
      chapters: [],
      episodesDone: 0,
      episodesTotal: 0,
      currentEpisodeId: null,
    };
  }

  const modules = await listPublishedModulesByLevel(
    db,
    levelId(currentCefrLevel as CefrLevel),
  );

  const chapters: ChapterDTO[] = [];
  let episodesDone = 0;
  let episodesTotal = 0;
  let currentEpisodeId: string | null = null;

  for (const module_ of modules) {
    const lessons = await listPublishedLessonsByModule(db, module_.id);
    const capabilities = await listCapabilitiesForLessons(
      db,
      userId,
      lessons.map((l) => l.id),
    );
    const episodes = lessons.map((lesson) =>
      buildEpisodeDTO(lesson, capabilities.get(lesson.id) ?? null),
    );
    for (const episode of episodes) {
      episodesTotal += 1;
      if (episode.state === "can_do" || episode.state === "consolidated") {
        episodesDone += 1;
      } else if (!currentEpisodeId) {
        currentEpisodeId = episode.id;
      }
    }
    chapters.push({
      id: module_.id,
      title: module_.title,
      description: module_.description,
      order: module_.order_index,
      episodes,
    });
  }

  // Everything earned: the last episode stays highlighted rather than
  // leaving the path with no "you are here".
  if (!currentEpisodeId) {
    const last = chapters[chapters.length - 1]?.episodes.at(-1);
    currentEpisodeId = last?.id ?? null;
  }

  return {
    level: currentCefrLevel as CefrLevel,
    chapters,
    episodesDone,
    episodesTotal,
    currentEpisodeId,
  };
}
