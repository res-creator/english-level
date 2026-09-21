import { useEffect, useState } from "react";
import { getHealth } from "../lib/apiClient";
import { useTelegram } from "../telegram/useTelegram";
import { useAuth } from "../auth/useAuth";

type ApiStatus =
  { state: "loading" } | { state: "ok" } | { state: "error"; message: string };

export function Today() {
  const { user, isMock } = useTelegram();
  const auth = useAuth();
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ state: "loading" });

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus({ state: "ok" }))
      .catch((err) =>
        setApiStatus({ state: "error", message: (err as Error).message }),
      );
  }, []);

  return (
    <section>
      <h1>Today</h1>
      <p>Placeholder page — the daily plan will live here.</p>
      <p>
        Hello, {user?.first_name ?? "there"}
        {isMock ? " (Telegram mock — running outside Telegram)" : ""}
      </p>
      <p>
        API status: {apiStatus.state === "loading" && "checking..."}
        {apiStatus.state === "ok" && "ok"}
        {apiStatus.state === "error" && `unreachable (${apiStatus.message})`}
      </p>
      <p>
        Auth status: {auth.status}
        {auth.status === "authenticated" &&
          ` (${auth.user?.firstName}, next: ${auth.next})`}
        {auth.status === "error" && ` (${auth.error})`}
      </p>
    </section>
  );
}
