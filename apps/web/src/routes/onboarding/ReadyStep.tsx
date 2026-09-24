import { Navigate, useNavigate } from "react-router-dom";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { STAGE_ROUTES, stageIndex } from "../../onboarding/stageRoutes.ts";
import { Button } from "../../ui/Button.tsx";
import { LoadingScreen, ErrorState } from "../../ui/states.tsx";
import { Kvo } from "../../brand/Kvo.tsx";

/** Hand-off between onboarding and the placement test. */
export function ReadyStep() {
  const navigate = useNavigate();
  const { status, state, reload } = useOnboardingState();

  if (status === "loading") return <LoadingScreen />;
  if (status === "error") {
    return (
      <div className="center-screen">
        <ErrorState onRetry={reload} />
      </div>
    );
  }

  if (state && stageIndex(state.stage) < stageIndex("placement_required")) {
    return <Navigate to={STAGE_ROUTES[state.stage]} replace />;
  }

  return (
    <div className="center-screen has-blobs">
      <div
        className="blob blob-green"
        style={{ width: 240, height: 240, top: -90, right: -100 }}
      />
      <div
        className="blob blob-blush"
        style={{ width: 200, height: 200, bottom: -80, left: -80 }}
      />

      <Kvo size={150} state="happy" title="Кво" />
      <h1 className="h1">Всё готово</h1>
      <p className="body muted" style={{ maxWidth: 320 }}>
        Осталось определить уровень — короткий тест на 3–5 минут, и мы соберём
        твой курс.
      </p>
      <div style={{ width: "100%", maxWidth: 320, paddingTop: "var(--s2)" }}>
        <Button onClick={() => navigate("/placement")}>Пройти тест</Button>
      </div>
    </div>
  );
}
