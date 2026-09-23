import { useEffect, useState } from "react";
import type { ActivityViewProps } from "./ActivityRenderer.tsx";

interface Props extends ActivityViewProps {
  content: { tokens: string[] };
}

/**
 * Tap-to-build ordering. The built sentence is pushed up as the answer,
 * so the session's single bottom CTA stays the only action — and it only
 * enables once every word has been used.
 */
export function SentenceBuild({ content, onAnswerChange, disabled }: Props) {
  const [built, setBuilt] = useState<string[]>([]);
  const [bank, setBank] = useState<string[]>(content.tokens);

  useEffect(() => {
    // Only a full sentence counts as an answer — a partial build keeps the
    // Check action disabled, matching how the engine grades it.
    onAnswerChange(bank.length === 0 ? built.join(" ") : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built, bank]);

  function place(index: number) {
    if (disabled) return;
    const token = bank[index];
    if (token === undefined) return;
    setBuilt([...built, token]);
    setBank(bank.filter((_, i) => i !== index));
  }

  function unplace(index: number) {
    if (disabled) return;
    const token = built[index];
    if (token === undefined) return;
    setBank([...bank, token]);
    setBuilt(built.filter((_, i) => i !== index));
  }

  return (
    <div className="stack">
      <div className="prompt">
        <span className="prompt__kicker">Собери предложение</span>
        <h1 className="prompt__text">Поставь слова в правильном порядке</h1>
      </div>

      <div className="build-target">
        {built.length === 0 ? (
          <span className="small muted">Нажимай на слова ниже по порядку</span>
        ) : (
          built.map((token, i) => (
            <button
              key={`${token}-${i}`}
              type="button"
              className="token token--placed"
              disabled={disabled}
              onClick={() => unplace(i)}
            >
              {token}
            </button>
          ))
        )}
      </div>

      <div className="build-bank">
        {bank.map((token, i) => (
          <button
            key={`${token}-${i}`}
            type="button"
            className="token"
            disabled={disabled}
            onClick={() => place(i)}
          >
            {token}
          </button>
        ))}
      </div>

      <p className="caption muted num">
        {built.length} / {content.tokens.length} слов
      </p>
    </div>
  );
}
