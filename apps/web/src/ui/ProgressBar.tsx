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
