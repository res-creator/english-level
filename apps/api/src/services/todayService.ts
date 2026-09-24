import type {
  CefrLevel,
  EpisodeDTO,
  TodayAction,
  TodayResponse,
} from "@english-level/contracts";
import type { Db, LessonRow, ModuleRow } from "../db/types.ts";
import { findActiveSessionForUser } from "../repositories/learningSessionsRepository.ts";
import {
  findPublishedLessonById,
  findPublishedModuleById,
  listPublishedLessonsByModule,
  listPublishedModulesByLevel,
} from "../repositories/curriculumRepository.ts";
import {
  findCapability,
  listCapabilities,
  listCapabilitiesForLessons,
} from "../repositories/capabilitiesRepository.ts";
import { findCompanion } from "../repositories/companionRewardsRepository.ts";
import {
  findLastCompletedSessionAt,
  findFriend,
} from "../repositories/friendsRepository.ts";
import {
  addDays,
  rescheduleOverdueStatement,
} from "../repositories/itemMemoryRepository.ts";
import { buildEpisodeDTO } from "./lessonSessionService.ts";
import { MAX_REVIEW_ITEMS, countDueForUser } from "./reviewService.ts";
import { getFriendState } from "./friendService.ts";

function levelId(code: string): string {
  return `lvl_${code.toLowerCase()}`;
}

/** Long enough that the learner has genuinely been away, short enough that
 * the app notices before the habit is gone. */
const ABSENCE_DAYS = 4;

/**
 * Coming back must never look like debt. After an absence the overdue pile
 * is spread out again so only a normal session's worth is waiting today —
 * the schedule bends, the learner isn't punished.
 */
async function softenAfterAbsence(
  db: Db,
  userId: string,
  now: Date,
): Promise<number | null> {
  const last = await findLastCompletedSessionAt(db, userId);
  if (!last) return null;
  const daysAway = Math.floor(
    (now.getTime() - new Date(last.completed_at).getTime()) / 86_400_000,
  );
  if (daysAway < ABSENCE_DAYS) return null;
  await db.batch([
    rescheduleOverdueStatement(
      userId,
      now.toISOString(),
      now,
      MAX_REVIEW_ITEMS,
    ),
  ]);
  return daysAway;
}

/** The first episode whose capability isn't earned yet, in course order.
 * Takes the level's already-fetched modules rather than the level code, so
 * `getToday` can check "does this level have any content at all" once and
 * reuse the same list here instead of querying it twice. */
async function findCurrentEpisode(
  db: Db,
  userId: string,
  modules: ModuleRow[],
): Promise<{
  lesson: LessonRow;
  chapterTitle: string;
  chapterProgress: { done: number; total: number };
} | null> {
  for (const module_ of modules) {
    const lessons = await listPublishedLessonsByModule(db, module_.id);
    if (lessons.length === 0) continue;
    const capabilities = await listCapabilitiesForLessons(
      db,
      userId,
      lessons.map((l) => l.id),
    );
    const done = lessons.filter((l) => {
      const state = capabilities.get(l.id)?.state;
      return state === "can_do" || state === "consolidated";
    }).length;
    const next = lessons.find((l) => {
      const state = capabilities.get(l.id)?.state;
      return state !== "can_do" && state !== "consolidated";
    });
    if (next) {
      return {
        lesson: next,
        chapterTitle: module_.title,
        chapterProgress: { done, total: lessons.length },
      };
    }
  }
  return null;
}

/**
 * "What do I do right now" — one answer, decided on the server.
 *
 * Priority: an unfinished session first (never make someone restart what
 * they began), then the Mission when the episode's content is done, then
 * the next session, then review, then nothing. Review is offered *after*
 * the day's learning rather than gating it, so the app never opens with a
 * chore.
 */
export async function getToday(
  db: Db,
  userId: string,
  currentCefrLevel: string | null,
  now: Date = new Date(),
): Promise<TodayResponse> {
  const daysAway = await softenAfterAbsence(db, userId, now);
  const reviewDue = await countDueForUser(db, userId);
  const companion = await findCompanion(db, userId);
  const allCapabilities = await listCapabilities(db, userId);
  const capabilityCounts = {
    canDo: allCapabilities.filter((c) => c.state === "can_do").length,
    consolidated: allCapabilities.filter((c) => c.state === "consolidated")
      .length,
  };

  const friendship = await findFriend(db, userId);
  let weeklyGoal: TodayResponse["weeklyGoal"] = null;
  if (friendship) {
    const state = await getFriendState(db, userId, now);
    weeklyGoal = {
      target: state.goal.target,
      mine: state.goal.mine,
      friendName: state.friend?.firstName ?? null,
      friendDone: state.goal.friendDone,
      completed: state.goal.completed,
    };
  }

  const base = {
    level: (currentCefrLevel as CefrLevel | null) ?? null,
    reviewDue,
    capabilities: capabilityCounts,
    companionId: companion?.companion_id ?? null,
    daysAway,
    weeklyGoal,
  };

  const nothing: TodayResponse = {
    ...base,
    action: reviewDue > 0 ? "review" : "none",
    episode: null,
    chapterTitle: null,
    estimatedMinutes: null,
    chapterProgress: null,
  };

  // 1. An unfinished session always wins.
  const active = await findActiveSessionForUser(db, userId);
  if (active) {
    const lesson = await findPublishedLessonById(db, active.lesson_id);
    if (lesson) {
      const capability = await findCapability(db, userId, lesson.id);
      const module_ = await findPublishedModuleById(db, lesson.module_id);
      const episode = buildEpisodeDTO(lesson, capability);
      return {
        ...base,
        action: active.session_kind === "mission" ? "mission" : "session",
        episode,
        chapterTitle: module_?.title ?? null,
        estimatedMinutes: lesson.estimated_minutes,
        chapterProgress: null,
      };
    }
  }

  if (!currentCefrLevel) return nothing;

  // Public V1 is A1-only: a level placement can honestly land someone
  // above (or, once more levels ship, below) what's actually published.
  // That must never be confused with "finished everything" — the learner
  // hasn't done anything yet, there's simply nothing here for their level.
  const modules = await listPublishedModulesByLevel(
    db,
    levelId(currentCefrLevel),
  );
  if (modules.length === 0) {
    return {
      ...base,
      action: reviewDue > 0 ? "review" : "unavailable",
      episode: null,
      chapterTitle: null,
      estimatedMinutes: null,
      chapterProgress: null,
    };
  }

  const current = await findCurrentEpisode(db, userId, modules);
  if (!current) return nothing;

  const capability = await findCapability(db, userId, current.lesson.id);
  const episode: EpisodeDTO = buildEpisodeDTO(current.lesson, capability);
  const action: TodayAction = episode.missionReady ? "mission" : "session";

  return {
    ...base,
    action,
    episode,
    chapterTitle: current.chapterTitle,
    estimatedMinutes: current.lesson.estimated_minutes,
    chapterProgress: current.chapterProgress,
  };
}

/** Exported for tests: the date an item pushed out of today's queue lands
 * on after an absence. */
export const nextDayAfter = (from: Date): string => addDays(from, 1);
