import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  PlacementProgress,
  PlacementQuestionDTO,
} from "@english-level/contracts";
import {
  startPlacement,
  getCurrentPlacement,
  answerPlacement,
} from "../placement/placementClient.ts";
import { FocusShell } from "../components/Layout.tsx";
import { Button, IconButton } from "../ui/Button.tsx";
import { Choice } from "../ui/Choice.tsx";
import { StepProgress } from "../ui/ProgressBar.tsx";
import { LoadingScreen, ErrorState } from "../ui/states.tsx";
import { IconArrowLeft } from "../ui/icons.tsx";
import { LevelMark } from "../brand/illustrations.tsx";

type ViewState =
  | { view: "loading" }
  | { view: "intro" }
  | {
      view: "question";
      attemptId: string;
      question: PlacementQuestionDTO;
      progress: PlacementProgress;
      submitting: boolean;
      error: string | null;
    }
  | { view: "error" };

export function Placement() {
  const navigate = useNavigate();
  const [state, setState] = useState<ViewState>({ view: "loading" });
  const [answer, setAnswer] = useState<string>("");
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    getCurrentPlacement()
      .then((current) => {
        if (cancelled) return;
        if (current.status === "completed") {
          navigate(`/placement/result/${current.attemptId}`, { replace: true });
        } else if (current.status === "in_progress") {
          setState({
            view: "question",
            attemptId: current.attemptId,
            question: current.question,
            progress: current.progress,
            submitting: false,
            error: null,
          });
          setAnswer("");
          setStartedAt(Date.now());
        } else {
          setState({ view: "intro" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ view: "error" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStart() {
    setState({ view: "loading" });
    try {
      const started = await startPlacement();
      setState({
        view: "question",
        attemptId: started.attemptId,
        question: started.question,
        progress: started.progress,
        submitting: false,
        error: null,
      });
      setAnswer("");
      setStartedAt(Date.now());
    } catch {
      setState({ view: "error" });
    }
  }

  async function handleSubmit() {
    if (state.view !== "question" || !answer.trim()) return;
    const { attemptId, question } = state;
    setState({ ...state, submitting: true, error: null });

    try {
      const res = await answerPlacement(attemptId, {
        questionId: question.id,
        answer,
        responseTimeMs: Date.now() - startedAt,
      });
      if (res.status === "completed") {
        navigate(`/placement/result/${attemptId}`, { replace: true });
        return;
      }
      setState({
        view: "question",
        attemptId,
        question: res.question,
        progress: res.progress,
        submitting: false,
        error: null,
      });
      setAnswer("");
      setStartedAt(Date.now());
    } catch {
      setState({
        ...state,
        submitting: false,
        error: "Не удалось отправить ответ. Попробуй ещё раз.",
      });
    }
  }

  if (state.view === "loading") return <LoadingScreen />;

  if (state.view === "error") {
    return (
      <div className="center-screen">
        <ErrorState
          title="Тест сейчас недоступен"
          onRetry={() => navigate(0)}
        />
      </div>
    );
  }

  if (state.view === "intro") {
    return (
      <div className="center-screen has-blobs">
        <div
          className="blob blob-green"
          style={{ width: 250, height: 250, top: -100, left: -110 }}
        />
        <div
          className="blob blob-blush"
          style={{ width: 210, height: 210, bottom: -90, right: -90 }}
        />

        <LevelMark level="?" />
        <h1 className="h1">Определим твой уровень</h1>
        <p className="body muted" style={{ maxWidth: 330 }}>
          3–5 минут. Вопросы подстраиваются под ответы: станет легче или сложнее
          в зависимости от того, как ты отвечаешь.
        </p>
        <div
          className="row"
          style={{ justifyContent: "center", flexWrap: "wrap" }}
        >
          <span className="tag">Слова</span>
          <span className="tag">Грамматика</span>
          <span className="tag">Чтение</span>
          <span className="tag">Речь</span>
        </div>
        <div style={{ width: "100%", maxWidth: 320, paddingTop: "var(--s2)" }}>
          <Button onClick={handleStart}>Начать тест</Button>
        </div>
      </div>
    );
  }

  const { question, progress, submitting, error } = state;
  const answered = progress.answered;
  const estimated = Math.max(progress.estimatedTotal, answered + 1);

  return (
    <FocusShell
      top={
        <div className="session-top">
          <IconButton label="Выйти" onClick={() => navigate("/today")}>
            <IconArrowLeft size={20} />
          </IconButton>
          <div className="grow">
            <StepProgress filled={answered} total={estimated} />
          </div>
          <span className="session-count">
            {answered + 1} / ≈{estimated}
          </span>
        </div>
      }
      footer={
        <Button disabled={!answer.trim() || submitting} onClick={handleSubmit}>
          {submitting ? "Проверяем…" : "Ответить"}
        </Button>
      }
    >
      {question.passage ? (
        <div className="panel" style={{ whiteSpace: "pre-line" }}>
          <p className="body">{question.passage}</p>
        </div>
      ) : null}

      <div className="prompt">
        <span className="prompt__kicker">Вопрос</span>
        <h1 className="prompt__text">{question.prompt}</h1>
      </div>

      {question.options ? (
        <div className="stack">
          {question.options.map((option) => (
            <Choice
              key={option}
              state={answer === option ? "selected" : "idle"}
              onClick={() => setAnswer(option)}
              disabled={submitting}
            >
              {option}
            </Choice>
          ))}
        </div>
      ) : (
        <input
          type="text"
          className="text-field"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Твой ответ"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          disabled={submitting}
        />
      )}

      {error ? (
        <p className="small" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}
    </FocusShell>
  );
}
