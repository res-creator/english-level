import { Navigate } from "react-router-dom";
import { useAuth } from "./auth/useAuth.ts";

/** Routes `/` by auth state: unauthenticated/error falls through to the
 * existing Phase 0/1 Today placeholder (keeps dev/mock browsing working),
 * authenticated users go by their `next` navigation intent. */
export function RootRedirect() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return <p>Loading…</p>;
  }
  if (auth.status === "authenticated") {
    if (auth.next === "onboarding")
      return <Navigate to="/onboarding" replace />;
    if (auth.next === "placement") return <Navigate to="/placement" replace />;
    return <Navigate to="/today" replace />;
  }
  return <Navigate to="/today" replace />;
}
