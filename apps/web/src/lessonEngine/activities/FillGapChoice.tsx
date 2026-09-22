import { useState } from "react";
import type { ActivityOptionDTO } from "@english-level/contracts";

interface Props {
  prompt: string;
  content: { sentence: string };
  options: ActivityOptionDTO[];
  disabled: boolean;
  onSubmit: (answer: string) => void;
}

export function FillGapChoice({
  prompt,
  content,
  options,
  disabled,
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState<string>("");

  return (
    <section className="activity-card">
      <h1>{prompt}</h1>
      <div className="placement-passage">{content.sentence}</div>
      <div className="option-list">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={
              selected === option.id
                ? "option-button option-button--selected"
                : "option-button"
            }
            disabled={disabled}
            onClick={() => setSelected(option.id)}
          >
            {option.text}
          </button>
        ))}
      </div>
      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          disabled={disabled || !selected}
          onClick={() => onSubmit(selected)}
        >
          Check
        </button>
      </div>
    </section>
  );
}
