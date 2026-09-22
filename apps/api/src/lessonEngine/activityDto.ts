import type { ActivityDTO } from "@english-level/contracts";
import type { StoredActivity } from "./activityTypes.ts";

/**
 * Strips every answer-key field (correctOptionId, acceptedAnswers,
 * correctAnswer, explanation, isRetry, targetType/targetId) and returns
 * only what the frontend is allowed to see before answering.
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
      };
    case "fill_gap_choice":
      return {
        id: activity.id,
        kind: "fill_gap_choice",
        progress,
        prompt: activity.prompt,
        content: activity.content,
        options: activity.options,
      };
    case "typed_recall":
      return {
        id: activity.id,
        kind: "typed_recall",
        progress,
        prompt: activity.prompt,
        content: activity.content,
      };
    case "sentence_build":
      return {
        id: activity.id,
        kind: "sentence_build",
        progress,
        prompt: activity.prompt,
        content: activity.content,
      };
  }
}
