import type { OnboardingStateResponse } from "@english-level/contracts";
import { STAGE_ROUTES } from "./stageRoutes.ts";

/**
 * `/onboarding` always trusts the backend's own stage. It is only ever
 * reached after Welcome has already been shown — `RootRedirect` is the
 * one place that decides between Welcome and onboarding, using the
 * per-device "seen it" flag — so a fresh "goals" stage with nothing
 * answered yet is simply the normal start of the onboarding questions,
 * not a sign the learner skipped Welcome.
 *
 * An earlier version special-cased exactly that state back to `/welcome`,
 * which is indistinguishable from "just finished Companion, about to
 * answer Goals for the first time" — every fresh learner has zero goals
 * until they submit `GoalsStep`. That sent every learner who completed
 * Demo → Companion straight back to Welcome, looping them through the
 * demo forever instead of ever reaching Goals.
 */
export function resolveOnboardingIndexRoute(
  state: OnboardingStateResponse,
): string {
  return STAGE_ROUTES[state.stage];
}
