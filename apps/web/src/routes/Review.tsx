import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type {
  ActivityDTO,
  AnswerFeedback,
  AnswerReviewResponse,
  ReviewResultDTO,
  ReviewStateResponse,
} from "@english-level/contracts";
import {
  answerReview,
  getReviewState,
  startReview,
} from "../api/productClient.ts";
import { ActivityPanel } from "../scene/ActivityPanel.tsx";
import { Kvo } from "../brand/Kvo.tsx";
import { FocusShell } from "../components/Layout.tsx";
import { Button, IconButton } from "../ui/Button.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";
import { SkeletonList, ErrorState } from "../ui/states.tsx";
import { IconClose } from "../ui/icons.tsx";

type State =
  | { status: "loading" }
  | { status: "idle"; overview: ReviewStateResponse }
  | {
      status: "active";
      sessionId: string;
      activity: ActivityDTO;
      submitting: boolean;
      feedback: AnswerFeedback | null;
      pendingNext: AnswerReviewResponse["session"] | null;
    }
  | { status: "done"; result: ReviewResultDTO }
  | { status: "error" };

/**
 * Review is separate from the course on purpose: it is the only place
 * where the app decides what to show, and it is always finite. A learner
 * who finishes the queue is finished — there is no "just a few more".
 */
export function Review() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wantsExtra = params.get("extra") === "1";
  const [state, setState] = useState<State>({ status: "loading" });
  const startedAtRef = useRef<number>(Date.now());
  const [answer, setAnswer] = useState("");

  function loadOverview() {
    setState({ status: "loading" });
    getReviewState()
      .then((overview) => setState({ status: "idle", overview }))
      .catch(() => setState({ status: "error" }));
  }

  useEffect(() => {
    if (wantsExtra) {
      begin({ extraPractice: true });
      return;
    }
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsExtra]);

  function begin(options: { extraPractice?: boolean } = {}) {
    setState({ status: "loading" });
    startReview(options)
      .then((session) => {
        if (!session.currentActivity) {
          loadOverview();
          return;
        }
        startedAtRef.current = Date.now();
        setAnswer("");
        setState({
          status: "active",
          sessionId: session.sessionId,
          activity: session.currentActivity,
          submitting: false,
          feedback: null,
          pendingNext: null,
        });
      })
      .catch(() => loadOverview());
  }

  async function submit() {
    if (state.status !== "active" || state.submitting) return;
    setState({ ...state, submitting: true });
    try {
      const res = await answerReview(state.sessionId, {
        activityId: state.activity.id,
        answer,
        responseTimeMs: Date.now() - startedAtRef.current,
        attemptId: crypto.randomUUID(),
      });
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

  function advance() {
    if (state.status !== "active" || !state.pendingNext) return;
    const next = state.pendingNext;
    if (next.status === "completed") {
      setState({ status: "done", result: next.result });
      return;
    }
    startedAtRef.current = Date.now();
    setAnswer("");
    setState({
      ...state,
      activity: next.nextActivity,
      submitting: false,
      feedback: null,
      pendingNext: null,
    });
  }

  if (state.status === "loading") {
    return (
      <section className="stack-lg">
        <h1 className="h1">Повторение</h1>
        <SkeletonList rows={2} height={72} />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="stack-lg">
        <h1 className="h1">Повторение</h1>
        <ErrorState
          title="Не получилось открыть"
          message="Проверь связь и попробуй ещё раз."
          onRetry={loadOverview}
        />
      </section>
    );
  }

  if (state.status === "done") {
    return (
      <ReviewDone result={state.result} onClose={() => navigate("/today")} />
    );
  }

  if (state.status === "idle") {
    return <ReviewIdle overview={state.overview} onStart={begin} />;
  }

  const { activity, feedback, submitting } = state;
  const percent = Math.round(
    (100 * activity.progress.current) / activity.progress.total,
  );

  return (
    <FocusShell
      top={
        <div className="session-top">
          <IconButton label="Выйти" onClick={() => navigate("/today")}>
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
          <Button onClick={advance}>Дальше</Button>
        ) : (
          <Button
            disabled={answer.trim().length === 0 || submitting}
            onClick={submit}
          >
            {submitting ? "Проверяем…" : "Проверить"}
          </Button>
        )
      }
    >
      <ActivityPanel
        key={activity.id}
        activity={activity}
        answer={answer}
        onAnswerChange={setAnswer}
        feedback={feedback}
        disabled={submitting || !!feedback}
      />
      {feedback && !feedback.correct ? (
        <div className="miss">
          <span className="miss__title">Вот как это было</span>
          <span className="miss__answer en">{feedback.correctAnswer}</span>
          {feedback.explanation ? (
            <span className="miss__note">{feedback.explanation}</span>
          ) : null}
        </div>
      ) : null}
    </FocusShell>
  );
}

function ReviewIdle({
  overview,
  onStart,
}: {
  overview: ReviewStateResponse;
  onStart: (options?: { extraPractice?: boolean }) => void;
}) {
  const nothingDue = overview.due === 0;

  return (
    <section className="stack-lg">
      <header className="review-head">
        <Kvo size={96} state={nothingDue ? "happy" : "idle"} />
        <div>
          <span className="eyebrow muted">Твоя память</span>
          <h1 className="h1">Повторение</h1>
        </div>
      </header>

      {nothingDue ? (
        <div className="panel stack-sm">
          <p className="body">На сегодня всё повторено.</p>
          <p className="small muted">
            Повторения приходят сами, ровно тогда, когда язык начинает
            забываться. Копить их не нужно.
          </p>
        </div>
      ) : (
        <div className="panel stack-sm">
          <div className="row-between">
            <span className="caption">К повторению</span>
            <span className="caption num">{overview.due}</span>
          </div>
          <p className="small muted">
            Примерно {overview.estimatedMinutes} мин. Это язык, который ты уже
            встречала — просто пора освежить.
          </p>
          <Button onClick={() => onStart()}>Повторить</Button>
        </div>
      )}

      <div className="stat-strip">
        <div className="stat-strip__item">
          <span className="stat-strip__value num">{overview.weak}</span>
          <span className="stat-strip__label">Требуют внимания</span>
        </div>
        <div className="stat-strip__item">
          <span className="stat-strip__value num">
            {overview.awaitingConsolidation}
          </span>
          <span className="stat-strip__label">Ждут закрепления</span>
        </div>
      </div>

      {nothingDue && overview.availableForExtra ? (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onStart({ extraPractice: true })}
        >
          Хочу ещё
        </button>
      ) : nothingDue ? (
        <p className="small muted" style={{ textAlign: "center" }}>
          Пройди первую ситуацию — после неё здесь появятся фразы для
          повторения.
        </p>
      ) : null}
    </section>
  );
}

function ReviewDone({
  result,
  onClose,
}: {
  result: ReviewResultDTO;
  onClose: () => void;
}) {
  return (
    <section className="stack-lg">
      <header className="stack-sm">
        <span className="eyebrow muted">Повторение</span>
        <h1 className="h1">Готово</h1>
      </header>

      <div className="panel stack-sm">
        <p className="body">
          Повторено {result.reviewed}, верно {result.correctCount}.
        </p>
        {result.consolidated.length > 0 ? (
          <p className="small" style={{ color: "var(--accent-ink)" }}>
            Этот язык остался с тобой надолго — он перешёл в «закреплено».
          </p>
        ) : (
          <p className="small muted">
            Что не далось — вернётся завтра. Это нормальная часть запоминания.
          </p>
        )}
      </div>

      {result.rewards.length > 0 ? (
        <div className="stack-sm">
          <span className="eyebrow muted">В твоём уголке появилось</span>
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

      <Button onClick={onClose}>На главную</Button>
    </section>
  );
}
