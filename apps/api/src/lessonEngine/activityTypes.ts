import type { ExerciseTypeRow, LessonItemContentTypeRow } from "../db/types.ts";

/**
 * Internal, server-only representation of an activity — includes the
 * answer key. This is what gets JSON-serialized into
 * `learning_sessions.activities_json`. It is never sent to the client;
 * `lessonEngine/activityDto.ts` maps it down to the public `ActivityDTO`,
 * stripping every answer-key field.
 */
export interface StoredActivityOption {
  id: string;
  text: string;
}

interface StoredActivityBase {
  id: string;
  targetType: LessonItemContentTypeRow;
  targetId: string;
  /** True for a clone re-asked a few activities after a wrong answer.
   * Prevents a retry from spawning another retry. See docs/lesson-engine.md
   * ("session-level reinforcement", not SRS). */
  isRetry?: boolean;
}

export interface StoredInfoCard extends StoredActivityBase {
  kind: "info_card";
  content: {
    displayForm: string;
    translation: string;
    ipa: string | null;
    example: string | null;
    pattern: string | null;
  };
}

export interface StoredGrammarCard extends StoredActivityBase {
  kind: "grammar_card";
  content: {
    title: string;
    formula: string | null;
    explanation: string;
  };
}

export interface StoredMultipleChoice extends StoredActivityBase {
  kind: "multiple_choice";
  prompt: string;
  content: { text: string };
  options: StoredActivityOption[];
  correctOptionId: string;
  explanation: string | null;
}

export interface StoredFillGapChoice extends StoredActivityBase {
  kind: "fill_gap_choice";
  prompt: string;
  content: { sentence: string };
  options: StoredActivityOption[];
  correctOptionId: string;
  explanation: string | null;
}

export interface StoredTypedRecall extends StoredActivityBase {
  kind: "typed_recall";
  prompt: string;
  content: { text: string };
  acceptedAnswers: string[];
  explanation: string | null;
}

export interface StoredSentenceBuild extends StoredActivityBase {
  kind: "sentence_build";
  prompt: string;
  content: { tokens: string[] };
  correctAnswer: string;
  explanation: string | null;
}

export type ScoredActivity =
  | StoredMultipleChoice
  | StoredFillGapChoice
  | StoredTypedRecall
  | StoredSentenceBuild;

export type StoredActivity =
  StoredInfoCard | StoredGrammarCard | ScoredActivity;

export function isScoredActivity(
  activity: StoredActivity,
): activity is ScoredActivity {
  return activity.kind !== "info_card" && activity.kind !== "grammar_card";
}

export const SCORED_EXERCISE_TYPES: ExerciseTypeRow[] = [
  "multiple_choice",
  "fill_gap_choice",
  "typed_recall",
  "sentence_build",
];
