import { useCallback, useEffect, useState } from "react";
import type { OnboardingStateResponse } from "@english-level/contracts";
import { getOnboardingState } from "./onboardingClient.ts";

export interface UseOnboardingStateResult {
  status: "loading" | "ready" | "error";
  state: OnboardingStateResponse | null;
  message: string | null;
  reload: () => void;
}

/** Fetches the backend's onboarding state on mount. Each onboarding page
 * uses this rather than trusting any locally-remembered step. */
export function useOnboardingState(): UseOnboardingStateResult {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [state, setState] = useState<OnboardingStateResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(() => {
    setStatus("loading");
    getOnboardingState()
      .then((next) => {
        setState(next);
        setStatus("ready");
      })
      .catch((err) => {
        setMessage((err as Error).message);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { status, state, message, reload };
}
