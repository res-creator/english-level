import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  ActivityDTO,
  AnswerActivityResponse,
  AnswerFeedback,
} from "@english-level/contracts";
import {
  answerActivity,
  startLesson,
} from "../lessonEngine/lessonSessionClient.ts";
import { ActivityRenderer } from "../lessonEngine/activities/ActivityRenderer.tsx";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "active";
      sessionId: string;
      lessonTitle: string;
      activity: ActivityDTO;
      submitting: boolean;
      feedback: AnswerFeedback | null;
      pendingNext: AnswerActivityResponse["session"] | null;
    };

/** True for cards (info_card/grammar_card) — never scored, so there's no
 * feedback to show; a Continue tap advances immediately. */
function isCardKind(kind: ActivityDTO["kind"]): boolean {
  return kind === "info_card" || kind === "grammar_card";
}

export function LessonSession() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    startLesson(lessonId)
      .then((session) => {
        if (cancelled) return;
        if (!session.currentActivity) {
          // Nothing to answer (shouldn't normally happen for a fresh
          // start) — there's nothing honest to show here.
          navigate(`/learn/lessons/${lessonId}`, { replace: true });
          return;
        }
        startedAtRef.current = Date.now();
        setState({
          status: "active",
          sessionId: session.sessionId,
          lessonTitle: session.lesson.title,
          activity: session.currentActivity,
          submitting: false,
          feedback: null,
          pendingNext: null,
        });
      })
      .catch((err) => {
        if (!cancelled)
          setState({ status: "error", message: (err as Error).message });
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId, navigate]);

  async function handleSubmit(answer: string) {
    if (state.status !== "active") return;
    const { sessionId, activity } = state;
    setState({ ...state, submitting: true });

    try {
      const res = await answerActivity(sessionId, {
        activityId: activity.id,
        answer,
        responseTimeMs: Date.now() - startedAtRef.current,
        attemptId: crypto.randomUUID(),
      });

      if (isCardKind(activity.kind)) {
        advance(sessionId, state.lessonTitle, res.session);
        return;
      }

      setState({
        status: "active",
        sessionId,
        lessonTitle: state.lessonTitle,
        activity,
        submitting: false,
        feedback: res.feedback,
        pendingNext: res.session,
      });
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  }

  function advance(
    sessionId: string,
    lessonTitle: string,
    session: AnswerActivityResponse["session"],
  ) {
    if (session.status === "completed") {
      navigate(`/learn/lessons/${lessonId}/result/${sessionId}`, {
        replace: true,
        state: { result: session.result },
      });
      return;
    }
    startedAtRef.current = Date.now();
    setState({
      status: "active",
      sessionId,
      lessonTitle,
      activity: session.nextActivity,
      submitting: false,
      feedback: null,
      pendingNext: null,
    });
  }

  function handleContinue() {
    if (state.status !== "active" || !state.pendingNext) return;
    advance(state.sessionId, state.lessonTitle, state.pendingNext);
  }

  if (state.status === "loading") return <p>Loading…</p>;

  if (state.status === "error") {
    return (
      <section className="onboarding-screen">
        <p className="onboarding-error">{state.message}</p>
      </section>
    );
  }

  const { activity, feedback } = state;
  const percent = Math.round(
    (100 * activity.progress.current) / activity.progress.total,
  );

  return (
    <section className="onboarding-screen">
      <p className="onboarding-progress">{state.lessonTitle}</p>
      <div className="placement-progress-track">
        <div
          className="placement-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="onboarding-progress">
        {activity.progress.current} / {activity.progress.total}
      </p>

      <ActivityRenderer
        key={activity.id}
        activity={activity}
        disabled={state.submitting || !!feedback}
        onSubmit={handleSubmit}
      />

      {feedback && (
        <div
          className={
            feedback.correct
              ? "activity-feedback activity-feedback--correct"
              : "activity-feedback activity-feedback--wrong"
          }
        >
          <p>{feedback.correct ? "Correct!" : "Not quite."}</p>
          {!feedback.correct && (
            <>
              <p>Correct answer: {feedback.correctAnswer}</p>
              {feedback.explanation && <p>{feedback.explanation}</p>}
            </>
          )}
          <div className="onboarding-actions">
            <button
              type="button"
              className="button-primary"
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
