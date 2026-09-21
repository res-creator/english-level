import { Navigate, useNavigate } from "react-router-dom";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { STAGE_ROUTES, stageIndex } from "../../onboarding/stageRoutes.ts";

export function ReadyStep() {
  const navigate = useNavigate();
  const { status, state, message, reload } = useOnboardingState();

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

  if (state && stageIndex(state.stage) < stageIndex("placement_required")) {
    return <Navigate to={STAGE_ROUTES[state.stage]} replace />;
  }

  return (
    <section className="onboarding-screen">
      <h1>Your setup is ready.</h1>
      <p>Let's check your English level.</p>
      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          onClick={() => navigate("/placement")}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
