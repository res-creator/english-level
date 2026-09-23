import type { OnboardingStage } from "@english-level/contracts";

/** Where each backend onboarding stage should route to. The backend is the
 * source of truth — every onboarding page redirects here if its own step
 * doesn't match what the backend says is current. */
export const STAGE_ROUTES: Record<OnboardingStage, string> = {
  goals: "/onboarding/goals",
  daily_time: "/onboarding/time",
  level_choice: "/onboarding/level",
  placement_required: "/onboarding/ready",
  // Not reachable in Phase 3 (nothing sets "completed" yet), but routing
  // it sensibly costs nothing and avoids an unhandled case later.
  completed: "/today",
};

const STAGE_ORDER: OnboardingStage[] = [
  "goals",
  "level_choice",
  "daily_time",
  "placement_required",
  "completed",
];

export function stageIndex(stage: OnboardingStage): number {
  return STAGE_ORDER.indexOf(stage);
}
