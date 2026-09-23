const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularProgress({
  percent,
  size = 132,
  label,
}: {
  percent: number;
  size?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 110 110"
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx="55"
          cy="55"
          r={RADIUS}
          fill="none"
          stroke="var(--cream-200)"
          strokeWidth="9"
        />
        <circle
          cx="55"
          cy="55"
          r={RADIUS}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className="ring__value"
        style={{ fontSize: Math.round(size * 0.24) }}
      >
        {label ?? `${clamped}%`}
      </span>
    </div>
  );
}
