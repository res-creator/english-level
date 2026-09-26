import type { ActivityDTO } from "@english-level/contracts";
import type { StoredActivity } from "./activityTypes.ts";

/**
 * Strips every answer-key field (correctOptionId, acceptedAnswers,
 * correctAnswer, explanation, isRetry, targetId) and returns only what
 * the frontend is allowed to see before answering. `multiple_choice`
 * alone keeps `targetType` — not an answer key, just enough for the
 * client to know whether `content.text` is redundant with the prompt
 * (a learning-item check's prompt always quotes it; a grammar-pattern
 * check's never does) — see `ActivityPanel.tsx`.
 */
export function toActivityDTO(
  activity: StoredActivity,
  position: number,
  total: number,
): ActivityDTO {
  const progress = { current: position + 1, total };

  switch (activity.kind) {
    case "info_card":
      return {
        id: activity.id,
        kind: "info_card",
        progress,
        content: activity.content,
      };
    case "grammar_card":
      return {
        id: activity.id,
        kind: "grammar_card",
        progress,
        content: activity.content,
      };
    case "multiple_choice":
      return {
        id: activity.id,
        kind: "multiple_choice",
        progress,
        prompt: activity.prompt,
        content: activity.content,
        options: activity.options,
        targetType: activity.targetType,
        npcReply: activity.npcReply,
      };
    case "fill_gap_choice":
      return {
        id: activity.id,
        kind: "fill_gap_choice",
        progress,
        prompt: activity.prompt,
        content: activity.content,
        options: activity.options,
        npcReply: activity.npcReply,
      };
    case "typed_recall":
      return {
        id: activity.id,
        kind: "typed_recall",
        progress,
        prompt: activity.prompt,
        content: activity.content,
        npcReply: activity.npcReply,
      };
    case "sentence_build":
      return {
        id: activity.id,
        kind: "sentence_build",
        progress,
        prompt: activity.prompt,
        content: activity.content,
        npcReply: activity.npcReply,
      };
  }
}
