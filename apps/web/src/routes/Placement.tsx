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
  | { view: "error"; message: string };

export function Placement() {
  const navigate = useNavigate();
  const [state, setState] = useState<ViewState>({ view: "loading" });
  const [selected, setSelected] = useState<string>("");
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
          setSelected("");
          setStartedAt(Date.now());
        } else {
          setState({ view: "intro" });
        }
      })
      .catch((err) => {
        if (!cancelled)
          setState({ view: "error", message: (err as Error).message });
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
      setSelected("");
      setStartedAt(Date.now());
    } catch (err) {
      setState({ view: "error", message: (err as Error).message });
    }
  }

  async function handleSubmit() {
    if (state.view !== "question" || !selected) return;
    const { attemptId, question } = state;
    setState({ ...state, submitting: true, error: null });

    try {
      const res = await answerPlacement(attemptId, {
        questionId: question.id,
        answer: selected,
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
      setSelected("");
      setStartedAt(Date.now());
    } catch (err) {
      setState({ ...state, submitting: false, error: (err as Error).message });
    }
  }

  if (state.view === "loading") return <p>Loading…</p>;

  if (state.view === "error") {
    return (
      <section className="onboarding-screen">
        <p className="onboarding-error">{state.message}</p>
      </section>
    );
  }

  if (state.view === "intro") {
    return (
      <section className="onboarding-screen">
        <h1>Let's check your English level</h1>
        <p>
          This takes about 3–5 minutes, though it may be shorter or longer
          depending on your answers.
        </p>
        <p>
          We'll check vocabulary, grammar, reading, and everyday English. The
          questions get easier or harder based on how you answer.
        </p>
        <div className="onboarding-actions">
          <button
            type="button"
            className="button-primary"
            onClick={handleStart}
          >
            Start
          </button>
        </div>
      </section>
    );
  }

  const { question, progress, submitting, error } = state;
  const percent = Math.min(
    100,
    Math.round((progress.answered / progress.estimatedTotal) * 100),
  );

  return (
    <section className="onboarding-screen">
      <div className="placement-progress-track">
        <div
          className="placement-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>

      {question.passage && (
        <div className="placement-passage">{question.passage}</div>
      )}

      <h1>{question.prompt}</h1>

      {question.options ? (
        <div className="option-list">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              className={
                selected === option
                  ? "option-button option-button--selected"
                  : "option-button"
              }
              onClick={() => setSelected(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          className="text-input"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="Type your answer"
          autoCapitalize="off"
          autoCorrect="off"
        />
      )}

      {error && <p className="onboarding-error">{error}</p>}

      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          disabled={!selected.trim() || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Checking…" : "Continue"}
        </button>
      </div>
    </section>
  );
}
