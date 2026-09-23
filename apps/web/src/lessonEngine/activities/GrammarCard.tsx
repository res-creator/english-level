interface Props {
  content: {
    title: string;
    formula: string | null;
    explanation: string;
  };
}

/** A grammar pattern, explained before it is practised. Not scored. */
export function GrammarCard({ content }: Props) {
  return (
    <div className="stack">
      <span className="prompt__kicker">Правило</span>
      <h1 className="prompt__text">{content.title}</h1>
      {content.formula ? (
        <div className="formula">{content.formula}</div>
      ) : null}
      <p className="body">{content.explanation}</p>
    </div>
  );
}
