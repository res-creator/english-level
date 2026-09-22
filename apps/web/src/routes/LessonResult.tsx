import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { LessonResultDTO } from "@english-level/contracts";
import { getSessionResult } from "../lessonEngine/lessonSessionClient.ts";

type State =
  | { status: "loading" }
  | { status: "ready"; result: LessonResultDTO }
  | { status: "error"; message: string };

/**
 * Only shows numbers that actually exist: question count, correct count,
 * accuracy. No streak, no mastery, no "words learned" — those systems
 * don't exist yet.
 *
 * The result is shown instantly from router navigation state when it's
 * present (the normal "just finished the lesson" path, no extra
 * request), and otherwise fetched from `GET /api/v1/sessions/:id/result`
 * using the `sessionId` in the URL — so a page reload, a direct link, or
 * reopening the Mini App later all still show the real, persisted
 * result instead of losing it.
 */
export function LessonResult() {
  const { lessonId, sessionId } = useParams<{
    lessonId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateResult = (location.state as { result?: LessonResultDTO } | null)
    ?.result;

  const [state, setState] = useState<State>(
    stateResult
      ? { status: "ready", result: stateResult }
      : { status: "loading" },
  );

  useEffect(() => {
    if (stateResult || !sessionId) return;
    let cancelled = false;
    getSessionResult(sessionId)
      .then((result) => {
        if (!cancelled) setState({ status: "ready", result });
      })
      .catch((err) => {
        if (!cancelled)
          setState({ status: "error", message: (err as Error).message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (state.status === "loading") return <p>Loading…</p>;

  if (state.status === "error") {
    return (
      <section className="onboarding-screen">
        <p className="onboarding-error">{state.message}</p>
        <div className="onboarding-actions">
          <button
            type="button"
            className="button-primary"
            onClick={() =>
              navigate(lessonId ? `/learn/lessons/${lessonId}` : "/learn")
            }
          >
            Back
          </button>
        </div>
      </section>
    );
  }

  const { result } = state;

  return (
    <section className="onboarding-screen">
      <p className="onboarding-progress">Lesson complete 🎉</p>
      <h1>{result.lessonTitle}</h1>
      <p>
        {result.scoredAttempts} question{result.scoredAttempts === 1 ? "" : "s"}
        <br />
        {result.correctCount} correct
      </p>
      <p className="result-level">{result.accuracy}%</p>

      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          onClick={() => navigate("/learn")}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
