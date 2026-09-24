import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button.tsx";
import { ArtLayer } from "../brand/Art.tsx";
import { artName } from "../brand/artRegistry.ts";

/**
 * What just happened, and what happens next.
 *
 * The transcript proves the learner held a real exchange. The timeline
 * below it is the honest promise of the product: we will bring this
 * phrase back on a schedule, so that in a real café it arrives by itself.
 * That is spaced repetition explained without ever naming it.
 */
const TIMELINE = [
  { label: "Сегодня", chip: null, state: "done" as const },
  { label: "Через 2 дня", chip: "to go", state: "next" as const },
  { label: "Через неделю", chip: "to go", state: "next" as const },
  { label: "В жизни", chip: null, state: "goal" as const },
];

export function DemoResult() {
  const navigate = useNavigate();

  return (
    <div className="hero-screen">
      <div className="hero-screen__stage hero-screen__stage--tall">
        <ArtLayer name={artName.heroBackdrop("demo-result")} priority />

        <span className="stage-chip">Демо завершено · 48 секунд</span>

        <div className="transcript">
          <div className="transcript__row">
            <span className="transcript__avatar" aria-hidden="true">
              М
            </span>
            <span className="transcript__bubble en">For here or to go?</span>
          </div>
          <div className="transcript__row transcript__row--you">
            <span className="transcript__bubble transcript__bubble--you en">
              To go, please.
            </span>
          </div>
          <div className="transcript__tag">✓ твой ответ</div>
          <div className="transcript__row">
            <span className="transcript__avatar" aria-hidden="true">
              М
            </span>
            <span className="transcript__bubble en">Sure! One moment.</span>
          </div>
        </div>
      </div>

      <div className="hero-screen__sheet">
        <div className="sheet-grabber" aria-hidden="true" />
        <h1 className="h1">Ты только что справился с реальной ситуацией.</h1>

        <div className="timeline" role="list">
          {TIMELINE.map((point, index) => (
            <div className="timeline__point" role="listitem" key={point.label}>
              {point.chip ? (
                <span className="timeline__chip en">{point.chip}</span>
              ) : (
                <span className="timeline__chip timeline__chip--empty" />
              )}
              <span className={`timeline__dot timeline__dot--${point.state}`} />
              <span
                className={
                  index === 0 || index === TIMELINE.length - 1
                    ? "timeline__label is-strong"
                    : "timeline__label"
                }
              >
                {point.label}
              </span>
            </div>
          ))}
        </div>

        <p className="body muted">
          Мы вернём эту фразу в нужный момент — чтобы в настоящем кафе она
          пришла сама.
        </p>

        <div className="hero-screen__actions">
          <Button onClick={() => navigate("/onboarding/companion")}>
            Продолжить
          </Button>
        </div>
      </div>
    </div>
  );
}
