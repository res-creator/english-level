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

export const SelfReportedCefrLevelSchema = z
  .enum(["A1", "A2", "B1", "B2"])
  .nullable();
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
