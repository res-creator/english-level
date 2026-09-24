import type { TelegramAuthResponse } from "@english-level/contracts";

/**
 * Pure logic behind `RootRedirect` and the preview reset flow, kept in
 * its own module (no JSX) so it can be imported directly by
 * `node --test` without a build step.
 */

const WELCOME_SEEN_KEY = "sie.welcomeSeen";

export function markWelcomeSeen(): void {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    // Private mode or blocked storage: the hook simply shows again.
  }
}

/** Preview reset only: a reset account should meet Welcome and the demo
 * again too, not just find its backend state wiped — otherwise this
 * device would skip straight past the very screens the reset exists to
 * let someone re-test. See `PreviewResetPanel`. */
export function clearWelcomeSeen(): void {
  try {
    localStorage.removeItem(WELCOME_SEEN_KEY);
  } catch {
    // Private mode or blocked storage: nothing was persisted to clear.
  }
}

export function hasSeenWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** Pure route decision for an authenticated learner, kept separate from
 * the component so the first-use path (onboarding vs. welcome vs.
 * placement vs. today) can be regression-tested without rendering. */
export function resolveAuthenticatedRoute(
  next: TelegramAuthResponse["next"],
  welcomeSeen: boolean,
): string {
  // A brand-new learner meets the hook and the 48-second demo first.
  // The flag is a per-device convenience only: losing it just shows the
  // hook again, which costs nothing.
  if (next === "onboarding") return welcomeSeen ? "/onboarding" : "/welcome";
  if (next === "placement") return "/placement";
  return "/today";
}
