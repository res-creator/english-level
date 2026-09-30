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

/** Whether the current user has started/finished a lesson — from
 * `user_lesson_progress` (Phase 6). Never invents mastery/knowledge. */
export const LessonProgressStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
]);
export type LessonProgressStatus = z.infer<typeof LessonProgressStatusSchema>;

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
 * processing, nothing is marked started/completed by reading this.
 * `progressStatus` is the user's own real, persisted lesson state, so a
 * Lesson Preview opened by deep link or after a Telegram restart knows
 * whether to offer "start" or "resume" without relying on router state.
 * `moduleTitle`/`estimatedMinutes` come from rows this read already
 * touches — they exist so the screen can show unit context and duration
 * without a second request. */
export const LessonContentDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: LessonTypeSchema,
  moduleId: z.string(),
  moduleTitle: z.string(),
  estimatedMinutes: z.number().int().nullable(),
  progressStatus: LessonProgressStatusSchema,
  /** Situation framing — what this episode is about before any of its
   * language is shown. Null for content authored before V1. */
  situationTitle: z.string().nullable(),
  scene: z.string().nullable(),
  capability: z.string().nullable(),
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

/**
 * What the conversation partner says right after the learner answers —
 * not an answer-key field (it never reveals correctness), so it's safe
 * to send before the activity is answered. Present only on the scored
 * kinds a learner actually "speaks" in — never info_card/grammar_card,
 * and never on grammar_pattern-targeted checks (a "Пауза на правило" is
 * deliberately not a conversational turn). See Session.tsx.
 */
const npcReplySchema = z
  .object({ correct: z.string(), incorrect: z.string().nullable() })
  .optional();

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
    /** Lets the client show `content.text` only where it isn't already
     * redundant with the prompt — a grammar-pattern check's prompt never
     * quotes its own example, a learning-item check's always does. */
    targetType: z.enum(["learning_item", "grammar_pattern"]),
    npcReply: npcReplySchema,
    /** Semantic turn completion, not an answer key or an exercise group. */
    dialogueTurnId: z.string().optional(),
  }),
  z.object({
    ...activityBase,
    kind: z.literal("fill_gap_choice"),
    prompt: z.string(),
    content: z.object({ sentence: z.string() }),
    options: z.array(ActivityOptionDTOSchema),
    npcReply: npcReplySchema,
    /** Semantic turn completion, not an answer key or an exercise group. */
    dialogueTurnId: z.string().optional(),
  }),
  z.object({
    ...activityBase,
    kind: z.literal("typed_recall"),
    prompt: z.string(),
    content: z.object({ text: z.string() }),
    npcReply: npcReplySchema,
    /** Semantic turn completion, not an answer key or an exercise group. */
    dialogueTurnId: z.string().optional(),
  }),
  z.object({
    ...activityBase,
    kind: z.literal("sentence_build"),
    prompt: z.string(),
    content: z.object({ tokens: z.array(z.string()) }),
    npcReply: npcReplySchema,
    /** Semantic turn completion, not an answer key or an exercise group. */
    dialogueTurnId: z.string().optional(),
  }),
]);
export type ActivityDTO = z.infer<typeof ActivityDTOSchema>;

export const LessonSessionStatusSchema = z.enum([
  "in_progress",
  "completed",
  "abandoned",
]);
export type LessonSessionStatus = z.infer<typeof LessonSessionStatusSchema>;

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

// ---------------------------------------------------------------------------
// Speak in English V1.
//
// Frontstage vocabulary (what the learner sees) maps onto the existing
// backstage entities: Chapter = module, Episode = lesson, Session = a slice
// of that episode's activity plan, Mission = the episode's proof session.
// ---------------------------------------------------------------------------

export const SessionKindSchema = z.enum(["lesson", "mission"]);
export type SessionKind = z.infer<typeof SessionKindSchema>;

export const CapabilityStateSchema = z.enum([
  "learning",
  "can_do",
  "consolidated",
]);
export type CapabilityState = z.infer<typeof CapabilityStateSchema>;

/** One real-life situation. `capability` is the narrow "Я могу …" claim it
 * unlocks — never a broad promise. */
export const EpisodeDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  situationTitle: z.string().nullable(),
  scene: z.string().nullable(),
  capability: z.string().nullable(),
  teaser: z.string().nullable(),
  type: LessonTypeSchema,
  order: z.number().int(),
  estimatedMinutes: z.number().int().nullable(),
  state: CapabilityStateSchema.nullable(),
  sessionsDone: z.number().int().nonnegative(),
  sessionsTotal: z.number().int().nonnegative(),
  /** True once every session is done and only the Mission is left. */
  missionReady: z.boolean(),
});
export type EpisodeDTO = z.infer<typeof EpisodeDTOSchema>;

export const ChapterDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  order: z.number().int(),
  episodes: z.array(EpisodeDTOSchema),
});
export type ChapterDTO = z.infer<typeof ChapterDTOSchema>;

export const CourseResponseSchema = z.object({
  level: CefrLevelSchema.nullable(),
  chapters: z.array(ChapterDTOSchema),
  episodesDone: z.number().int().nonnegative(),
  episodesTotal: z.number().int().nonnegative(),
  currentEpisodeId: z.string().nullable(),
});
export type CourseResponse = z.infer<typeof CourseResponseSchema>;

/** What Today should put in front of the learner right now.
 * "unavailable" is distinct from "none": "none" means the learner has
 * genuinely finished everything their level currently offers, while
 * "unavailable" means their verified level has no published content at
 * all — the honest case for anyone placed above the public V1's A1-only
 * scope, never to be confused with "course complete". */
export const TodayActionSchema = z.enum([
  "session",
  "mission",
  "review",
  "none",
  "unavailable",
]);
export type TodayAction = z.infer<typeof TodayActionSchema>;

export const TodayResponseSchema = z.object({
  action: TodayActionSchema,
  episode: EpisodeDTOSchema.nullable(),
  chapterTitle: z.string().nullable(),
  level: CefrLevelSchema.nullable(),
  /** Minutes the next session is expected to take, when derivable. */
  estimatedMinutes: z.number().int().nullable(),
  reviewDue: z.number().int().nonnegative(),
  capabilities: z.object({
    canDo: z.number().int().nonnegative(),
    consolidated: z.number().int().nonnegative(),
  }),
  chapterProgress: z
    .object({
      done: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    })
    .nullable(),
  companionId: z.string().nullable(),
  /** Set after an absence so the client can open gently. */
  daysAway: z.number().int().nonnegative().nullable(),
  weeklyGoal: z
    .object({
      target: z.number().int().positive(),
      mine: z.number().int().nonnegative(),
      friendName: z.string().nullable(),
      friendDone: z.number().int().nonnegative().nullable(),
      completed: z.boolean(),
    })
    .nullable(),
});
export type TodayResponse = z.infer<typeof TodayResponseSchema>;

/** A running session — daily session or Mission, same shape. */
export const EpisodeSessionDTOSchema = z.object({
  sessionId: z.string(),
  kind: SessionKindSchema,
  status: LessonSessionStatusSchema,
  sessionIndex: z.number().int().positive(),
  sessionTotal: z.number().int().positive(),
  episode: EpisodeDTOSchema,
  currentActivity: ActivityDTOSchema.nullable(),
});
export type EpisodeSessionDTO = z.infer<typeof EpisodeSessionDTOSchema>;

export const UnlockedRewardDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  reason: z.string(),
  tier: z.enum(["small", "medium", "rare", "chapter", "milestone", "shared"]),
  slot: z.string(),
  glyph: z.string(),
});
export type UnlockedRewardDTO = z.infer<typeof UnlockedRewardDTOSchema>;

/** The result screen's data. Emotionally the centre is `capability`, not
 * the score — the numbers are real but secondary. */
export const SessionResultDTOSchema = z.object({
  sessionId: z.string(),
  kind: SessionKindSchema,
  episodeId: z.string(),
  episodeTitle: z.string(),
  correctCount: z.number().int().nonnegative(),
  wrongCount: z.number().int().nonnegative(),
  scoredAttempts: z.number().int().nonnegative(),
  accuracy: z.number().int().min(0).max(100),
  completedAt: z.string(),
  sessionsDone: z.number().int().nonnegative(),
  sessionsTotal: z.number().int().positive(),
  /** Only meaningful for a Mission. */
  missionPassed: z.boolean().nullable(),
  capability: z.string().nullable(),
  capabilityState: CapabilityStateSchema.nullable(),
  /** True when the episode's content is done and the Mission is next. */
  missionReady: z.boolean(),
  teaser: z.string().nullable(),
  nextEpisodeId: z.string().nullable(),
  rewards: z.array(UnlockedRewardDTOSchema),
  reviewDue: z.number().int().nonnegative(),
});
export type SessionResultDTO = z.infer<typeof SessionResultDTOSchema>;

// --- review ---------------------------------------------------------------

export const ReviewStateResponseSchema = z.object({
  due: z.number().int().nonnegative(),
  /** At least one memory item exists and can support optional extra practice. */
  availableForExtra: z.boolean(),
  /** Items whose last answer was wrong — worth a second look. */
  weak: z.number().int().nonnegative(),
  /** Capabilities waiting for a spaced retrieval to become CONSOLIDATED. */
  awaitingConsolidation: z.number().int().nonnegative(),
  estimatedMinutes: z.number().int().nonnegative(),
  activeSessionId: z.string().nullable(),
});
export type ReviewStateResponse = z.infer<typeof ReviewStateResponseSchema>;

export const ReviewSessionDTOSchema = z.object({
  sessionId: z.string(),
  status: LessonSessionStatusSchema,
  total: z.number().int().nonnegative(),
  currentActivity: ActivityDTOSchema.nullable(),
});
export type ReviewSessionDTO = z.infer<typeof ReviewSessionDTOSchema>;

export const ReviewResultDTOSchema = z.object({
  sessionId: z.string(),
  reviewed: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  accuracy: z.number().int().min(0).max(100),
  consolidated: z.array(z.string()),
  rewards: z.array(UnlockedRewardDTOSchema),
});
export type ReviewResultDTO = z.infer<typeof ReviewResultDTOSchema>;

export const AnswerReviewResponseSchema = z.object({
  feedback: AnswerFeedbackSchema,
  session: z.discriminatedUnion("status", [
    z.object({
      status: z.literal("in_progress"),
      nextActivity: ActivityDTOSchema,
    }),
    z.object({ status: z.literal("completed"), result: ReviewResultDTOSchema }),
  ]),
});
export type AnswerReviewResponse = z.infer<typeof AnswerReviewResponseSchema>;

// --- my english -----------------------------------------------------------

export const CapabilityItemDTOSchema = z.object({
  episodeId: z.string(),
  capability: z.string(),
  situationTitle: z.string().nullable(),
  state: CapabilityStateSchema,
  canDoAt: z.string().nullable(),
  consolidatedAt: z.string().nullable(),
});
export type CapabilityItemDTO = z.infer<typeof CapabilityItemDTOSchema>;

export const KnownPhraseDTOSchema = z.object({
  id: z.string(),
  text: z.string(),
  translation: z.string(),
  box: z.number().int(),
  consolidated: z.boolean(),
});
export type KnownPhraseDTO = z.infer<typeof KnownPhraseDTOSchema>;

export const MyEnglishResponseSchema = z.object({
  level: CefrLevelSchema.nullable(),
  capabilities: z.array(CapabilityItemDTOSchema),
  phrases: z.array(KnownPhraseDTOSchema),
  stats: z.object({
    phrasesMet: z.number().int().nonnegative(),
    phrasesConsolidated: z.number().int().nonnegative(),
    episodesDone: z.number().int().nonnegative(),
    missionsPassed: z.number().int().nonnegative(),
    activeDaysThisWeek: z.number().int().nonnegative(),
    sessionsThisWeek: z.number().int().nonnegative(),
  }),
});
export type MyEnglishResponse = z.infer<typeof MyEnglishResponseSchema>;

// --- companion & space ----------------------------------------------------

export const CompanionDTOSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  tone: z.enum(["green", "blush", "sand"]),
});
export type CompanionDTO = z.infer<typeof CompanionDTOSchema>;

export const RoomItemDTOSchema = z.object({
  id: z.string(),
  title: z.string(),
  reason: z.string(),
  slot: z.string(),
  glyph: z.string(),
  tier: z.enum(["small", "medium", "rare", "chapter", "milestone", "shared"]),
  unlocked: z.boolean(),
  unlockedAt: z.string().nullable(),
  /** The language this object remembers — the whole point of the space. */
  memory: z
    .object({
      capability: z.string().nullable(),
      episodeTitle: z.string().nullable(),
      phrases: z.array(z.object({ text: z.string(), translation: z.string() })),
    })
    .nullable(),
});
export type RoomItemDTO = z.infer<typeof RoomItemDTOSchema>;

export const MySpaceResponseSchema = z.object({
  companion: CompanionDTOSchema.nullable(),
  companionChoices: z.array(CompanionDTOSchema),
  items: z.array(RoomItemDTOSchema),
  unlockedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});
export type MySpaceResponse = z.infer<typeof MySpaceResponseSchema>;

export const SelectCompanionRequestSchema = z.object({
  companionId: z.string().min(1),
});
export type SelectCompanionRequest = z.infer<
  typeof SelectCompanionRequestSchema
>;

// --- friends --------------------------------------------------------------

export const FriendStateResponseSchema = z.object({
  friend: z.object({ id: z.string(), firstName: z.string() }).nullable(),
  inviteCode: z.string().nullable(),
  goal: z.object({
    target: z.number().int().positive(),
    mine: z.number().int().nonnegative(),
    friendDone: z.number().int().nonnegative().nullable(),
    total: z.number().int().nonnegative(),
    completed: z.boolean(),
    weekStart: z.string(),
  }),
  sharedRewardUnlocked: z.boolean(),
});
export type FriendStateResponse = z.infer<typeof FriendStateResponseSchema>;

export const AcceptInviteRequestSchema = z.object({
  code: z.string().min(1),
});
export type AcceptInviteRequest = z.infer<typeof AcceptInviteRequestSchema>;

/** Same shape as the lesson answer response, but carrying the richer V1
 * session result. */
export const AnswerSessionResponseSchema = z.object({
  feedback: AnswerFeedbackSchema,
  session: z.discriminatedUnion("status", [
    z.object({
      status: z.literal("in_progress"),
      nextActivity: ActivityDTOSchema,
    }),
    z.object({
      status: z.literal("completed"),
      result: SessionResultDTOSchema,
    }),
  ]),
});
export type AnswerSessionResponse = z.infer<typeof AnswerSessionResponseSchema>;

export const InviteCodeResponseSchema = z.object({ code: z.string() });
export type InviteCodeResponse = z.infer<typeof InviteCodeResponseSchema>;

// ---------------------------------------------------------------------------
// Preview-only testing tools. These exist so the first-run experience can be
// re-tested without a second Telegram account, and are refused outside the
// preview environment — see apps/api/src/routes/me.ts.
// ---------------------------------------------------------------------------

/** A literal the caller must send, so the reset can never be triggered by a
 * stray or replayed request. */
export const RESET_PREVIEW_CONFIRMATION = "СБРОСИТЬ";

export const ResetPreviewRequestSchema = z.object({
  confirm: z.literal(RESET_PREVIEW_CONFIRMATION),
});
export type ResetPreviewRequest = z.infer<typeof ResetPreviewRequestSchema>;

/** Honest counts of what was actually cleared — never a generic "done". */
export const ResetPreviewResponseSchema = z.object({
  ok: z.literal(true),
  cleared: z.object({
    learningSessions: z.number().int().nonnegative(),
    exerciseAttempts: z.number().int().nonnegative(),
    reviewSessions: z.number().int().nonnegative(),
    itemMemory: z.number().int().nonnegative(),
    capabilities: z.number().int().nonnegative(),
    lessonProgress: z.number().int().nonnegative(),
    placementAttempts: z.number().int().nonnegative(),
    rewards: z.number().int().nonnegative(),
    companion: z.number().int().nonnegative(),
    friendships: z.number().int().nonnegative(),
    friendInvites: z.number().int().nonnegative(),
  }),
});
export type ResetPreviewResponse = z.infer<typeof ResetPreviewResponseSchema>;

// ---------------------------------------------------------------------------
// Account settings & deletion.
//
// Deliberately narrow: only the two settings a learner can actually act on
// today (daily goal, daily reminder). `user_settings` has more columns than
// this — they stay unexposed until a real feature needs them, rather than
// growing a settings screen nobody asked for yet.
// ---------------------------------------------------------------------------

export const MySettingsResponseSchema = z.object({
  dailyMinutes: DailyMinutesSchema,
  dailyReminderEnabled: z.boolean(),
});
export type MySettingsResponse = z.infer<typeof MySettingsResponseSchema>;

export const UpdateMySettingsRequestSchema = z
  .object({
    dailyMinutes: DailyMinutesSchema.optional(),
    dailyReminderEnabled: z.boolean().optional(),
  })
  .refine(
    (v) => v.dailyMinutes !== undefined || v.dailyReminderEnabled !== undefined,
    { message: "at least one setting must be provided" },
  );
export type UpdateMySettingsRequest = z.infer<
  typeof UpdateMySettingsRequestSchema
>;

/** A literal the caller must send, so real account deletion can never be
 * triggered by a stray or replayed request — same pattern as the preview
 * reset, but this one runs in production too. */
export const DELETE_ACCOUNT_CONFIRMATION = "УДАЛИТЬ";

export const DeleteAccountRequestSchema = z.object({
  confirm: z.literal(DELETE_ACCOUNT_CONFIRMATION),
});
export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>;

export const DeleteAccountResponseSchema = z.object({ ok: z.literal(true) });
export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponseSchema>;

// ---------------------------------------------------------------------------
// Pilot analytics.
//
// A fixed, small catalog rather than free-text event names: this is the
// one thing that keeps the log from turning into a second, undocumented
// schema that drifts every time a screen changes. Adding an event means
// adding it here, in one place both apps import.
// ---------------------------------------------------------------------------

export const EventNameSchema = z.enum([
  // Before an account exists — the hook and the 48-second demo.
  "welcome_viewed",
  "demo_started",
  "demo_completed",
  "demo_skipped",
  // Right after meeting Kvo.
  "companion_chosen",
  "companion_deferred",
  // Server-emitted, in the same transaction as the mutation they describe
  // — never lost to a client that closed the tab, never duplicated by a
  // retry.
  "placement_completed",
  "session_completed",
  "mission_passed",
  "mission_failed",
  "review_completed",
  "friend_invited",
  "friend_accepted",
  "shared_goal_completed",
  "preview_account_reset",
  // The daily "come back" nudge, sent by the bot rather than the client
  // — recorded here so the same idempotent-by-day check that decides
  // whether to send it can also read back whether one already went out.
  "reminder_sent",
]);
export type EventName = z.infer<typeof EventNameSchema>;

/** Flat and small on purpose: analytics properties are context for a
 * funnel step, never a place to smuggle structured data through. */
const EventPropertyValueSchema = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const EventPropertiesSchema = z
  .record(z.string().max(60), EventPropertyValueSchema)
  .refine((props) => Object.keys(props).length <= 12, {
    message: "at most 12 properties per event",
  });
export type EventProperties = z.infer<typeof EventPropertiesSchema>;

export const TrackEventRequestSchema = z.object({
  event: EventNameSchema,
  /** Client-generated, persisted in localStorage — not derived from any
   * Telegram or device identifier. Lets a pilot funnel be read end to end
   * (demo → signup → first Mission) without claiming exact identity. */
  anonymousId: z.string().min(1).max(64),
  properties: EventPropertiesSchema.optional(),
});
export type TrackEventRequest = z.infer<typeof TrackEventRequestSchema>;

export const TrackEventResponseSchema = z.object({ ok: z.literal(true) });
export type TrackEventResponse = z.infer<typeof TrackEventResponseSchema>;
