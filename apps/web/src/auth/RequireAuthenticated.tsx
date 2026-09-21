import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth.ts";

/** Gate for routes that need an authenticated session (e.g. onboarding). */
export function RequireAuthenticated() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return <p>Loading…</p>;
  }
  if (auth.status !== "authenticated") {
    return <Navigate to="/today" replace />;
  }
  return <Outlet />;
}
