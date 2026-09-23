import type {
  CapabilityItemDTO,
  CefrLevel,
  KnownPhraseDTO,
  MyEnglishResponse,
} from "@english-level/contracts";
import type { Db } from "../db/types.ts";
import { listCapabilities } from "../repositories/capabilitiesRepository.ts";
import { listMemory } from "../repositories/itemMemoryRepository.ts";
import { findPublishedLessonById } from "../repositories/curriculumRepository.ts";
import {
  findLearningItemLocalization,
  findPublishedLearningItemById,
} from "../repositories/learningItemRepository.ts";
import {
  findGrammarPatternLocalization,
  findPublishedGrammarPatternById,
} from "../repositories/grammarRepository.ts";
import { listActiveDays } from "../repositories/friendsRepository.ts";
import { addDays } from "../repositories/itemMemoryRepository.ts";
import { weekStart } from "./friendService.ts";

const CONTENT_LANGUAGE = "ru";

/** Box 4+ means the item has survived more than two weeks — that's what
 * "закреплено" claims, and nothing weaker should claim it. */
const CONSOLIDATED_BOX = 4;

/**
 * The learner's own English, not a score. Every line here is something
 * that actually happened: a capability proven in a Mission, a phrase met
 * in a real episode. Nothing is projected, estimated or gamified.
 */
export async function getMyEnglish(
  db: Db,
  userId: string,
  currentCefrLevel: string | null,
  now: Date = new Date(),
): Promise<MyEnglishResponse> {
  const capabilityRows = await listCapabilities(db, userId);

  const capabilities: CapabilityItemDTO[] = [];
  for (const row of capabilityRows) {
    if (row.state === "learning") continue;
    const lesson = await findPublishedLessonById(db, row.lesson_id);
    if (!lesson?.capability) continue;
    capabilities.push({
      episodeId: row.lesson_id,
      capability: lesson.capability,
      situationTitle: lesson.situation_title,
      state: row.state,
      canDoAt: row.can_do_at,
      consolidatedAt: row.consolidated_at,
    });
  }
  capabilities.sort((a, b) => (a.canDoAt ?? "").localeCompare(b.canDoAt ?? ""));

  const memory = await listMemory(db, userId);
  const phrases: KnownPhraseDTO[] = [];
  for (const row of memory) {
    if (row.target_type === "learning_item") {
      const item = await findPublishedLearningItemById(db, row.target_id);
      if (!item) continue;
      const localization = await findLearningItemLocalization(
        db,
        item.id,
        CONTENT_LANGUAGE,
      );
      phrases.push({
        id: item.id,
        text: item.display_form,
        translation: localization?.translation ?? "",
        box: row.box,
        consolidated: row.box >= CONSOLIDATED_BOX,
      });
    } else {
      const pattern = await findPublishedGrammarPatternById(db, row.target_id);
      if (!pattern) continue;
      const localization = await findGrammarPatternLocalization(
        db,
        pattern.id,
        CONTENT_LANGUAGE,
      );
      phrases.push({
        id: pattern.id,
        text: pattern.formula ?? pattern.title,
        translation: localization?.explanation ?? pattern.title,
        box: row.box,
        consolidated: row.box >= CONSOLIDATED_BOX,
      });
    }
  }

  const weekFrom = weekStart(now).toISOString();
  const activeDays = await listActiveDays(db, userId, weekFrom);
  const sessionsRow = await db.first<{ n: number }>(
    `SELECT COUNT(*) as n FROM learning_sessions
     WHERE user_id = ? AND status = 'completed' AND completed_at >= ?`,
    [userId, weekFrom],
  );

  return {
    level: (currentCefrLevel as CefrLevel | null) ?? null,
    capabilities,
    phrases,
    stats: {
      phrasesMet: phrases.length,
      phrasesConsolidated: phrases.filter((p) => p.consolidated).length,
      episodesDone: capabilities.length,
      missionsPassed: capabilityRows.reduce(
        (sum, row) => sum + (row.state === "learning" ? 0 : 1),
        0,
      ),
      activeDaysThisWeek: activeDays.length,
      sessionsThisWeek: sessionsRow?.n ?? 0,
    },
  };
}

/** Exported for the re-entry copy: how long since the learner last
 * practised, in whole days. */
export function daysSince(iso: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

/** Kept next to `daysSince` so both date helpers live in one place. */
export const tomorrowOf = (from: Date): string => addDays(from, 1);
