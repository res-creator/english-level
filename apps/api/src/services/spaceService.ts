import type {
  CompanionDTO,
  MySpaceResponse,
  RoomItemDTO,
} from "@english-level/contracts";
import type { Db } from "../db/types.ts";
import {
  COMPANIONS,
  findCompanionDefinition,
} from "../content/companionCatalog.ts";
import { REWARDS } from "../content/rewardCatalog.ts";
import {
  findCompanion,
  listRewards,
  selectCompanionStatement,
} from "../repositories/companionRewardsRepository.ts";
import {
  findPublishedLessonById,
  listLessonItemsByLesson,
} from "../repositories/curriculumRepository.ts";
import {
  findLearningItemLocalization,
  findPublishedLearningItemById,
} from "../repositories/learningItemRepository.ts";

const CONTENT_LANGUAGE = "ru";
/** A memory object shows a taste of its language, not a vocabulary dump. */
const MEMORY_PHRASE_LIMIT = 3;

function toCompanionDTO(id: string): CompanionDTO | null {
  const definition = findCompanionDefinition(id);
  if (!definition) return null;
  return {
    id: definition.id,
    name: definition.name,
    tagline: definition.tagline,
    tone: definition.tone,
  };
}

export const COMPANION_CHOICES: CompanionDTO[] = COMPANIONS.map((c) => ({
  id: c.id,
  name: c.name,
  tagline: c.tagline,
  tone: c.tone,
}));

/**
 * The room is a memory, not a game board. Slots are fixed, nothing can be
 * bought or moved, and every object that is there is there because a
 * specific piece of English was learned — tapping it shows that English
 * back. Locked objects are listed too, without a price and without a hint
 * of a shortcut: they appear when the learning does.
 */
export async function getMySpace(
  db: Db,
  userId: string,
): Promise<MySpaceResponse> {
  const companionRow = await findCompanion(db, userId);
  const unlocked = await listRewards(db, userId);
  const unlockedById = new Map(unlocked.map((r) => [r.reward_id, r]));

  const items: RoomItemDTO[] = [];
  for (const definition of REWARDS) {
    const row = unlockedById.get(definition.id);
    const memory =
      row && definition.lessonId
        ? await buildMemory(db, definition.lessonId)
        : null;
    items.push({
      id: definition.id,
      title: definition.title,
      reason: definition.reason,
      slot: definition.slot,
      glyph: definition.glyph,
      tier: definition.tier,
      unlocked: row !== undefined,
      unlockedAt: row?.unlocked_at ?? null,
      memory,
    });
  }

  return {
    companion: companionRow ? toCompanionDTO(companionRow.companion_id) : null,
    companionChoices: COMPANION_CHOICES,
    items,
    unlockedCount: items.filter((i) => i.unlocked).length,
    totalCount: items.length,
  };
}

/** What an object remembers: the capability it stands for and a few of the
 * phrases from that episode. */
async function buildMemory(
  db: Db,
  lessonId: string,
): Promise<RoomItemDTO["memory"]> {
  const lesson = await findPublishedLessonById(db, lessonId);
  if (!lesson) return null;
  const links = await listLessonItemsByLesson(db, lessonId);
  const phrases: { text: string; translation: string }[] = [];
  for (const link of links) {
    if (phrases.length >= MEMORY_PHRASE_LIMIT) break;
    if (link.content_type !== "learning_item") continue;
    if (link.role !== "introduce" && link.role !== "target") continue;
    const item = await findPublishedLearningItemById(db, link.content_id);
    if (!item) continue;
    const localization = await findLearningItemLocalization(
      db,
      item.id,
      CONTENT_LANGUAGE,
    );
    phrases.push({
      text: item.display_form,
      translation: localization?.translation ?? "",
    });
  }
  return {
    capability: lesson.capability,
    episodeTitle: lesson.situation_title ?? lesson.title,
    phrases,
  };
}

export type CompanionResult =
  | { ok: true; companion: CompanionDTO }
  | { ok: false; error: { code: "not_found"; message: string } };

export async function selectCompanion(
  db: Db,
  userId: string,
  companionId: string,
): Promise<CompanionResult> {
  const companion = toCompanionDTO(companionId);
  if (!companion) {
    return {
      ok: false,
      error: { code: "not_found", message: "companion not found" },
    };
  }
  await db.batch([
    selectCompanionStatement(userId, companionId, new Date().toISOString()),
  ]);
  return { ok: true, companion };
}
