import { Navigate } from "react-router-dom";
import { useOnboardingState } from "../../onboarding/useOnboardingState.ts";
import { resolveOnboardingIndexRoute } from "../../onboarding/resolveOnboardingIndexRoute.ts";
import { LoadingScreen, ErrorState } from "../../ui/states.tsx";

/** Resolves `/onboarding` to whichever step the backend says is current. */
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
  return <Navigate to={resolveOnboardingIndexRoute(state)} replace />;
}
