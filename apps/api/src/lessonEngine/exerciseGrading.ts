import type { StoredActivity } from "./activityTypes.ts";

/** Trim, lowercase, collapse whitespace, drop a single trailing sentence
 * mark — no fuzzy/semantic matching, no AI. Structured-data-only
 * acceptance, per the Phase 6 spec. */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.?!]+$/, "");
}

/** info_card/grammar_card are not scored — acknowledging one always
 * "succeeds"; there is nothing to get wrong. */
export function gradeActivity(
  activity: StoredActivity,
  submitted: string,
): boolean {
  switch (activity.kind) {
    case "info_card":
    case "grammar_card":
      return true;
    case "multiple_choice":
    case "fill_gap_choice":
      return submitted.trim() === activity.correctOptionId;
    case "typed_recall": {
      const norm = normalizeAnswer(submitted);
      return activity.acceptedAnswers.some((a) => normalizeAnswer(a) === norm);
    }
    case "sentence_build":
      return (
        normalizeAnswer(submitted) === normalizeAnswer(activity.correctAnswer)
      );
  }
}

/** Human-readable correct answer for wrong-answer feedback. */
export function correctAnswerDisplay(activity: StoredActivity): string {
  switch (activity.kind) {
    case "info_card":
    case "grammar_card":
      return "";
    case "multiple_choice":
    case "fill_gap_choice": {
      const option = activity.options.find(
        (o) => o.id === activity.correctOptionId,
      );
      return option?.text ?? "";
    }
    case "typed_recall":
      return activity.acceptedAnswers[0] ?? "";
    case "sentence_build":
      return activity.correctAnswer;
  }
}

/** Reuses whatever explanation the activity was built with (item usage
 * note / example, or the grammar pattern's own explanation) — never
 * generated at answer time. */
export function explanationFor(activity: StoredActivity): string | null {
  switch (activity.kind) {
    case "info_card":
      return null;
    case "grammar_card":
      return activity.content.explanation;
    default:
      return activity.explanation;
  }
}
