import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { SelfReportedCefrLevel } from "@english-level/contracts";
import { useAuth } from "../../auth/useAuth.ts";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { updateLevel } from "../../onboarding/onboardingClient.ts";
import { levelLabel } from "../../onboarding/labels.ts";
import { STAGE_ROUTES, stageIndex } from "../../onboarding/stageRoutes.ts";
import { OnboardingProgress } from "../../onboarding/OnboardingProgress.tsx";

const LEVEL_OPTIONS: Array<Exclude<SelfReportedCefrLevel, null> | "unknown"> = [
  "unknown",
  "A1",
  "A2",
  "B1",
  "B2",
];

export function LevelStep() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status, state, message, reload } = useOnboardingState();
  const [selected, setSelected] = useState<
    Exclude<SelfReportedCefrLevel, null> | "unknown" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state && stageIndex(state.stage) > stageIndex("level_choice")) {
      setSelected(state.selfReportedCefrLevel ?? "unknown");
    }
  }, [state]);

  if (status === "loading") return <p>Loading…</p>;
  if (status === "error") {
    return (
      <section className="onboarding-screen">
        <p className="onboarding-error">{message}</p>
        <button type="button" className="button-secondary" onClick={reload}>
          Retry
        </button>
      </section>
    );
  }

  if (state && stageIndex(state.stage) < stageIndex("level_choice")) {
    return <Navigate to={STAGE_ROUTES[state.stage]} replace />;
  }

  async function handleContinue() {
    if (selected === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const level = selected === "unknown" ? null : selected;
      const next = await updateLevel(level);
      navigate(STAGE_ROUTES[next.stage]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="onboarding-screen">
      <OnboardingProgress step={3} total={3} />
      <h1>Do you know your English level?</h1>
      <p>This is just your guess — we'll confirm it later.</p>
      <div className="option-list">
        {LEVEL_OPTIONS.map((level) => (
          <button
            key={level}
            type="button"
            className={
              selected === level
                ? "option-button option-button--selected"
                : "option-button"
            }
            onClick={() => setSelected(level)}
          >
            {levelLabel(level, user?.interfaceLanguage)}
          </button>
        ))}
      </div>
      {error && <p className="onboarding-error">{error}</p>}
      <div className="onboarding-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={() => navigate("/onboarding/time")}
        >
          Back
        </button>
        <button
          type="button"
          className="button-primary"
          disabled={selected === null || submitting}
          onClick={handleContinue}
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </div>
    </section>
  );
}
