import type { EpisodeDTO } from "@english-level/contracts";

export type PathNodeState = "done" | "current" | "started" | "locked";

/**
 * Public V1 is a sequential path: only one situation is genuinely "next"
 * at a time (the server-verified `currentEpisodeId`), and everything
 * after it is locked until that one's Mission passes. Kept pure so the
 * locking rule itself — not the rendering — can be tested without a DOM.
 */
export function resolvePathNodeState(
  episode: EpisodeDTO,
  isCurrent: boolean,
): PathNodeState {
  const earned = episode.state === "can_do" || episode.state === "consolidated";
  if (earned) return "done";
  if (isCurrent) return "current";
  if (episode.state === "learning") return "started";
  return "locked";
}

export const LOCKED_NODE_MESSAGE = "Сначала закончи предыдущую ситуацию.";
