import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LEARNING_GOALS, type LearningGoal } from "@english-level/contracts";
import { useAuth } from "../../auth/useAuth.ts";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { updateGoals } from "../../onboarding/onboardingClient.ts";
import { goalLabel } from "../../onboarding/labels.ts";
import { STAGE_ROUTES } from "../../onboarding/stageRoutes.ts";
import { OnboardingStep } from "../../onboarding/OnboardingStep.tsx";
import { Button } from "../../ui/Button.tsx";
import { LoadingScreen, ErrorState } from "../../ui/states.tsx";

const MAX_GOALS = 3;

export function GoalsStep() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status, state, reload } = useOnboardingState();
  const [selected, setSelected] = useState<LearningGoal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state) setSelected(state.goals);
  }, [state]);

  if (status === "loading") return <LoadingScreen />;
  if (status === "error") {
    return (
      <div className="center-screen">
        <ErrorState onRetry={reload} />
      </div>
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
    } catch {
      setError("Не получилось сохранить. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingStep
      step={1}
      title="Зачем тебе английский?"
      subtitle="Выбери до трёх целей — под них подберём слова и темы."
      onBack={() => navigate("/welcome")}
      footer={
        <Button
          disabled={selected.length === 0 || submitting}
          onClick={handleContinue}
        >
          {submitting ? "Сохраняем…" : "Дальше"}
        </Button>
      }
    >
      <div className="chip-wrap">
        {LEARNING_GOALS.map((goal) => (
          <button
            key={goal}
            type="button"
            className={selected.includes(goal) ? "chip is-selected" : "chip"}
            onClick={() => toggle(goal)}
            aria-pressed={selected.includes(goal)}
          >
            {selected.includes(goal) ? "✓ " : ""}
            {goalLabel(goal, user?.interfaceLanguage)}
          </button>
        ))}
      </div>
      {error ? (
        <p className="small" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}
    </OnboardingStep>
  );
}
