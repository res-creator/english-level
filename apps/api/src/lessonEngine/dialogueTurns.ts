import type { ScoredActivity, StoredActivity } from "./activityTypes.ts";

/** Recognition and grammar checks are exercises, not spoken utterances. */
export function isSpokenActivity(activity: StoredActivity): boolean {
  return (
    activity.kind === "fill_gap_choice" ||
    activity.kind === "sentence_build" ||
    activity.kind === "typed_recall"
  );
}

/** Mark the completion of one authored learner turn, never its scaffolding. */
export function asDialogueTurn<T extends ScoredActivity>(
  activity: T,
  turnId: string,
  npcReply?: StoredActivity["npcReply"],
): T {
  if (!isSpokenActivity(activity)) return activity;
  return {
    ...activity,
    dialogueTurnId: turnId,
    ...(npcReply ? { npcReply } : {}),
  };
}

/** Old in-progress JSON plans predate the marker. Recover only boundaries
 * already evidenced by their authored NPC reply (or a Mission's one check
 * per target). No DB migration, content rewrite, or new exercise ordering. */
export function restoreDialogueTurns(
  plan: StoredActivity[],
  kind: string,
): StoredActivity[] {
  return plan.map((activity) => {
    if (!isSpokenActivity(activity) || activity.dialogueTurnId) return activity;
    if (kind !== "mission" && !activity.npcReply) return activity;
    return {
      ...activity,
      dialogueTurnId: `legacy:${activity.targetType}:${activity.targetId}`,
    };
  });
}
