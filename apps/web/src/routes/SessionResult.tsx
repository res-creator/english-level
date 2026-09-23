import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { CompanionDTO, SessionResultDTO } from "@english-level/contracts";
import { getMySpace, getSessionResult } from "../api/productClient.ts";
import { CompanionPicker } from "../components/CompanionPicker.tsx";
import { Button } from "../ui/Button.tsx";
import { CircularProgress } from "../ui/CircularProgress.tsx";
import { LoadingScreen, ErrorState } from "../ui/states.tsx";
import { ResultArt } from "../brand/illustrations.tsx";

type State =
  | { status: "loading" }
  | { status: "ready"; result: SessionResultDTO }
  | { status: "error" };

function sessionMessage(result: SessionResultDTO): string {
  if (result.missionReady)
    return "Материал ситуации пройден. Осталось проверить его на деле.";
  if (result.accuracy >= 90) return "Уверенно. Завтра закрепим.";
  if (result.accuracy >= 70) return "Хорошо — основное усвоено.";
  if (result.wrongCount > 0)
    return "Сложные места вернутся в повторении — так они и запоминаются.";
  return "Заход закрыт. Дальше будет легче.";
}

/**
 * The result screen's centre of gravity is what the learner can now do,
 * not the percentage. After a passed Mission that is a plain statement
 * ("Теперь ты можешь…"); after an ordinary session it is honest progress
 * towards it. The result is re-fetchable from the server, so reopening
 * this URL never shows a blank screen.
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
  // Offered exactly once, right after the very first session — when the
  // learner has already felt what the app does, and not before.
  const [companionChoices, setCompanionChoices] = useState<CompanionDTO[]>([]);

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

  useEffect(() => {
    if (state.status !== "ready") return;
    if (state.result.kind !== "lesson" || state.result.sessionsDone !== 1)
      return;
    let cancelled = false;
    getMySpace()
      .then((space) => {
        if (!cancelled && !space.companion) {
          setCompanionChoices(space.companionChoices);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [state]);

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
  const missionPassed = result.missionPassed === true;
  const missionFailed = result.missionPassed === false;

  return (
    <div className="focus-shell has-blobs">
      <div
        className="blob blob-green"
        style={{ width: 280, height: 280, top: -130, left: -110 }}
      />
      <div
        className="blob blob-blush"
        style={{ width: 200, height: 200, bottom: 120, right: -90 }}
      />

      <div className="focus-body">
        <div className="result-hero">
          <ResultArt accuracy={result.accuracy} />
          <span className="eyebrow muted">
            {missionPassed
              ? "Миссия пройдена"
              : missionFailed
                ? "Почти получилось"
                : `Заход ${result.sessionsDone} из ${result.sessionsTotal}`}
          </span>
          <h1 className="h1" style={{ textAlign: "center" }}>
            {result.episodeTitle}
          </h1>
        </div>

        {missionPassed && result.capability ? (
          <div className="capability-card">
            <span className="capability-card__label">Теперь ты можешь</span>
            <p className="capability-card__text">{result.capability}</p>
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress percent={result.accuracy} />
        </div>

        <div className="result-stats">
          <div className="result-stats__cell">
            <div className="result-stats__value">{result.correctCount}</div>
            <div className="result-stats__label">верных</div>
          </div>
          <div className="result-stats__cell">
            <div className="result-stats__value">{result.scoredAttempts}</div>
            <div className="result-stats__label">заданий</div>
          </div>
          <div className="result-stats__cell">
            <div className="result-stats__value">{result.accuracy}%</div>
            <div className="result-stats__label">точность</div>
          </div>
        </div>

        {companionChoices.length > 0 ? (
          <CompanionPicker
            choices={companionChoices}
            onChosen={() => setCompanionChoices([])}
            title="Теперь выбери, кто будет рядом"
          />
        ) : null}

        {result.rewards.length > 0 ? (
          <div className="stack-sm">
            <span className="eyebrow muted" style={{ textAlign: "center" }}>
              В твоём уголке появилось
            </span>
            {result.rewards.map((reward) => (
              <div className="reward-row" key={reward.id}>
                <span className="reward-row__glyph" aria-hidden="true">
                  {reward.glyph}
                </span>
                <span className="reward-row__body">
                  <span className="reward-row__title">{reward.title}</span>
                  <span className="reward-row__reason">{reward.reason}</span>
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <p className="body muted" style={{ textAlign: "center" }}>
          {missionFailed
            ? "Ещё пара заходов — и миссия точно получится."
            : missionPassed && result.teaser
              ? result.teaser
              : sessionMessage(result)}
        </p>
      </div>

      <div className="focus-footer stack-sm">
        {missionPassed && result.nextEpisodeId ? (
          <>
            <Button onClick={() => navigate(`/course/${result.nextEpisodeId}`)}>
              Следующая ситуация
            </Button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate("/today")}
            >
              На сегодня хватит
            </button>
          </>
        ) : (
          <>
            <Button onClick={() => navigate("/today")}>Готово</Button>
            {result.reviewDue > 0 ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate("/review")}
              >
                Повторить ({result.reviewDue})
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate("/review?extra=1")}
              >
                Хочу ещё
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
