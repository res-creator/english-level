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
  // Navigation intent only — Phase 2 does not implement onboarding or Today.
  next: z.enum(["onboarding", "today"]),
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
