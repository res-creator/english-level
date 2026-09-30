import { useMemo } from "react";
import type { ActivityDTO, AnswerFeedback } from "@english-level/contracts";
import { translatePrompt } from "../lessonEngine/promptTranslations.ts";
import { grammarDisplayTitle } from "../lessonEngine/grammarPresentation.ts";

/**
 * The sheet under the scene: the only part of the screen that changes
 * between activities.
 *
 * Russian asks the question, English is what you say — and the serif
 * carries every word of it, so the two never blur together. The engine
 * decides what to ask; this decides only how it looks.
 */
interface Props {
  activity: ActivityDTO;
  answer: string;
  onAnswerChange: (value: string) => void;
  feedback: AnswerFeedback | null;
  disabled: boolean;
  /** Situational nudge shown above the task, e.g. «Ты спешишь». */
  context?: string | null;
}

export function ActivityPanel({
  activity,
  answer,
  onAnswerChange,
  feedback,
  disabled,
  context,
}: Props) {
  switch (activity.kind) {
    case "info_card":
      return (
        <>
          <span className="overline">Новое выражение</span>
          <h2 className="task-sheet__title en">
            {activity.content.displayForm}
          </h2>
          <p className="body">{activity.content.translation}</p>
          {activity.content.example ? (
            <p className="example en">{activity.content.example}</p>
          ) : null}
        </>
      );

    case "grammar_card":
      return (
        <>
          <span className="overline">Пауза на правило</span>
          <h2 className="task-sheet__title">
            {grammarDisplayTitle(activity.content.title)}
          </h2>
          {activity.content.formula ? (
            <p className="example en">{activity.content.formula}</p>
          ) : null}
          <p className="body muted">{activity.content.explanation}</p>
        </>
      );

    case "multiple_choice":
    case "fill_gap_choice":
      return (
        <>
          {context ? <p className="context-chip">{context}</p> : null}
          <h2 className="task-sheet__title">
            {translatePrompt(activity.prompt)}
          </h2>
          {activity.kind === "fill_gap_choice" ? (
            <p className="sentence-line en">
              {activity.content.sentence.replace(/_{2,}/g, "  ___  ")}
            </p>
          ) : null}
          {activity.kind === "multiple_choice" &&
          activity.targetType === "grammar_pattern" ? (
            // A grammar check's prompt never quotes its own example (a
            // vocabulary check's always does) — without this, "what's
            // the rule here?" pointed at nothing on screen and read as a
            // question about the scene's dialogue instead, which is
            // genuinely ambiguous whenever that dialogue has more than
            // one construction in it.
            <p className="sentence-line en">{activity.content.text}</p>
          ) : null}
          <div className="stack-sm">
            {activity.options.map((option) => (
              <AnswerRow
                key={option.id}
                text={option.text}
                english
                state={choiceState(option.id, option.text, answer, feedback)}
                disabled={disabled}
                onPick={() => onAnswerChange(option.id)}
              />
            ))}
          </div>
        </>
      );

    case "typed_recall":
      return (
        <>
          {context ? <p className="context-chip">{context}</p> : null}
          <h2 className="task-sheet__title">
            {translatePrompt(activity.prompt)}
          </h2>
          <p className="body muted">{activity.content.text}</p>
          <input
            className={
              feedback
                ? feedback.correct
                  ? "answer-input is-correct en"
                  : "answer-input is-wrong en"
                : "answer-input en"
            }
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="Твой ответ"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Твой ответ"
          />
        </>
      );

    case "sentence_build":
      return (
        <SentenceBuilder
          tokens={activity.content.tokens}
          answer={answer}
          onAnswerChange={onAnswerChange}
          disabled={disabled}
          context={context}
        />
      );
  }
}

type RowState = "idle" | "picked" | "correct" | "wrong";

function choiceState(
  optionId: string,
  optionText: string,
  answer: string,
  feedback: AnswerFeedback | null,
): RowState {
  if (!feedback) return optionId === answer ? "picked" : "idle";
  // The right answer is always shown, including when the learner missed
  // it — the point is to learn it, not to be marked down.
  if (!feedback.correct && optionText === feedback.correctAnswer)
    return "correct";
  if (optionId === answer) return feedback.correct ? "correct" : "wrong";
  return "idle";
}

function AnswerRow({
  text,
  state,
  disabled,
  onPick,
  english = false,
}: {
  text: string;
  state: RowState;
  disabled: boolean;
  onPick: () => void;
  english?: boolean;
}) {
  const modifier =
    state === "idle"
      ? ""
      : state === "picked"
        ? " answer--picked"
        : state === "correct"
          ? " answer--correct"
          : " answer--wrong";
  return (
    <button
      type="button"
      className={"answer" + modifier}
      disabled={disabled}
      onClick={onPick}
    >
      <span className="answer__mark" aria-hidden="true" />
      <span className="answer__body">
        <span className={english ? "answer__text en" : "answer__text"}>
          {text}
        </span>
      </span>
    </button>
  );
}

/** Tap words in order; tap a placed word to take it back. */
function SentenceBuilder({
  tokens,
  answer,
  onAnswerChange,
  disabled,
  context,
}: {
  tokens: string[];
  answer: string;
  onAnswerChange: (value: string) => void;
  disabled: boolean;
  context?: string | null;
}) {
  const placed = useMemo(
    () => (answer.trim().length === 0 ? [] : answer.trim().split(/\s+/)),
    [answer],
  );

  const remaining = useMemo(() => {
    const pool = [...tokens];
    for (const word of placed) {
      const at = pool.indexOf(word);
      if (at >= 0) pool.splice(at, 1);
    }
    return pool;
  }, [tokens, placed]);

  return (
    <>
      {context ? <p className="context-chip">{context}</p> : null}
      <span className="overline">Собери ответ</span>

      <div className={placed.length ? "build-line" : "build-line is-empty"}>
        {placed.length ? (
          placed.map((word, i) => (
            <button
              key={`${word}-${i}`}
              type="button"
              className="word word--placed"
              disabled={disabled}
              onClick={() =>
                onAnswerChange(
                  placed.filter((_, index) => index !== i).join(" "),
                )
              }
            >
              <span className="en">{word}</span>
            </button>
          ))
        ) : (
          <span className="build-line__hint">Нажимай слова по порядку</span>
        )}
      </div>

      <div className="word-bank">
        {remaining.map((word, i) => (
          <button
            key={`${word}-${i}`}
            type="button"
            className="word"
            disabled={disabled}
            onClick={() => onAnswerChange([...placed, word].join(" ").trim())}
          >
            <span className="en">{word}</span>
          </button>
        ))}
      </div>
    </>
  );
}
