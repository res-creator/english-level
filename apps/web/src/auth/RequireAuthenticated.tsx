import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth.ts";
import { LoadingScreen } from "../ui/states.tsx";

/** Gate for routes that need an authenticated session (onboarding,
 * placement, lesson mode). */
export function RequireAuthenticated() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return <LoadingScreen note="Speak in English" />;
  }
  if (auth.status !== "authenticated") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
