import type { SessionKind } from "@english-level/contracts";

/** Situation context is an entrance cue, not permanent dialogue chrome. */
export function shouldShowSituationIntro(
  kind: SessionKind,
  sessionIndex: number,
  activityPosition: number,
): boolean {
  return kind === "lesson" && sessionIndex === 1 && activityPosition === 1;
}
