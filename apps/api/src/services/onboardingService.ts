import type { ZodError } from "zod";
import {
  UpdateGoalsRequestSchema,
  UpdateDailyTimeRequestSchema,
  UpdateLevelRequestSchema,
  type OnboardingStage,
  type OnboardingStateResponse,
} from "@english-level/contracts";
import type { Db } from "../db/types.ts";
import {
  findUserById,
  setOnboardingStage,
  setSelfReportedCefrLevel,
} from "../repositories/usersRepository.ts";
import {
  getUserSettings,
  updateUserSettings,
} from "../repositories/userSettingsRepository.ts";

/**
 * Backend-owned onboarding stage order. A step's data may only be written
 * once the user has reached (or passed) that step — never skipped ahead —
 * and writing a step that's already been passed is treated as an edit: the
 * value updates, but the stage never moves backward or forward from it.
 */
const STAGE_ORDER: OnboardingStage[] = [
  "goals",
  "daily_time",
  "level_choice",
  "placement_required",
  "completed",
];

function stageIndex(stage: OnboardingStage): number {
  return STAGE_ORDER.indexOf(stage);
}

function zodMessage(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}

/** True once the user's current stage has moved past `fieldStage` — i.e.
 * that step has been answered (possibly with a "null-ish" answer). */
function isPast(currentStage: OnboardingStage, fieldStage: OnboardingStage) {
  return stageIndex(currentStage) > stageIndex(fieldStage);
}

export type OnboardingFailure =
  | { code: "validation_error"; message: string }
  | { code: "step_locked"; message: string };

export type OnboardingResult =
  | { ok: true; state: OnboardingStateResponse }
  | { ok: false; error: OnboardingFailure };

/**
 * Builds the current onboarding state for a user. Fields for steps not yet
 * reached read as `null`/`[]` even though the underlying `user_settings`
 * row already has schema defaults (e.g. daily_minutes=10) — those defaults
 * are not the same thing as "the user chose this".
 */
export async function getOnboardingState(
  db: Db,
  userId: string,
): Promise<OnboardingStateResponse> {
  const user = await findUserById(db, userId);
  if (!user) {
    throw new Error(`User ${userId} not found while loading onboarding state`);
  }
  const settings = await getUserSettings(db, userId);
  const stage = user.onboarding_stage;

  return {
    stage,
    goals: isPast(stage, "goals")
      ? (JSON.parse(
          settings?.learning_goals_json ?? "[]",
        ) as OnboardingStateResponse["goals"])
      : [],
    dailyMinutes: isPast(stage, "daily_time")
      ? ((settings?.daily_minutes ??
          null) as OnboardingStateResponse["dailyMinutes"])
      : null,
    selfReportedCefrLevel: isPast(stage, "level_choice")
      ? (user.self_reported_cefr_level as OnboardingStateResponse["selfReportedCefrLevel"])
      : null,
  };
}

/** Advances stage to the step after `completedStep`, but only if the user
 * was exactly at that step — otherwise this write was an edit of an
 * already-passed step, and the stage is left untouched. */
async function maybeAdvanceStage(
  db: Db,
  userId: string,
  currentStage: OnboardingStage,
  completedStep: OnboardingStage,
): Promise<void> {
  if (currentStage !== completedStep) return;
  const next = STAGE_ORDER[stageIndex(completedStep) + 1];
  if (!next) return;
  await setOnboardingStage(db, userId, next);
}

async function requireStepAccess(
  db: Db,
  userId: string,
  step: OnboardingStage,
): Promise<
  | { ok: true; currentStage: OnboardingStage }
  | { ok: false; error: OnboardingFailure }
> {
  const user = await findUserById(db, userId);
  if (!user) {
    throw new Error(`User ${userId} not found while updating onboarding`);
  }
  const currentStage = user.onboarding_stage;
  if (stageIndex(currentStage) < stageIndex(step)) {
    return {
      ok: false,
      error: {
        code: "step_locked",
        message: `"${step}" cannot be completed before earlier onboarding steps`,
      },
    };
  }
  return { ok: true, currentStage };
}

export async function updateOnboardingGoals(
  db: Db,
  userId: string,
  input: unknown,
): Promise<OnboardingResult> {
  const parsed = UpdateGoalsRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: zodMessage(parsed.error) },
    };
  }

  const access = await requireStepAccess(db, userId, "goals");
  if (!access.ok) return access;

  await updateUserSettings(db, userId, { learningGoals: parsed.data.goals });
  await maybeAdvanceStage(db, userId, access.currentStage, "goals");

  return { ok: true, state: await getOnboardingState(db, userId) };
}

export async function updateOnboardingDailyTime(
  db: Db,
  userId: string,
  input: unknown,
): Promise<OnboardingResult> {
  const parsed = UpdateDailyTimeRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: zodMessage(parsed.error) },
    };
  }

  const access = await requireStepAccess(db, userId, "daily_time");
  if (!access.ok) return access;

  await updateUserSettings(db, userId, { dailyMinutes: parsed.data.minutes });
  await maybeAdvanceStage(db, userId, access.currentStage, "daily_time");

  return { ok: true, state: await getOnboardingState(db, userId) };
}

export async function updateOnboardingLevel(
  db: Db,
  userId: string,
  input: unknown,
): Promise<OnboardingResult> {
  const parsed = UpdateLevelRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: zodMessage(parsed.error) },
    };
  }

  const access = await requireStepAccess(db, userId, "level_choice");
  if (!access.ok) return access;

  await setSelfReportedCefrLevel(db, userId, parsed.data.level);
  await maybeAdvanceStage(db, userId, access.currentStage, "level_choice");

  return { ok: true, state: await getOnboardingState(db, userId) };
}
