interface Props {
  content: {
    title: string;
    formula: string | null;
    explanation: string;
  };
  disabled: boolean;
  onContinue: () => void;
}

/** Not a scored exercise — shows the pattern, then "Try it" leads into a
 * scored recognition check. */
export function GrammarCard({ content, disabled, onContinue }: Props) {
  return (
    <section className="activity-card">
      <p className="onboarding-progress">Grammar</p>
      <h1>{content.title}</h1>
      {content.formula && (
        <div className="placement-passage">
          <strong>{content.formula}</strong>
        </div>
      )}
      <p>{content.explanation}</p>
      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          disabled={disabled}
          onClick={onContinue}
        >
          Try it
        </button>
      </div>
    </section>
  );
}
