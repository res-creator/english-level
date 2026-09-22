import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

/**
 * The safe, public shape of a user account — what the frontend is allowed
 * to see. Never includes `telegram_user_id`, session data, or any other
 * internal-only database field.
 */
export const PublicUserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  username: z.string().nullable(),
  interfaceLanguage: z.string(),
  timezone: z.string().nullable(),
  currentCefrLevel: z.string().nullable(),
  onboardingCompleted: z.boolean(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const TelegramAuthRequestSchema = z.object({
  initData: z.string().min(1),
});
export type TelegramAuthRequest = z.infer<typeof TelegramAuthRequestSchema>;

export const TelegramAuthResponseSchema = z.object({
  user: PublicUserSchema,
  // Navigation intent only — "onboarding"/"placement" don't imply those
  // flows are fully implemented, just where to route the user next.
  next: z.enum(["onboarding", "placement", "today"]),
});
export type TelegramAuthResponse = z.infer<typeof TelegramAuthResponseSchema>;

export const MeResponseSchema = PublicUserSchema;
export type MeResponse = z.infer<typeof MeResponseSchema>;

export const LogoutResponseSchema = z.object({
  ok: z.literal(true),
});
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

export const AuthErrorResponseSchema = z.object({
  error: z.string(),
});
export type AuthErrorResponse = z.infer<typeof AuthErrorResponseSchema>;

/** Generic `{ error: string }` shape, shared by auth and onboarding routes. */
export const ErrorResponseSchema = AuthErrorResponseSchema;
export type ErrorResponse = AuthErrorResponse;

// ---------------------------------------------------------------------------
// Onboarding (Phase 3) — preference collection only. "placement_required" is
// the final stage this phase reaches; the placement test itself is a future
// phase's responsibility, not implemented here.
// ---------------------------------------------------------------------------

export const LearningGoalSchema = z.enum([
  "everyday",
  "travel",
  "work",
  "study",
  "moving_abroad",
  "movies_internet",
]);
export type LearningGoal = z.infer<typeof LearningGoalSchema>;
export const LEARNING_GOALS = LearningGoalSchema.options;

export const DailyMinutesSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
]);
export type DailyMinutes = z.infer<typeof DailyMinutesSchema>;
export const DAILY_MINUTES_OPTIONS = DailyMinutesSchema.options.map(
  (l) => l.value,
);

export const CefrLevelSchema = z.enum(["A1", "A2", "B1", "B2"]);
export type CefrLevel = z.infer<typeof CefrLevelSchema>;

export const SelfReportedCefrLevelSchema = CefrLevelSchema.nullable();
export type SelfReportedCefrLevel = z.infer<typeof SelfReportedCefrLevelSchema>;

export const OnboardingStageSchema = z.enum([
  "goals",
  "daily_time",
  "level_choice",
  "placement_required",
  "completed",
]);
export type OnboardingStage = z.infer<typeof OnboardingStageSchema>;

export const OnboardingStateResponseSchema = z.object({
  stage: OnboardingStageSchema,
  goals: z.array(LearningGoalSchema),
  dailyMinutes: DailyMinutesSchema.nullable(),
  selfReportedCefrLevel: SelfReportedCefrLevelSchema,
});
export type OnboardingStateResponse = z.infer<
  typeof OnboardingStateResponseSchema
>;

export const UpdateGoalsRequestSchema = z.object({
  goals: z
    .array(LearningGoalSchema)
    .min(1, "select at least 1 goal")
    .max(3, "select at most 3 goals")
    .refine((goals) => new Set(goals).size === goals.length, {
      message: "goals must not contain duplicates",
    }),
});
export type UpdateGoalsRequest = z.infer<typeof UpdateGoalsRequestSchema>;

export const UpdateDailyTimeRequestSchema = z.object({
  minutes: DailyMinutesSchema,
});
export type UpdateDailyTimeRequest = z.infer<
  typeof UpdateDailyTimeRequestSchema
>;

export const UpdateLevelRequestSchema = z.object({
  level: SelfReportedCefrLevelSchema,
});
export type UpdateLevelRequest = z.infer<typeof UpdateLevelRequestSchema>;

// ---------------------------------------------------------------------------
// Placement test (Phase 4) — adaptive test producing a *verified* CEFR level,
// distinct from the self-report collected in onboarding. See
// docs/placement-test.md for the algorithm. DTOs here never carry answer
// keys, internal difficulty metadata, or raw DB rows.
// ---------------------------------------------------------------------------

export const PlacementSkillSchema = z.enum([
  "vocabulary",
  "grammar",
  "reading",
  "active_english",
]);
export type PlacementSkill = z.infer<typeof PlacementSkillSchema>;

export const PlacementQuestionTypeSchema = z.enum([
  "multiple_choice",
  "fill_gap_choice",
  "reading_multiple_choice",
  "typed_short_answer",
]);
export type PlacementQuestionType = z.infer<typeof PlacementQuestionTypeSchema>;

export const PlacementProgressSchema = z.object({
  answered: z.number().int().nonnegative(),
  estimatedTotal: z.number().int().positive(),
});
export type PlacementProgress = z.infer<typeof PlacementProgressSchema>;

/** What the client is allowed to see about a question — no correct answer,
 * no CEFR difficulty band, no discrimination/internal metadata. */
export const PlacementQuestionDTOSchema = z.object({
  id: z.string(),
  type: PlacementQuestionTypeSchema,
  skill: PlacementSkillSchema,
  prompt: z.string(),
  passage: z.string().nullable(),
  options: z.array(z.string()).nullable(),
});
export type PlacementQuestionDTO = z.infer<typeof PlacementQuestionDTOSchema>;

export const PlacementStartResponseSchema = z.object({
  attemptId: z.string(),
  question: PlacementQuestionDTOSchema,
  progress: PlacementProgressSchema,
});
export type PlacementStartResponse = z.infer<
  typeof PlacementStartResponseSchema
>;

export const PlacementCurrentResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("none") }),
  z.object({
    status: z.literal("in_progress"),
    attemptId: z.string(),
    question: PlacementQuestionDTOSchema,
    progress: PlacementProgressSchema,
  }),
  z.object({ status: z.literal("completed"), attemptId: z.string() }),
]);
export type PlacementCurrentResponse = z.infer<
  typeof PlacementCurrentResponseSchema
>;

export const PlacementAnswerRequestSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string(),
  responseTimeMs: z.number().int().nonnegative().optional(),
  attemptIdempotencyKey: z.string().optional(),
});
export type PlacementAnswerRequest = z.infer<
  typeof PlacementAnswerRequestSchema
>;

export const PlacementAnswerResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("continue"),
    question: PlacementQuestionDTOSchema,
    progress: PlacementProgressSchema,
  }),
  z.object({ status: z.literal("completed"), attemptId: z.string() }),
]);
export type PlacementAnswerResponse = z.infer<
  typeof PlacementAnswerResponseSchema
>;

export const PlacementResultResponseSchema = z.object({
  level: CefrLevelSchema,
  scores: z.object({
    vocabulary: z.number().int(),
    grammar: z.number().int(),
    reading: z.number().int(),
    activeEnglish: z.number().int(),
  }),
  strongestSkill: PlacementSkillSchema,
  weakestSkill: PlacementSkillSchema,
  selfReportedLevel: SelfReportedCefrLevelSchema,
});
export type PlacementResultResponse = z.infer<
  typeof PlacementResultResponseSchema
>;

// ---------------------------------------------------------------------------
// Curriculum (Phase 5) — read-only structure and reusable content. No user
// progress/completion state exists yet; these DTOs never carry it.
// ---------------------------------------------------------------------------

export const LessonTypeSchema = z.enum([
  "vocabulary",
  "grammar",
  "mixed",
  "reading",
  "practice",
  "checkpoint",
]);
export type LessonType = z.infer<typeof LessonTypeSchema>;

export const LearningItemTypeSchema = z.enum([
  "word",
  "phrase",
  "collocation",
  "phrasal_verb",
  "functional_phrase",
  "contrast",
]);
export type LearningItemType = z.infer<typeof LearningItemTypeSchema>;

export const LessonItemRoleSchema = z.enum([
  "introduce",
  "practice",
  "review",
  "target",
]);
export type LessonItemRole = z.infer<typeof LessonItemRoleSchema>;

/** A single module in a level's path — no completion/progress data. */
export const CurriculumModuleDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number().int(),
  lessons: z.number().int(),
});
export type CurriculumModuleDTO = z.infer<typeof CurriculumModuleDTOSchema>;

export const CurriculumPathResponseSchema = z.object({
  currentLevel: CefrLevelSchema.nullable(),
  modules: z.array(CurriculumModuleDTOSchema),
});
export type CurriculumPathResponse = z.infer<
  typeof CurriculumPathResponseSchema
>;

export const CurriculumLessonSummaryDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: LessonTypeSchema,
  order: z.number().int(),
  estimatedMinutes: z.number().int().nullable(),
});
export type CurriculumLessonSummaryDTO = z.infer<
  typeof CurriculumLessonSummaryDTOSchema
>;

export const ModuleDetailResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  level: CefrLevelSchema,
  order: z.number().int(),
  lessons: z.array(CurriculumLessonSummaryDTOSchema),
});
export type ModuleDetailResponse = z.infer<typeof ModuleDetailResponseSchema>;

/** A reusable learning item as shown in a lesson preview — never internal
 * fields like frequency_band, difficulty, provenance, or content_version. */
export const LearningItemDTOSchema = z.object({
  id: z.string(),
  itemType: LearningItemTypeSchema,
  displayForm: z.string(),
  translation: z.string(),
  usageNote: z.string().nullable(),
  primaryExample: z.string().nullable(),
});
export type LearningItemDTO = z.infer<typeof LearningItemDTOSchema>;

export const GrammarPatternDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  formula: z.string().nullable(),
  explanation: z.string(),
  usageNote: z.string().nullable(),
});
export type GrammarPatternDTO = z.infer<typeof GrammarPatternDTOSchema>;

export const LessonContentEntrySchema = z.discriminatedUnion("contentType", [
  z.object({
    contentType: z.literal("learning_item"),
    role: LessonItemRoleSchema,
    item: LearningItemDTOSchema,
  }),
  z.object({
    contentType: z.literal("grammar_pattern"),
    role: LessonItemRoleSchema,
    pattern: GrammarPatternDTOSchema,
  }),
]);
export type LessonContentEntry = z.infer<typeof LessonContentEntrySchema>;

/** A lesson's content STRUCTURE only — not a session, no answer
 * processing, nothing is marked started/completed by reading this. */
export const LessonContentDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: LessonTypeSchema,
  moduleId: z.string(),
  content: z.array(LessonContentEntrySchema),
});
export type LessonContentDTO = z.infer<typeof LessonContentDTOSchema>;
