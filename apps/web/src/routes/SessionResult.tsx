import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { SessionResultDTO } from "@english-level/contracts";
import { getSessionResult } from "../api/productClient.ts";
import { Kvo } from "../brand/Kvo.tsx";
import { Art, ArtLayer } from "../brand/Art.tsx";
import { artName } from "../brand/artRegistry.ts";
import { Button, IconButton } from "../ui/Button.tsx";
import { LoadingScreen, ErrorState } from "../ui/states.tsx";
import { IconCheck, IconClose, IconHome, IconSparkle } from "../ui/icons.tsx";

type State =
  | { status: "loading" }
  | { status: "ready"; result: SessionResultDTO }
  | { status: "error" };

/**
 * "Теперь ты можешь…" is the message. Everything else is support.
 *
 * After a passed Mission the screen leads with the object the situation
 * left behind and the capability it earned. The accuracy figure is
 * present but deliberately small — a percentage is a fact about a
 * session, not about what the learner can now do in a café.
 */
export function SessionResult() {
  const { episodeId, sessionId } = useParams<{
    episodeId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const instant = (location.state as { result?: SessionResultDTO } | null)
    ?.result;

  const [state, setState] = useState<State>(
    instant ? { status: "ready", result: instant } : { status: "loading" },
  );

  useEffect(() => {
    if (instant || !sessionId) return;
    let cancelled = false;
    getSessionResult(sessionId)
      .then((result) => {
        if (!cancelled) setState({ status: "ready", result });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (state.status === "loading") return <LoadingScreen />;

  if (state.status === "error") {
    return (
      <div className="center-screen">
        <ErrorState
          title="Результат недоступен"
          message="Занятие сохранено — вернись к курсу, чтобы продолжить."
          onRetry={() => navigate("/course")}
        />
      </div>
    );
  }

  const { result } = state;
  const passed = result.missionPassed === true;
  const failed = result.missionPassed === false;
  const reward = result.rewards[0];

  return (
    <div className="hero-screen">
      <div className="hero-screen__stage hero-screen__stage--result">
        <ArtLayer name={artName.heroBackdrop("mission-result")} priority />

        <div className="result-top">
          <IconButton label="Закрыть" onClick={() => navigate("/today")}>
            <IconClose size={19} />
          </IconButton>
          <span className="result-top__title">
            {passed
              ? `Ситуация «${result.episodeTitle}» пройдена`
              : failed
                ? "Почти получилось"
                : `Заход ${result.sessionsDone} из ${result.sessionsTotal}`}
          </span>
          <span style={{ width: 40 }} />
        </div>

        {reward ? (
          <>
            <div className="memory-object" aria-hidden="true">
              <Art
                name={artName.spaceObject(reward.id)}
                priority
                style={{ width: "72%", height: "72%" }}
                fallback={<span>{reward.glyph}</span>}
              />
            </div>
            <span className="memory-pill">
              <IconSparkle size={16} /> Новое воспоминание · {reward.title}
            </span>
          </>
        ) : (
          <div className="result-kvo">
            <Kvo size={150} state={failed ? "thinking" : "happy"} />
          </div>
        )}

        {reward ? (
          <span className="result-kvo result-kvo--corner">
            <Kvo size={96} state="happy" flip />
          </span>
        ) : null}
      </div>

      <div className="hero-screen__sheet">
        <div className="sheet-grabber" aria-hidden="true" />

        {passed && result.capability ? (
          <>
            <h1 className="display">Теперь ты можешь…</h1>
            <div className="can-list">
              <div className="can-list__row">
                <span className="can-list__mark" aria-hidden="true">
                  <IconCheck size={18} />
                </span>
                <span className="can-list__text">{result.capability}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="h1">
              {failed
                ? "Ещё пара заходов — и миссия получится"
                : result.missionReady
                  ? "Материал пройден. Осталась миссия."
                  : "Заход закрыт"}
            </h1>
            <p className="body muted">
              {failed
                ? "Ничего не потеряно: язык остался с тобой, вернёмся к нему завтра."
                : "Сложные места вернутся в повторении — так они и запоминаются."}
            </p>
          </>
        )}

        {reward ? (
          <div className="lives-in">
            <IconHome size={17} />
            <span>
              {reward.title} теперь живёт в <b>Моём месте</b>
            </span>
          </div>
        ) : null}

        {/* Real, but secondary. */}
        <div className="result-facts">
          <span>
            {result.correctCount} из {result.scoredAttempts} верно
          </span>
          <span>·</span>
          <span>{result.accuracy}%</span>
        </div>

        <div className="hero-screen__actions">
          {passed && result.nextEpisodeId ? (
            <>
              <Button
                onClick={() => navigate(`/course/${result.nextEpisodeId}`)}
              >
                Дальше
              </Button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate("/today")}
              >
                На главную
              </button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate("/today")}>Готово</Button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate(`/course/${episodeId}`)}
              >
                К ситуации
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
