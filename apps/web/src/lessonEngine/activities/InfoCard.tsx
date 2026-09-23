interface Props {
  content: {
    displayForm: string;
    translation: string;
    ipa: string | null;
    example: string | null;
    pattern: string | null;
  };
}

/** New vocabulary — not scored, just read and continue. */
export function InfoCard({ content }: Props) {
  return (
    <div className="stack">
      <span className="prompt__kicker">Новое слово</span>
      <div className="word-card">
        <span className="word-card__word">{content.displayForm}</span>
        {content.ipa ? (
          <span className="word-card__ipa">/{content.ipa}/</span>
        ) : null}
        <span className="word-card__translation">{content.translation}</span>
        {content.example ? (
          <p className="word-card__example">{content.example}</p>
        ) : null}
      </div>
      {content.pattern ? (
        <p className="small muted" style={{ textAlign: "center" }}>
          {content.pattern}
        </p>
      ) : null}
    </div>
  );
}
