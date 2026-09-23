import type { ActivityOptionDTO } from "@english-level/contracts";
import { Choice, type ChoiceState } from "../../ui/Choice.tsx";
import { translatePrompt } from "../promptTranslations.ts";
import type { ActivityViewProps } from "./ActivityRenderer.tsx";

interface Props extends ActivityViewProps {
  kicker: string;
  prompt: string;
  options: ActivityOptionDTO[];
  /** Plain context line (multiple choice) */
  context?: string;
  /** Sentence with a ___ gap (fill gap) */
  sentence?: string;
}

/** Shared presentation for both option-based activity kinds: the prompt
 * reads as a question, the options read as tappable answers. */
export function ChoiceActivity({
  kicker,
  prompt,
  options,
  context,
  sentence,
  answer,
  onAnswerChange,
  feedback,
  disabled,
}: Props) {
  function stateFor(option: ActivityOptionDTO): ChoiceState {
    if (feedback) {
      if (!feedback.correct && option.text === feedback.correctAnswer) {
        return "correct";
      }
      if (feedback.correct && option.id === answer) return "correct";
      if (option.id === answer) return "wrong";
      return "dimmed";
    }
    return option.id === answer ? "selected" : "idle";
  }

  return (
    <div className="stack">
      <div className="prompt">
        <span className="prompt__kicker">{kicker}</span>
        <h1 className="prompt__text">{translatePrompt(prompt)}</h1>
      </div>

      {sentence ? (
        <p className="sentence-frame">{renderGap(sentence)}</p>
      ) : context ? (
        <p className="sentence-frame">{context}</p>
      ) : null}

      <div className="stack" style={{ gap: "var(--s3)" }}>
        {options.map((option) => (
          <Choice
            key={option.id}
            state={stateFor(option)}
            disabled={disabled}
            onClick={() => onAnswerChange(option.id)}
          >
            {option.text}
          </Choice>
        ))}
      </div>
    </div>
  );
}

/** The engine masks the target word as "___" — show it as a real blank. */
function renderGap(sentence: string) {
  const parts = sentence.split("___");
  if (parts.length === 1) return sentence;
  return parts.flatMap((part, i) =>
    i === parts.length - 1
      ? [part]
      : [part, <mark key={i}>&nbsp;&nbsp;&nbsp;&nbsp;</mark>],
  );
}
