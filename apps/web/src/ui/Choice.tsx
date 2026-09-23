import type { ReactNode } from "react";

export type ChoiceState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

const STATE_CLASS: Record<ChoiceState, string> = {
  idle: "",
  selected: " is-selected",
  correct: " is-correct",
  wrong: " is-wrong",
  dimmed: " is-dimmed",
};

const MARK: Record<ChoiceState, string> = {
  idle: "",
  selected: "✓",
  correct: "✓",
  wrong: "✕",
  dimmed: "",
};

/**
 * One tappable answer/option row — the single control shared by
 * onboarding, placement and every scored activity, so a "choice" always
 * looks and behaves the same across the product.
 */
export function Choice({
  state = "idle",
  onClick,
  disabled,
  children,
  hint,
  showMark = true,
}: {
  state?: ChoiceState;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  hint?: ReactNode;
  showMark?: boolean;
}) {
  return (
    <button
      type="button"
      className={"choice" + STATE_CLASS[state]}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === "selected"}
    >
      <span className="choice__text">{children}</span>
      {hint ? <span className="choice__hint">{hint}</span> : null}
      {showMark ? (
        <span className="choice__mark" aria-hidden="true">
          {MARK[state]}
        </span>
      ) : null}
    </button>
  );
}
