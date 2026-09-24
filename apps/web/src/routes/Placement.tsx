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
import { Kvo } from "../brand/Kvo.tsx";
import { Button, IconButton } from "../ui/Button.tsx";
import { LoadingScreen, ErrorState } from "../ui/states.tsx";
import { IconClose } from "../ui/icons.tsx";

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

/**
 * The test itself uses the same visual language as a real session —
 * top bar, one question, one action — because it *is* one: a short,
 * adaptive run through the same kind of activities the course will ask
 * for later. Kvo stands in for a mascot illustration that no longer
 * exists in this product; he's the one constant face across the whole
 * first-run flow, from the hook through the test to meeting him
 * properly afterwards.
 */
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
      <div className="hero-screen">
        <div className="hero-screen__stage">
          <div className="hero-screen__kvo">
            <Kvo size={200} state="thinking" title="Кво" />
          </div>
        </div>

        <div className="hero-screen__sheet">
          <div className="sheet-grabber" aria-hidden="true" />
          <h1 className="display">Определим твой уровень</h1>
          <p className="body muted">
            3–5 минут. Вопросы подстраиваются под ответы: станет легче или
            сложнее в зависимости от того, как ты отвечаешь.
          </p>
          <div className="row" style={{ flexWrap: "wrap", gap: "var(--s2)" }}>
            <span className="tag">Слова</span>
            <span className="tag">Грамматика</span>
            <span className="tag">Чтение</span>
            <span className="tag">Речь</span>
          </div>
          <div className="hero-screen__actions">
            <Button onClick={handleStart}>Начать тест</Button>
          </div>
        </div>
      </div>
    );
  }

  const { question, progress, submitting, error } = state;
  const answered = progress.answered;
  const estimated = Math.max(progress.estimatedTotal, answered + 1);

  return (
    <div className="lesson-screen">
      <div className="lesson-top">
        <IconButton label="Выйти" onClick={() => navigate("/today")}>
          <IconClose size={19} />
        </IconButton>
        <div className="seg-progress">
          {Array.from({ length: estimated }).map((_, i) => (
            <span key={i} className={i < answered ? "seg is-on" : "seg"} />
          ))}
        </div>
        <span className="lesson-top__label">
          {answered + 1} / ≈{estimated}
        </span>
      </div>

      {/* No scene here — the test isn't a situation, just questions, so
          the sheet sits directly under the top bar rather than riding
          over one. */}
      <div className="task-sheet" style={{ marginTop: 0 }}>
        {question.passage ? (
          <p className="sentence-line en" style={{ whiteSpace: "pre-line" }}>
            {question.passage}
          </p>
        ) : null}

        <h2 className="task-sheet__title">{question.prompt}</h2>

        {question.options ? (
          <div className="stack-sm">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                className={
                  "answer" + (answer === option ? " answer--picked" : "")
                }
                disabled={submitting}
                onClick={() => setAnswer(option)}
              >
                <span className="answer__body">
                  <span className="answer__text en">{option}</span>
                </span>
                <span className="answer__mark" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <input
            className="answer-input en"
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

        <div className="task-sheet__cta">
          <Button
            disabled={!answer.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Проверяем…" : "Ответить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
