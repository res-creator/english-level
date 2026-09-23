import { useNavigate } from "react-router-dom";
import { WelcomeArt } from "../brand/illustrations.tsx";
import { Button } from "../ui/Button.tsx";

/** First screen of the product. Illustration-led and emotional — the one
 * place that sells the idea before asking for anything. */
export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="focus-shell has-blobs">
      <div
        className="blob blob-blush"
        style={{ width: 220, height: 220, top: -80, left: -90 }}
      />
      <div
        className="blob blob-green"
        style={{ width: 260, height: 260, bottom: -120, right: -110 }}
      />

      <div
        className="focus-body"
        style={{ justifyContent: "space-between", gap: 0 }}
      >
        <div className="row" style={{ paddingTop: 4 }}>
          <span className="brand">
            <span className="brand__dot" aria-hidden="true">
              S
            </span>
            Speak in English
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "var(--s6) 0 var(--s4)",
          }}
        >
          <WelcomeArt />
        </div>

        <div className="stack" style={{ paddingBottom: "var(--s6)" }}>
          <h1 className="display">Английский без хаоса</h1>
          <p className="body muted">
            Короткие уроки, понятная структура и прогресс каждый день — прямо в
            Telegram.
          </p>
        </div>

        <div className="stack-sm">
          <Button onClick={() => navigate("/onboarding/goals")}>
            Начать обучение
          </Button>
          <p className="caption muted" style={{ textAlign: "center" }}>
            Займёт пару минут — подберём уровень и первый урок
          </p>
        </div>
      </div>
    </div>
  );
}
