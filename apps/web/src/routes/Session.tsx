import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  ActivityDTO,
  AnswerFeedback,
  AnswerSessionResponse,
  SessionKind,
} from "@english-level/contracts";
import { answerActivity, startEpisodeSession } from "../api/productClient.ts";
import { ActivityRenderer } from "../lessonEngine/activities/ActivityRenderer.tsx";
import { FocusShell } from "../components/Layout.tsx";
import { Button, IconButton } from "../ui/Button.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";
import { LoadingScreen, ErrorState } from "../ui/states.tsx";
import { IconClose } from "../ui/icons.tsx";
import { FeedbackPanel } from "../lessonEngine/FeedbackPanel.tsx";

type Active = {
  status: "active";
  sessionId: string;
  kind: SessionKind;
  title: string;
  activity: ActivityDTO;
  submitting: boolean;
  feedback: AnswerFeedback | null;
  pendingNext: AnswerSessionResponse["session"] | null;
};

type State = { status: "loading" } | { status: "error" } | Active;

/** Cards are never scored — acknowledging one just advances. */
function isCardKind(kind: ActivityDTO["kind"]): boolean {
  return kind === "info_card" || kind === "grammar_card";
}

/**
 * Focus mode: one activity, a thin progress header, one action. The
 * server decides whether this is a daily session or the Mission; the only
 * difference here is the framing, because a Mission must feel like the
 * real thing, not a harder quiz.
 */
export function Session() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const [answer, setAnswer] = useState<string>("");
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!episodeId) return;
    let cancelled = false;
    startEpisodeSession(episodeId)
      .then((session) => {
        if (cancelled) return;
        if (!session.currentActivity) {
          navigate(`/course/${episodeId}`, { replace: true });
          return;
        }
        startedAtRef.current = Date.now();
        setState({
          status: "active",
          sessionId: session.sessionId,
          kind: session.kind,
          title: session.episode.situationTitle ?? session.episode.title,
          activity: session.currentActivity,
          submitting: false,
          feedback: null,
          pendingNext: null,
        });
        setAnswer("");
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [episodeId, navigate]);

  async function submit(value: string) {
    if (state.status !== "active" || state.submitting) return;
    const { sessionId, activity } = state;
    setState({ ...state, submitting: true });

    try {
      const res = await answerActivity(sessionId, {
        activityId: activity.id,
        answer: value,
        responseTimeMs: Date.now() - startedAtRef.current,
        attemptId: crypto.randomUUID(),
      });

      if (isCardKind(activity.kind)) {
        advance(state, res.session);
        return;
      }

      setState({
        ...state,
        submitting: false,
        feedback: res.feedback,
        pendingNext: res.session,
      });
    } catch {
      setState({ status: "error" });
    }
  }

  function advance(current: Active, session: AnswerSessionResponse["session"]) {
    if (session.status === "completed") {
      navigate(`/course/${episodeId}/result/${current.sessionId}`, {
        replace: true,
        state: { result: session.result },
      });
      return;
    }
    startedAtRef.current = Date.now();
    setAnswer("");
    setState({
      ...current,
      activity: session.nextActivity,
      submitting: false,
      feedback: null,
      pendingNext: null,
    });
  }

  function handleContinue() {
    if (state.status !== "active" || !state.pendingNext) return;
    advance(state, state.pendingNext);
  }

  if (state.status === "loading") {
    return <LoadingScreen note="Собираем заход" />;
  }

  if (state.status === "error") {
    return (
      <div className="center-screen">
        <ErrorState
          title="Занятие прервалось"
          message="Прогресс сохранён — можно продолжить с того же места."
          onRetry={() => navigate(`/course/${episodeId}`)}
        />
      </div>
    );
  }

  const { activity, feedback, submitting, kind } = state;
  const percent = Math.round(
    (100 * activity.progress.current) / activity.progress.total,
  );
  const isCard = isCardKind(activity.kind);
  const canSubmit = isCard || answer.trim().length > 0;
  const isMission = kind === "mission";

  return (
    <FocusShell
      top={
        <div className="session-top">
          <IconButton
            label="Выйти"
            onClick={() => navigate(`/course/${episodeId}`)}
          >
            <IconClose size={19} />
          </IconButton>
          <div className="grow">
            <ProgressBar percent={percent} thin />
          </div>
          <span className="session-count">
            {activity.progress.current}/{activity.progress.total}
          </span>
        </div>
      }
      footer={
        feedback ? (
          <Button onClick={handleContinue}>Продолжить</Button>
        ) : (
          <Button
            disabled={!canSubmit || submitting}
            onClick={() => submit(isCard ? "" : answer)}
          >
            {submitting ? "Проверяем…" : isCard ? "Понятно" : "Проверить"}
          </Button>
        )
      }
    >
      {isMission ? (
        <div className="mission-banner">
          <span className="mission-banner__label">Миссия</span>
          <span className="mission-banner__text">{state.title}</span>
        </div>
      ) : null}

      <ActivityRenderer
        key={activity.id}
        activity={activity}
        answer={answer}
        onAnswerChange={setAnswer}
        feedback={feedback}
        disabled={submitting || !!feedback}
      />

      {feedback ? <FeedbackPanel feedback={feedback} /> : null}
    </FocusShell>
  );
}
