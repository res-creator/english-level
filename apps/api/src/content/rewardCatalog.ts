import type { RewardSourceKindRow } from "../db/types.ts";

/**
 * Every reward is a **memory object**: it exists because a specific piece
 * of English was actually learned, and tapping it shows that language back.
 * There is no currency, no shop and no random drop — a reward is only ever
 * the visible trace of a real learning event.
 *
 * The catalogue is content, not data: adding an episode means adding a row
 * here, never a migration.
 */
export type RewardTier =
  "small" | "medium" | "rare" | "chapter" | "milestone" | "shared";

/** Fixed places in the companion's space — there is no free placement. */
export type RoomSlot =
  "desk" | "shelf" | "wall" | "window" | "floor" | "plant" | "pair";

export interface RewardDefinition {
  id: string;
  title: string;
  /** Why it appeared, in the learner's words. */
  reason: string;
  tier: RewardTier;
  slot: RoomSlot;
  sourceKind: RewardSourceKindRow;
  /** Episode this object remembers, when it has one. */
  lessonId?: string;
  /** Simple glyph the client renders in the room. */
  glyph: string;
}

export const REWARDS: RewardDefinition[] = [
  {
    id: "rw_frame",
    title: "Фоторамка",
    reason: "За первое знакомство по-английски",
    tier: "small",
    slot: "desk",
    sourceKind: "mission",
    lessonId: "les_sie_a1_e1",
    glyph: "🖼",
  },
  {
    id: "rw_mug",
    title: "Кружка",
    reason: "За первый самостоятельный заказ",
    tier: "medium",
    slot: "desk",
    sourceKind: "mission",
    lessonId: "les_sie_a1_e2",
    glyph: "☕",
  },
  {
    id: "rw_lamp",
    title: "Настольная лампа",
    reason: "За рассказ о своём дне",
    tier: "medium",
    slot: "desk",
    sourceKind: "mission",
    lessonId: "les_sie_a1_e3",
    glyph: "💡",
  },
  {
    id: "rw_map",
    title: "Карта города",
    reason: "За умение спросить дорогу и переспросить",
    tier: "medium",
    slot: "wall",
    sourceKind: "mission",
    lessonId: "les_sie_a1_e4",
    glyph: "🗺",
  },
  {
    id: "rw_window",
    title: "Окно с видом на город",
    reason: "За решённую проблему по-английски",
    tier: "chapter",
    slot: "window",
    sourceKind: "mission",
    lessonId: "les_sie_a1_e5",
    glyph: "🪟",
  },
  {
    id: "rw_plant",
    title: "Растение",
    reason: "За язык, который остался с тобой через неделю",
    tier: "rare",
    slot: "plant",
    sourceKind: "consolidated",
    glyph: "🌱",
  },
  {
    id: "rw_shelf",
    title: "Полка",
    reason: "За пройденную главу целиком",
    tier: "chapter",
    slot: "shelf",
    sourceKind: "chapter",
    glyph: "📚",
  },
  {
    id: "rw_blanket",
    title: "Плед и кресло",
    reason: "За неделю занятий",
    tier: "milestone",
    slot: "floor",
    sourceKind: "milestone",
    glyph: "🛋",
  },
  {
    id: "rw_shared_plant",
    title: "Общее растение",
    reason: "За совместную цель с другом",
    tier: "shared",
    slot: "pair",
    sourceKind: "shared",
    glyph: "🪴",
  },
];

export function findRewardDefinition(id: string): RewardDefinition | undefined {
  return REWARDS.find((r) => r.id === id);
}

/** Which object a passed Mission unlocks, if this episode has one. */
export function rewardForMission(
  lessonId: string,
): RewardDefinition | undefined {
  return REWARDS.find(
    (r) => r.sourceKind === "mission" && r.lessonId === lessonId,
  );
}

export const CONSOLIDATION_REWARD_ID = "rw_plant";
export const CHAPTER_REWARD_ID = "rw_shelf";
export const WEEK_MILESTONE_REWARD_ID = "rw_blanket";
export const SHARED_GOAL_REWARD_ID = "rw_shared_plant";

/** A week counts as practised on this many distinct days. */
export const WEEK_MILESTONE_ACTIVE_DAYS = 5;
