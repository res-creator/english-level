import { Navigate } from "react-router-dom";
import { useAuth } from "./auth/useAuth.ts";
import { LoadingScreen } from "./ui/states.tsx";
import { Kvo } from "./brand/Kvo.tsx";
import {
  hasSeenWelcome,
  resolveAuthenticatedRoute,
} from "./rootRedirectLogic.ts";

/** Entry point: routes by the backend's own navigation intent. */
export function RootRedirect() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return <LoadingScreen note="Speak in English" />;
  }

  if (auth.status === "authenticated" && auth.next) {
    return (
      <Navigate
        to={resolveAuthenticatedRoute(auth.next, hasSeenWelcome())}
        replace
      />
    );
  }

  if (auth.status === "error" || auth.status === "unauthenticated") {
    return (
      <div className="center-screen has-blobs">
        <div
          className="blob blob-green"
          style={{ width: 240, height: 240, top: -100, right: -100 }}
        />
        <Kvo size={140} state="idle" title="Кво" />
        <h1 className="h2">Открой приложение через Telegram</h1>
        <p className="small muted" style={{ maxWidth: 300 }}>
          Speak in English работает внутри Telegram — так мы узнаём твой
          прогресс и продолжаем с нужного места.
        </p>
      </div>
    );
  }

  return <Navigate to="/today" replace />;
}
