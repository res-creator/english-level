import type { UnlockedRewardDTO } from "@english-level/contracts";
import type { Db, RewardSourceKindRow } from "../db/types.ts";
import {
  CHAPTER_REWARD_ID,
  CONSOLIDATION_REWARD_ID,
  SHARED_GOAL_REWARD_ID,
  WEEK_MILESTONE_ACTIVE_DAYS,
  WEEK_MILESTONE_REWARD_ID,
  findRewardDefinition,
  rewardForMission,
  type RewardDefinition,
} from "../content/rewardCatalog.ts";
import {
  findReward,
  unlockRewardStatement,
} from "../repositories/companionRewardsRepository.ts";
import { listCapabilitiesForLessons } from "../repositories/capabilitiesRepository.ts";
import { listPublishedLessonsByModule } from "../repositories/curriculumRepository.ts";
import { listActiveDays } from "../repositories/friendsRepository.ts";
import { addDays } from "../repositories/itemMemoryRepository.ts";

export function toRewardDTO(definition: RewardDefinition): UnlockedRewardDTO {
  return {
    id: definition.id,
    title: definition.title,
    reason: definition.reason,
    tier: definition.tier,
    slot: definition.slot,
    glyph: definition.glyph,
  };
}

/**
 * Grants a reward once. Returns the DTO only the *first* time, so the
 * client can celebrate a new object without ever re-celebrating an old
 * one — replaying a Mission must not re-unlock its reward.
 */
export async function grantReward(
  db: Db,
  userId: string,
  rewardId: string,
  sourceKind: RewardSourceKindRow,
  sourceId: string | null,
): Promise<UnlockedRewardDTO | null> {
  const definition = findRewardDefinition(rewardId);
  if (!definition) return null;
  const existing = await findReward(db, userId, rewardId);
  if (existing) return null;
  await db.batch([
    unlockRewardStatement(
      userId,
      rewardId,
      sourceKind,
      sourceId,
      new Date().toISOString(),
    ),
  ]);
  return toRewardDTO(definition);
}

/** The object a passed Mission leaves behind, if this episode has one. */
export async function grantMissionReward(
  db: Db,
  userId: string,
  lessonId: string,
): Promise<UnlockedRewardDTO | null> {
  const definition = rewardForMission(lessonId);
  if (!definition) return null;
  return grantReward(db, userId, definition.id, "mission", lessonId);
}

/** Unlocked once every episode of a chapter has reached at least CAN DO. */
export async function evaluateChapterReward(
  db: Db,
  userId: string,
  moduleId: string,
): Promise<UnlockedRewardDTO | null> {
  const lessons = await listPublishedLessonsByModule(db, moduleId);
  if (lessons.length === 0) return null;
  const capabilities = await listCapabilitiesForLessons(
    db,
    userId,
    lessons.map((l) => l.id),
  );
  const allEarned = lessons.every((lesson) => {
    const state = capabilities.get(lesson.id)?.state;
    return state === "can_do" || state === "consolidated";
  });
  if (!allEarned) return null;
  return grantReward(db, userId, CHAPTER_REWARD_ID, "chapter", moduleId);
}

/** Practising on enough separate days in the last week. Counts days, not
 * sessions, and never punishes a gap — it simply doesn't fire. */
export async function evaluateWeekMilestone(
  db: Db,
  userId: string,
  now: Date = new Date(),
): Promise<UnlockedRewardDTO | null> {
  const since = addDays(now, -7);
  const days = await listActiveDays(db, userId, since);
  if (days.length < WEEK_MILESTONE_ACTIVE_DAYS) return null;
  return grantReward(db, userId, WEEK_MILESTONE_REWARD_ID, "milestone", null);
}

export async function grantConsolidationReward(
  db: Db,
  userId: string,
  lessonId: string,
): Promise<UnlockedRewardDTO | null> {
  return grantReward(
    db,
    userId,
    CONSOLIDATION_REWARD_ID,
    "consolidated",
    lessonId,
  );
}

export async function grantSharedGoalReward(
  db: Db,
  userId: string,
): Promise<UnlockedRewardDTO | null> {
  return grantReward(db, userId, SHARED_GOAL_REWARD_ID, "shared", null);
}
