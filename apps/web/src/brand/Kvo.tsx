/**
 * Kvo — the companion.
 *
 * The body is a speech bubble with a tail; the ears are two quotation
 * marks, because Kvo catches what you haven't managed to say yet. Calm,
 * attentive, never hurries you.
 *
 * Two approved variants:
 *  - B ("full") — the one used inside screens: smaller eyes, light brows,
 *    a restrained smile, thinner arms.
 *  - C ("glyph") — flat, no gradients, for icons and anything small; it
 *    stays readable down to 32px.
 *
 * Three states, and all three are about *you*: рядом (beside you),
 * думает (thinking with you), радуется (glad for you). There is
 * deliberately no hungry, sad or neglected state — a companion that can
 * be neglected becomes a source of guilt.
 */
import { Art } from "./Art.tsx";
import { artName } from "./artRegistry.ts";

export type KvoState = "idle" | "thinking" | "happy";
export type KvoVariant = "full" | "glyph";

interface Props {
  size?: number;
  state?: KvoState;
  variant?: KvoVariant;
  /** Mirrors Kvo so he can lean in from the right-hand edge. */
  flip?: boolean;
  title?: string;
}

/**
 * Kvo, as the product sees him: real illustration when it exists, the
 * coded drawing below when it doesn't. Callers never know which they got.
 */
export function Kvo(props: Props) {
  const {
    size = 120,
    state = "idle",
    variant = "full",
    flip = false,
    title,
  } = props;
  return (
    <Art
      name={artName.kvo(variant, state)}
      alt={title ?? ""}
      width={size}
      height={size}
      fit="contain"
      priority
      style={{
        width: size,
        height: size,
        transform: flip ? "scaleX(-1)" : undefined,
      }}
      fallback={<KvoGlyph {...props} />}
    />
  );
}

/** The coded placeholder. Deliberately simple — it exists so a screen is
 * never empty, not to compete with real artwork. */
function KvoGlyph({
  size = 120,
  state = "idle",
  variant = "full",
  flip = false,
  title,
}: Props) {
  const id = `kvo-${variant}-${state}-${flip ? "r" : "l"}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      {variant === "full" ? (
        <defs>
          <radialGradient id={`${id}-body`} cx="38%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#f4f0ff" />
            <stop offset="100%" stopColor="#ddd2fb" />
          </radialGradient>
          <linearGradient id={`${id}-ear`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b6bf3" />
            <stop offset="100%" stopColor="#5b2fe0" />
          </linearGradient>
        </defs>
      ) : null}

      {/* Ears: two quotation marks. */}
      <Ear cx={46} variant={variant} gradient={`${id}-ear`} />
      <Ear cx={68} variant={variant} gradient={`${id}-ear`} />

      {/* Arms, behind the body so they read as tucked in. */}
      {variant === "full" ? (
        <>
          <ellipse cx="27" cy="74" rx="6.5" ry="9" fill="#e6dcfb" />
          <ellipse
            cx="94"
            cy={state === "happy" ? 60 : 70}
            rx="7"
            ry="10"
            fill="#eee8fd"
            transform={state === "happy" ? "rotate(-18 94 60)" : undefined}
          />
        </>
      ) : null}

      {/* Body: a speech bubble. */}
      <path
        d="M60 26c19.3 0 34 13.6 34 32 0 12.4-6.7 22.6-17.4 27.9L60 104l-4.3-15.2C40 86.3 26 74.6 26 58c0-18.4 14.7-32 34-32z"
        fill={variant === "full" ? `url(#${id}-body)` : "#ffffff"}
      />

      {variant === "full" ? (
        <path
          d="M84 44c5.6 7.4 6.4 18.6 1.6 27.4"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".75"
        />
      ) : null}

      <Face state={state} variant={variant} />
    </svg>
  );
}

function Ear({
  cx,
  variant,
  gradient,
}: {
  cx: number;
  variant: KvoVariant;
  gradient: string;
}) {
  const fill = variant === "full" ? `url(#${gradient})` : "#5b2fe0";
  return (
    <path
      d={`M${cx} 6c5 0 9 4 9 9 0 6.4-4.6 11.4-9.6 14.2-1.3.7-2.6-.8-1.8-2 1.6-2.4 2.6-4.6 2.8-6.6C${cx - 4.6} 20 ${cx - 9} 19.6 ${cx - 9} 15c0-5 4-9 9-9z`}
      fill={fill}
    />
  );
}

function Face({ state, variant }: { state: KvoState; variant: KvoVariant }) {
  const eye = "#17121f";
  if (state === "happy") {
    // Eyes closed in a glad squint — the only state with no pupils.
    return (
      <g>
        <path
          d="M45 58c2.4-3.2 6.6-3.2 9 0"
          stroke={eye}
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M66 58c2.4-3.2 6.6-3.2 9 0"
          stroke={eye}
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
        {variant === "full" ? <Cheeks /> : null}
        <path
          d="M52 68c4.6 5.2 11.4 5.2 16 0"
          stroke={eye}
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  return (
    <g>
      {variant === "full" ? (
        <>
          <path
            d="M44 48.5c2.6-1.6 6.2-1.6 8.8 0"
            stroke="#8b6bf3"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M67.2 48.5c2.6-1.6 6.2-1.6 8.8 0"
            stroke="#8b6bf3"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : null}
      <ellipse cx="49.5" cy="59" rx="4.6" ry="5.4" fill={eye} />
      <ellipse cx="70.5" cy="59" rx="4.6" ry="5.4" fill={eye} />
      <circle cx="51.2" cy="57" r="1.7" fill="#ffffff" />
      <circle cx="72.2" cy="57" r="1.7" fill="#ffffff" />
      {variant === "full" ? <Cheeks /> : null}
      {state === "thinking" ? (
        <ellipse cx="60" cy="70" rx="3.4" ry="4" fill={eye} />
      ) : (
        <path
          d="M53 69c3.8 4.4 10.2 4.4 14 0"
          stroke={eye}
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
}

function Cheeks() {
  return (
    <g fill="#ffc9b4" opacity=".85">
      <ellipse cx="40" cy="67" rx="5.4" ry="3.2" />
      <ellipse cx="80" cy="67" rx="5.4" ry="3.2" />
    </g>
  );
}

/** The app-icon lock-up: variant C on a violet tile. */
export function KvoBadge({ size = 36 }: { size?: number }) {
  return (
    <span
      className="kvo-badge"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      <Kvo size={size * 0.78} variant="glyph" />
    </span>
  );
}
