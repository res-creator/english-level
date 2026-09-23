export function ProgressBar({
  percent,
  thin = false,
  onGreen = false,
}: {
  percent: number;
  thin?: boolean;
  onGreen?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={[
        "track",
        thin ? "track--thin" : "",
        onGreen ? "track--on-green" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="track__fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

/** Discrete steps — used where the total is known and small (onboarding),
 * or deliberately approximate (placement, where the total is an estimate). */
export function StepProgress({
  filled,
  total,
}: {
  filled: number;
  total: number;
}) {
  const safeTotal = Math.max(total, filled, 1);
  return (
    <div className="steps">
      {Array.from({ length: safeTotal }).map((_, i) => (
        <div
          key={i}
          className={i < filled ? "steps__item is-on" : "steps__item"}
        />
      ))}
    </div>
  );
}
