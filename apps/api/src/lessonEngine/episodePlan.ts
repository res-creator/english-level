import { asDialogueTurn } from "./dialogueTurns.ts";
import { findPublishedLearningItemById } from "../repositories/learningItemRepository.ts";
import type { Db, LessonItemRow } from "../db/types.ts";
import {
  buildActivityPlan,
  buildItemActivity,
} from "./lessonSessionBuilder.ts";
import type { ScoredActivity, StoredActivity } from "./activityTypes.ts";

/**
 * An episode is one situation; a **session** is what the learner does
 * today. The engine builds the episode's full, deterministic activity plan
 * exactly as before — this module then cuts it into 5–8 minute sessions.
 *
 * Cutting (rather than authoring sessions by hand) means legacy content
 * shortens automatically, and adding a new episode stays pure content work.
 */

/** Upper bound per session. 12 activities ≈ 6–7 minutes at A1 pace. */
export const MAX_ACTIVITIES_PER_SESSION = 12;
/** Never end a session this short unless it's the episode's last one. */
const MIN_ACTIVITIES_PER_SESSION = 6;

/** Activities for the same target are never split across two days — the
 * card, its recognition check and its use belong together. */
function groupByTarget(plan: StoredActivity[]): StoredActivity[][] {
  const groups: StoredActivity[][] = [];
  for (const activity of plan) {
    const last = groups[groups.length - 1];
    if (last && last[0]?.targetId === activity.targetId) {
      last.push(activity);
    } else {
      groups.push([activity]);
    }
  }
  return groups;
}

export function sliceIntoSessions(plan: StoredActivity[]): StoredActivity[][] {
  if (plan.length === 0) return [];
  const sessions: StoredActivity[][] = [];
  let current: StoredActivity[] = [];

  for (const group of groupByTarget(plan)) {
    const wouldExceed =
      current.length + group.length > MAX_ACTIVITIES_PER_SESSION;
    if (wouldExceed && current.length >= MIN_ACTIVITIES_PER_SESSION) {
      sessions.push(current);
      current = [];
    }
    current.push(...group);
  }
  if (current.length > 0) sessions.push(current);
  return sessions;
}

export interface EpisodeSessions {
  /** Every session of the episode, in order. */
  sessions: StoredActivity[][];
  total: number;
}

export async function planEpisodeSessions(
  db: Db,
  levelId: string,
  lessonItems: LessonItemRow[],
): Promise<EpisodeSessions> {
  const plan = await buildActivityPlan(db, levelId, lessonItems);
  const sessions = sliceIntoSessions(plan);
  return { sessions, total: sessions.length };
}

/**
 * The Mission: proof that the episode's language can actually be produced.
 * Production formats only (build the sentence, type the word) — a Mission
 * made of multiple choice would prove nothing. Falls back one rung at a
 * time for items that can't support production, and never invents content.
 */
export async function buildMissionPlan(
  db: Db,
  levelId: string,
  lessonItems: LessonItemRow[],
): Promise<ScoredActivity[]> {
  const targets = lessonItems.filter(
    (link) => link.role === "introduce" || link.role === "target",
  );
  const activities: ScoredActivity[] = [];

  for (const link of targets) {
    const activity = await buildItemActivity(db, levelId, link, "production");
    if (!activity) continue;
    const item =
      link.content_type === "learning_item"
        ? await findPublishedLearningItemById(db, link.content_id)
        : null;
    const npcReply = item?.npc_reply_correct
      ? { correct: item.npc_reply_correct, incorrect: item.npc_reply_incorrect }
      : undefined;
    activities.push(asDialogueTurn(activity, link.id, npcReply));
  }

  return activities.map((activity, index) => ({
    ...activity,
    id: `msn_${String(index + 1).padStart(3, "0")}`,
  }));
}

/** A Mission is passed on accuracy, not perfection. */
export const MISSION_PASS_ACCURACY = 80;
