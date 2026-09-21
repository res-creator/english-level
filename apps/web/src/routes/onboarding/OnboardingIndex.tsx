import { Navigate } from "react-router-dom";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { STAGE_ROUTES } from "../../onboarding/stageRoutes.ts";

/** Resolves `/onboarding` to whichever step the backend says is current. */
export function OnboardingIndex() {
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

  if (!state) return null;
  return <Navigate to={STAGE_ROUTES[state.stage]} replace />;
}
