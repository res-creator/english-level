import { useState } from "react";

interface Props {
  prompt: string;
  content: { tokens: string[] };
  disabled: boolean;
  onSubmit: (answer: string) => void;
}

/** Tap-to-build ordering — no drag-and-drop library. Tapping a word in the
 * bank moves it into the built sentence; tapping a placed word removes it. */
export function SentenceBuild({ prompt, content, disabled, onSubmit }: Props) {
  const [built, setBuilt] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>(content.tokens);

  function place(index: number) {
    if (disabled) return;
    const token = remaining[index];
    if (token === undefined) return;
    setBuilt([...built, token]);
    setRemaining(remaining.filter((_, i) => i !== index));
  }

  function unplace(index: number) {
    if (disabled) return;
    const token = built[index];
    if (token === undefined) return;
    setRemaining([...remaining, token]);
    setBuilt(built.filter((_, i) => i !== index));
  }

  return (
    <section className="activity-card">
      <h1>{prompt}</h1>
      <div className="sentence-build-target">
        {built.length === 0 && (
          <span className="onboarding-progress">
            Tap the words below, in order.
          </span>
        )}
        {built.map((token, i) => (
          <button
            key={i}
            type="button"
            className="sentence-token sentence-token--placed"
            disabled={disabled}
            onClick={() => unplace(i)}
          >
            {token}
          </button>
        ))}
      </div>
      <div className="sentence-build-bank">
        {remaining.map((token, i) => (
          <button
            key={i}
            type="button"
            className="sentence-token"
            disabled={disabled}
            onClick={() => place(i)}
          >
            {token}
          </button>
        ))}
      </div>
      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          disabled={disabled || built.length === 0}
          onClick={() => onSubmit(built.join(" "))}
        >
          Check
        </button>
      </div>
    </section>
  );
}
