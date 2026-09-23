import { Navigate } from "react-router-dom";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { STAGE_ROUTES } from "../../onboarding/stageRoutes.ts";
import { LoadingScreen, ErrorState } from "../../ui/states.tsx";

/**
 * Resolves `/onboarding` from the backend's own stage. A learner who
 * hasn't answered anything yet sees Welcome first; anyone mid-flow goes
 * straight back to the step the server says is current.
 */
export function OnboardingIndex() {
  const { status, state, reload } = useOnboardingState();

  if (status === "loading") return <LoadingScreen />;
  if (status === "error") {
    return (
      <div className="center-screen">
        <ErrorState onRetry={reload} />
      </div>
    );
  }

  if (!state) return null;
  if (state.stage === "goals" && state.goals.length === 0) {
    return <Navigate to="/welcome" replace />;
  }
  return <Navigate to={STAGE_ROUTES[state.stage]} replace />;
}
