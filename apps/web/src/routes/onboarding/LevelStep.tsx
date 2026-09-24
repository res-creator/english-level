import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { SelfReportedCefrLevel } from "@english-level/contracts";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { updateLevel } from "../../onboarding/onboardingClient.ts";
import { STAGE_ROUTES, stageIndex } from "../../onboarding/stageRoutes.ts";
import { OnboardingStep } from "../../onboarding/OnboardingStep.tsx";
import { Button } from "../../ui/Button.tsx";
import { LoadingScreen, ErrorState } from "../../ui/states.tsx";

type Option = Exclude<SelfReportedCefrLevel, null> | "unknown";

const OPTIONS: Array<{ value: Option; label: string; hint: string }> = [
  { value: "unknown", label: "Не знаю", hint: "Определим на тесте" },
  { value: "A1", label: "A1", hint: "Знаю отдельные слова" },
  { value: "A2", label: "A2", hint: "Понимаю простые фразы" },
  { value: "B1", label: "B1", hint: "Говорю на знакомые темы" },
  { value: "B2", label: "B2", hint: "Свободно на большинство тем" },
];

export function LevelStep() {
  const navigate = useNavigate();
  const { status, state, reload } = useOnboardingState();
  const [selected, setSelected] = useState<Option | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state && stageIndex(state.stage) > stageIndex("level_choice")) {
      setSelected(state.selfReportedCefrLevel ?? "unknown");
    }
  }, [state]);

  if (status === "loading") return <LoadingScreen />;
  if (status === "error") {
    return (
      <div className="center-screen">
        <ErrorState onRetry={reload} />
      </div>
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
      const next = await updateLevel(selected === "unknown" ? null : selected);
      navigate(STAGE_ROUTES[next.stage]);
    } catch {
      setError("Не получилось сохранить. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingStep
      step={2}
      title="Как сейчас с английским?"
      subtitle="Это только предположение — точный уровень покажет короткий тест."
      onBack={() => navigate("/onboarding/goals")}
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
        {OPTIONS.map((option) => {
          const picked = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={"answer" + (picked ? " answer--picked" : "")}
              onClick={() => setSelected(option.value)}
              aria-pressed={picked}
            >
              <span className="answer__body">
                <span className="answer__text">{option.label}</span>
                <span className="answer__because">{option.hint}</span>
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
