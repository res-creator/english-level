interface Props {
  content: {
    displayForm: string;
    translation: string;
    ipa: string | null;
    example: string | null;
    pattern: string | null;
  };
  disabled: boolean;
  onContinue: () => void;
}

/** Not a scored exercise — just shows the new word and waits for Continue. */
export function InfoCard({ content, disabled, onContinue }: Props) {
  return (
    <section className="activity-card">
      <p className="onboarding-progress">New word</p>
      <h1>{content.displayForm}</h1>
      {content.ipa && <p className="activity-ipa">/{content.ipa}/</p>}
      <p>{content.translation}</p>
      {content.example && (
        <div className="placement-passage">
          <em>{content.example}</em>
        </div>
      )}
      {content.pattern && (
        <p className="onboarding-progress">{content.pattern}</p>
      )}
      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          disabled={disabled}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
