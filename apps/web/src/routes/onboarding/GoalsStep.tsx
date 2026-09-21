import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LEARNING_GOALS, type LearningGoal } from "@english-level/contracts";
import { useAuth } from "../../auth/useAuth.ts";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { updateGoals } from "../../onboarding/onboardingClient.ts";
import { goalLabel } from "../../onboarding/labels.ts";
import { STAGE_ROUTES } from "../../onboarding/stageRoutes.ts";
import { OnboardingProgress } from "../../onboarding/OnboardingProgress.tsx";

const MAX_GOALS = 3;

export function GoalsStep() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status, state, message, reload } = useOnboardingState();
  const [selected, setSelected] = useState<LearningGoal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state) setSelected(state.goals);
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

  function toggle(goal: LearningGoal) {
    setSelected((prev) => {
      if (prev.includes(goal)) return prev.filter((g) => g !== goal);
      if (prev.length >= MAX_GOALS) return prev;
      return [...prev, goal];
    });
  }

  async function handleContinue() {
    setSubmitting(true);
    setError(null);
    try {
      const next = await updateGoals(selected);
      navigate(STAGE_ROUTES[next.stage]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="onboarding-screen">
      <OnboardingProgress step={1} total={3} />
      <h1>What do you want English for?</h1>
      <p>Choose 1 to 3.</p>
      <div className="option-list">
        {LEARNING_GOALS.map((goal) => (
          <button
            key={goal}
            type="button"
            className={
              selected.includes(goal)
                ? "option-button option-button--selected"
                : "option-button"
            }
            onClick={() => toggle(goal)}
          >
            {goalLabel(goal, user?.interfaceLanguage)}
          </button>
        ))}
      </div>
      {error && <p className="onboarding-error">{error}</p>}
      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          disabled={selected.length === 0 || submitting}
          onClick={handleContinue}
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </div>
    </section>
  );
}
