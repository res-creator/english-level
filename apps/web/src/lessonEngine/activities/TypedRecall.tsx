import { translatePrompt } from "../promptTranslations.ts";
import type { ActivityViewProps } from "./ActivityRenderer.tsx";

interface Props extends ActivityViewProps {
  prompt: string;
  content: { text: string };
}

export function TypedRecall({
  prompt,
  content,
  answer,
  onAnswerChange,
  feedback,
  disabled,
}: Props) {
  const tone = feedback
    ? feedback.correct
      ? "var(--green-500)"
      : "var(--blush-400)"
    : undefined;

  return (
    <div className="stack">
      <div className="prompt">
        <span className="prompt__kicker">Напиши по-английски</span>
        <h1 className="prompt__text">{translatePrompt(prompt)}</h1>
      </div>

      <p className="sentence-frame">{content.text}</p>

      <input
        type="text"
        className="text-field"
        style={tone ? { borderColor: tone } : undefined}
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={disabled}
        placeholder="Твой ответ"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
