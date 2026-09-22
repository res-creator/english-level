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

/** Whether the current user has started/finished a lesson — from
 * `user_lesson_progress` (Phase 6). Never invents mastery/knowledge. */
export const LessonProgressStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
]);
export type LessonProgressStatus = z.infer<typeof LessonProgressStatusSchema>;

export const CurriculumLessonSummaryDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: LessonTypeSchema,
  order: z.number().int(),
  estimatedMinutes: z.number().int().nullable(),
  progressStatus: LessonProgressStatusSchema,
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

// ---------------------------------------------------------------------------
// Lesson execution engine (Phase 6) — sessions, activities, answers, results.
// Content (above) and execution (below) stay separate layers. An ActivityDTO
// never exposes the correct answer, or any answer key, before it is
// answered — the backend is the only source of truth for correctness,
// completion, and position.
// ---------------------------------------------------------------------------

export const ActivityKindSchema = z.enum([
  "info_card",
  "grammar_card",
  "multiple_choice",
  "fill_gap_choice",
  "typed_recall",
  "sentence_build",
]);
export type ActivityKind = z.infer<typeof ActivityKindSchema>;

export const ActivityOptionDTOSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type ActivityOptionDTO = z.infer<typeof ActivityOptionDTOSchema>;

export const ActivityProgressSchema = z.object({
  current: z.number().int().positive(),
  total: z.number().int().positive(),
});
export type ActivityProgress = z.infer<typeof ActivityProgressSchema>;

const activityBase = { id: z.string(), progress: ActivityProgressSchema };

/** The single current activity for a session — never the whole plan, and
 * never with a correct-answer field, until after it has been answered. */
export const ActivityDTOSchema = z.discriminatedUnion("kind", [
  z.object({
    ...activityBase,
    kind: z.literal("info_card"),
    content: z.object({
      displayForm: z.string(),
      translation: z.string(),
      ipa: z.string().nullable(),
      example: z.string().nullable(),
      pattern: z.string().nullable(),
    }),
  }),
  z.object({
    ...activityBase,
    kind: z.literal("grammar_card"),
    content: z.object({
      title: z.string(),
      formula: z.string().nullable(),
      explanation: z.string(),
    }),
  }),
  z.object({
    ...activityBase,
    kind: z.literal("multiple_choice"),
    prompt: z.string(),
    content: z.object({ text: z.string() }),
    options: z.array(ActivityOptionDTOSchema),
  }),
  z.object({
    ...activityBase,
    kind: z.literal("fill_gap_choice"),
    prompt: z.string(),
    content: z.object({ sentence: z.string() }),
    options: z.array(ActivityOptionDTOSchema),
  }),
  z.object({
    ...activityBase,
    kind: z.literal("typed_recall"),
    prompt: z.string(),
    content: z.object({ text: z.string() }),
  }),
  z.object({
    ...activityBase,
    kind: z.literal("sentence_build"),
    prompt: z.string(),
    content: z.object({ tokens: z.array(z.string()) }),
  }),
]);
export type ActivityDTO = z.infer<typeof ActivityDTOSchema>;

export const LessonSessionStatusSchema = z.enum([
  "in_progress",
  "completed",
  "abandoned",
]);
export type LessonSessionStatus = z.infer<typeof LessonSessionStatusSchema>;

/** Shared shape for both "start a lesson" and "resume a session" — a
 * session is trivially resumable because this is all the client needs. */
export const LessonSessionDTOSchema = z.object({
  sessionId: z.string(),
  status: LessonSessionStatusSchema,
  lesson: z.object({ id: z.string(), title: z.string() }),
  currentActivity: ActivityDTOSchema.nullable(),
});
export type LessonSessionDTO = z.infer<typeof LessonSessionDTOSchema>;

export const StartLessonResponseSchema = LessonSessionDTOSchema;
export type StartLessonResponse = z.infer<typeof StartLessonResponseSchema>;

export const AnswerActivityRequestSchema = z.object({
  activityId: z.string(),
  answer: z.string(),
  responseTimeMs: z.number().int().nonnegative().optional(),
  /** Client-generated idempotency key. A repeated request with the same
   * attemptId must not double-grade, double-count, or skip an activity. */
  attemptId: z.string().min(1),
});
export type AnswerActivityRequest = z.infer<typeof AnswerActivityRequestSchema>;

export const AnswerFeedbackSchema = z.discriminatedUnion("correct", [
  z.object({ correct: z.literal(true) }),
  z.object({
    correct: z.literal(false),
    correctAnswer: z.string(),
    explanation: z.string().nullable(),
  }),
]);
export type AnswerFeedback = z.infer<typeof AnswerFeedbackSchema>;

/**
 * Only what actually exists, and only ever for a session that has really
 * completed — every field here is reconstructable from persisted
 * `learning_sessions`/`user_lesson_progress` data. No streak, no
 * mastery, no "words learned", no XP, no level progress — those systems
 * don't exist yet. This is also what `GET /api/v1/sessions/:id/result`
 * returns, so a page reload can reconstruct the same result the answer
 * response originally carried.
 */
export const LessonResultDTOSchema = z.object({
  sessionId: z.string(),
  lessonId: z.string(),
  lessonTitle: z.string(),
  status: z.literal("completed"),
  correctCount: z.number().int().nonnegative(),
  wrongCount: z.number().int().nonnegative(),
  scoredAttempts: z.number().int().nonnegative(),
  accuracy: z.number().int().min(0).max(100),
  completedAt: z.string(),
});
export type LessonResultDTO = z.infer<typeof LessonResultDTOSchema>;

export const AnswerActivityResponseSchema = z.object({
  feedback: AnswerFeedbackSchema,
  session: z.discriminatedUnion("status", [
    z.object({
      status: z.literal("in_progress"),
      nextActivity: ActivityDTOSchema,
    }),
    z.object({
      status: z.literal("completed"),
      result: LessonResultDTOSchema,
    }),
  ]),
});
export type AnswerActivityResponse = z.infer<
  typeof AnswerActivityResponseSchema
>;
