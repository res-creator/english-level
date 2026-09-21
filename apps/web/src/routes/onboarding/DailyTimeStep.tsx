import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  DAILY_MINUTES_OPTIONS,
  type DailyMinutes,
} from "@english-level/contracts";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { updateDailyTime } from "../../onboarding/onboardingClient.ts";
import { STAGE_ROUTES, stageIndex } from "../../onboarding/stageRoutes.ts";
import { OnboardingProgress } from "../../onboarding/OnboardingProgress.tsx";

export function DailyTimeStep() {
  const navigate = useNavigate();
  const { status, state, message, reload } = useOnboardingState();
  const [selected, setSelected] = useState<DailyMinutes | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state?.dailyMinutes != null) setSelected(state.dailyMinutes);
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

  if (state && stageIndex(state.stage) < stageIndex("daily_time")) {
    return <Navigate to={STAGE_ROUTES[state.stage]} replace />;
  }

  async function handleContinue() {
    if (selected === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const next = await updateDailyTime(selected);
      navigate(STAGE_ROUTES[next.stage]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="onboarding-screen">
      <OnboardingProgress step={2} total={3} />
      <h1>How much time can you realistically study each day?</h1>
      <div className="option-list">
        {DAILY_MINUTES_OPTIONS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            className={
              selected === minutes
                ? "option-button option-button--selected"
                : "option-button"
            }
            onClick={() => setSelected(minutes)}
          >
            {minutes} minutes
            {minutes === 10 && (
              <span className="option-button__hint">Recommended</span>
            )}
          </button>
        ))}
      </div>
      {error && <p className="onboarding-error">{error}</p>}
      <div className="onboarding-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={() => navigate("/onboarding/goals")}
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
