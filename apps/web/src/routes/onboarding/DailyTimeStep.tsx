import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  DAILY_MINUTES_OPTIONS,
  type DailyMinutes,
} from "@english-level/contracts";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { updateDailyTime } from "../../onboarding/onboardingClient.ts";
import { STAGE_ROUTES, stageIndex } from "../../onboarding/stageRoutes.ts";
import { OnboardingStep } from "../../onboarding/OnboardingStep.tsx";
import { Button } from "../../ui/Button.tsx";
import { LoadingScreen, ErrorState } from "../../ui/states.tsx";

const HINTS: Record<number, string> = {
  5: "Один короткий урок",
  10: "Рекомендуем",
  15: "Заметный прогресс",
};

export function DailyTimeStep() {
  const navigate = useNavigate();
  const { status, state, reload } = useOnboardingState();
  const [selected, setSelected] = useState<DailyMinutes | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state?.dailyMinutes != null) setSelected(state.dailyMinutes);
  }, [state]);

  if (status === "loading") return <LoadingScreen />;
  if (status === "error") {
    return (
      <div className="center-screen">
        <ErrorState onRetry={reload} />
      </div>
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
    } catch {
      setError("Не получилось сохранить. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingStep
      step={3}
      title="Сколько минут в день?"
      subtitle="Лучше меньше, но каждый день — так привычка держится дольше."
      onBack={() => navigate("/onboarding/level")}
      footer={
        <Button
          disabled={selected === null || submitting}
          onClick={handleContinue}
        >
          {submitting ? "Сохраняем…" : "Дальше"}
        </Button>
      }
    >
      <div className="stack-sm">
        {DAILY_MINUTES_OPTIONS.map((minutes) => {
          const picked = selected === minutes;
          return (
            <button
              key={minutes}
              type="button"
              className={"answer" + (picked ? " answer--picked" : "")}
              onClick={() => setSelected(minutes)}
              aria-pressed={picked}
            >
              <span className="answer__body">
                <span className="answer__text">{minutes} минут</span>
                {HINTS[minutes] ? (
                  <span className="answer__because">{HINTS[minutes]}</span>
                ) : null}
              </span>
              <span className="answer__mark" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="small" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}
    </OnboardingStep>
  );
}
