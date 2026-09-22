import { useState } from "react";

interface Props {
  prompt: string;
  content: { text: string };
  disabled: boolean;
  onSubmit: (answer: string) => void;
}

export function TypedRecall({ prompt, content, disabled, onSubmit }: Props) {
  const [value, setValue] = useState("");

  return (
    <section className="activity-card">
      <p className="onboarding-progress">{content.text}</p>
      <h1>{prompt}</h1>
      <input
        type="text"
        className="text-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer"
        autoCapitalize="off"
        autoCorrect="off"
      />
      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          disabled={disabled || !value.trim()}
          onClick={() => onSubmit(value)}
        >
          Check
        </button>
      </div>
    </section>
  );
}
