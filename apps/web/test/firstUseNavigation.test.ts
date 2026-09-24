import test from "node:test";
import assert from "node:assert/strict";
import {
  clearWelcomeSeen,
  hasSeenWelcome,
  markWelcomeSeen,
  resolveAuthenticatedRoute,
} from "../src/rootRedirectLogic.ts";
import { resolveOnboardingIndexRoute } from "../src/onboarding/resolveOnboardingIndexRoute.ts";
import type { OnboardingStateResponse } from "@english-level/contracts";

/**
 * Regression coverage for a real first-use navigation bug: a fresh
 * learner who completed Welcome → Demo → Demo Result → Companion could
 * never reach Goals. `CompanionIntro` sends them to `/onboarding`, and
 * `OnboardingIndex` used to special-case "stage is goals, zero goals
 * picked" back to `/welcome` — but that state is true for every learner
 * who has never yet submitted `GoalsStep`, which is all of them at this
 * point. It looped Welcome → Demo → Companion → Welcome forever.
 *
 * Neither `RootRedirect` nor `OnboardingIndex` render JSX in the parts
 * under test — the routing decisions live in plain `.ts` modules
 * (`rootRedirectLogic.ts`, `resolveOnboardingIndexRoute.ts`) precisely so
 * they can be exercised here without a DOM.
 */

function baseState(
  overrides: Partial<OnboardingStateResponse>,
): OnboardingStateResponse {
  return {
    stage: "goals",
    goals: [],
    dailyMinutes: null,
    selfReportedCefrLevel: null,
    ...overrides,
  } as OnboardingStateResponse;
}

function withLocalStorage<T>(fn: () => T): T {
  const store = new Map<string, string>();
  const original = (globalThis as { localStorage?: unknown }).localStorage;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  try {
    return fn();
  } finally {
    if (original === undefined) {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
      (globalThis as { localStorage?: unknown }).localStorage = original;
    }
  }
}

// --- the loop bug itself -------------------------------------------------

test("a fresh 'goals' stage with nothing answered yet routes to Goals, not back to Welcome", () => {
  const state = baseState({ stage: "goals", goals: [] });
  assert.equal(resolveOnboardingIndexRoute(state), "/onboarding/goals");
});

test("every onboarding stage still resolves to its own step", () => {
  assert.equal(
    resolveOnboardingIndexRoute(baseState({ stage: "daily_time" })),
    "/onboarding/time",
  );
  assert.equal(
    resolveOnboardingIndexRoute(baseState({ stage: "level_choice" })),
    "/onboarding/level",
  );
  assert.equal(
    resolveOnboardingIndexRoute(baseState({ stage: "placement_required" })),
    "/onboarding/ready",
  );
  assert.equal(
    resolveOnboardingIndexRoute(baseState({ stage: "completed" })),
    "/today",
  );
});

// --- the entry point: Welcome vs. straight back into onboarding ----------

test("a brand-new device sees Welcome before onboarding", () => {
  assert.equal(resolveAuthenticatedRoute("onboarding", false), "/welcome");
});

test("a device that already saw Welcome goes straight to onboarding", () => {
  assert.equal(resolveAuthenticatedRoute("onboarding", true), "/onboarding");
});

test("placement is routed to directly, regardless of the welcome flag", () => {
  assert.equal(resolveAuthenticatedRoute("placement", false), "/placement");
  assert.equal(resolveAuthenticatedRoute("placement", true), "/placement");
});

test("an already-onboarded learner skips first-use entirely and lands on Today", () => {
  assert.equal(resolveAuthenticatedRoute("today", false), "/today");
  assert.equal(resolveAuthenticatedRoute("today", true), "/today");
});

// --- the welcome-seen flag itself, and the preview reset that clears it --

test("the welcome-seen flag persists across a reload, as reload/reopen requires", () => {
  withLocalStorage(() => {
    assert.equal(hasSeenWelcome(), false);
    markWelcomeSeen();
    assert.equal(hasSeenWelcome(), true);
  });
});

test("a preview reset clears the welcome-seen flag, so the same device meets Welcome again", () => {
  withLocalStorage(() => {
    markWelcomeSeen();
    assert.equal(hasSeenWelcome(), true);
    clearWelcomeSeen();
    assert.equal(hasSeenWelcome(), false);
  });
});

// --- the full first-use path, expressed as one sequence of decisions -----

test("the complete first-use path never loops: Welcome once, then straight through to Today", () => {
  withLocalStorage(() => {
    // A fresh Telegram user: backend says "onboarding", device has never
    // seen Welcome.
    assert.equal(
      resolveAuthenticatedRoute("onboarding", hasSeenWelcome()),
      "/welcome",
    );

    // Welcome's own CTA marks itself seen before leaving for the demo.
    markWelcomeSeen();

    // Demo -> Demo Result -> Companion all navigate directly by route
    // (no RootRedirect involved), ending at CompanionIntro's
    // navigate("/onboarding"). That's where the bug lived:
    const freshGoalsState = baseState({ stage: "goals", goals: [] });
    assert.equal(
      resolveOnboardingIndexRoute(freshGoalsState),
      "/onboarding/goals",
    );

    // Submitting each step moves the backend stage forward; a returning
    // RootRedirect visit for an in-progress learner goes straight back
    // into onboarding, never back to Welcome.
    assert.equal(
      resolveAuthenticatedRoute("onboarding", hasSeenWelcome()),
      "/onboarding",
    );

    // Once onboarding completes, the backend intent moves on and Welcome
    // is never shown again for this device.
    assert.equal(
      resolveAuthenticatedRoute("placement", hasSeenWelcome()),
      "/placement",
    );
    assert.equal(
      resolveAuthenticatedRoute("today", hasSeenWelcome()),
      "/today",
    );
  });
});
