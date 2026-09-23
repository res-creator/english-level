/**
 * Hand-authored inline SVG art for Speak in English — organic shapes,
 * soft green/blush palette, editorial rather than cartoonish. Inline so
 * the app ships no binary assets and every mark inherits design tokens.
 */

export function WelcomeArt() {
  return (
    <svg
      viewBox="0 0 320 240"
      role="img"
      aria-label="Иллюстрация: короткий урок английского в Telegram"
      style={{ width: "100%", maxWidth: 320, height: "auto" }}
    >
      <ellipse cx="168" cy="132" rx="118" ry="102" fill="#E2F3EA" />
      <path
        d="M52 168c-16-30-6-70 22-88 26-17 44 2 68-12 26-15 58-8 70 16 12 25-4 44 4 66 9 24-10 46-38 48-40 3-108 2-126-30z"
        fill="#FDEEF2"
      />
      <g>
        <rect x="74" y="58" width="150" height="92" rx="26" fill="#FFFDFA" />
        <path d="M108 148l-4 26 30-20z" fill="#FFFDFA" />
        <text
          x="149"
          y="114"
          textAnchor="middle"
          fontFamily="Manrope, sans-serif"
          fontSize="40"
          fontWeight="800"
          fill="#1D6146"
          letterSpacing="-1"
        >
          Hello!
        </text>
      </g>
      <g fill="#4AAD83">
        <path d="M244 82c14-6 30 0 34 12-14 8-30 4-34-12z" />
        <path d="M244 82c-2-15 8-28 21-29 4 14-6 27-21 29z" />
      </g>
      <circle cx="58" cy="76" r="9" fill="#EDA0B4" />
      <circle cx="262" cy="176" r="12" fill="#8FD0B1" />
      <circle cx="40" cy="132" r="5" fill="#C7E8D6" />
      <circle cx="232" cy="46" r="6" fill="#F6C3D0" />
      <rect
        x="96"
        y="180"
        width="128"
        height="14"
        rx="7"
        fill="#C7E8D6"
        opacity="0.9"
      />
      <rect x="124" y="204" width="72" height="12" rx="6" fill="#FBDDE5" />
    </svg>
  );
}

/** Decorative mark for the green Today hero — light-on-green. */
export function HeroArt() {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" style={{ width: "100%" }}>
      <circle cx="104" cy="56" r="52" fill="#FFFDFA" opacity="0.12" />
      <circle cx="132" cy="112" r="30" fill="#FFFDFA" opacity="0.1" />
      <g opacity="0.5">
        <path
          d="M118 44c12-5 26 0 29 11-12 7-26 3-29-11z"
          fill="#FFFDFA"
          opacity="0.55"
        />
        <path
          d="M118 44c-2-13 7-24 18-25 3 12-5 23-18 25z"
          fill="#FFFDFA"
          opacity="0.75"
        />
      </g>
      <circle cx="74" cy="92" r="6" fill="#FFFDFA" opacity="0.45" />
      <circle cx="140" cy="30" r="4" fill="#FFFDFA" opacity="0.4" />
    </svg>
  );
}

const UNIT_SCENES = [
  // Unit 1 — introductions: two overlapping speech bubbles
  <g key="a">
    <circle cx="26" cy="26" r="24" fill="#C7E8D6" />
    <rect x="10" y="14" width="26" height="19" rx="8" fill="#FFFDFA" />
    <path d="M16 33l-2 7 9-5z" fill="#FFFDFA" />
    <rect x="22" y="24" width="22" height="16" rx="7" fill="#2E9068" />
  </g>,
  // Unit 2 — daily life: sun over a horizon
  <g key="b">
    <circle cx="26" cy="26" r="24" fill="#FBDDE5" />
    <circle cx="26" cy="22" r="10" fill="#EDA0B4" />
    <rect x="6" y="32" width="40" height="6" rx="3" fill="#FFFDFA" />
    <rect x="12" y="41" width="28" height="5" rx="2.5" fill="#FFFDFA" />
  </g>,
  // Unit 3 — people: three dots in a group
  <g key="c">
    <circle cx="26" cy="26" r="24" fill="#C7E8D6" />
    <circle cx="18" cy="21" r="7" fill="#FFFDFA" />
    <circle cx="33" cy="21" r="7" fill="#2E9068" />
    <path d="M8 40c2-7 8-11 14-11s12 4 14 11z" fill="#FFFDFA" />
  </g>,
];

export function UnitScene({ index }: { index: number }) {
  const scene = UNIT_SCENES[index % UNIT_SCENES.length];
  return (
    <svg viewBox="0 0 52 52" aria-hidden="true" style={{ width: "100%" }}>
      {scene}
    </svg>
  );
}

/** Lesson-type cover art, echoing the welcome composition at small size. */
export function LessonCoverArt({ type }: { type: string }) {
  if (type === "grammar") {
    return (
      <svg viewBox="0 0 150 150" aria-hidden="true" style={{ width: "100%" }}>
        <circle cx="86" cy="58" r="52" fill="#FFFDFA" opacity="0.6" />
        <rect x="52" y="40" width="70" height="14" rx="7" fill="#8FD0B1" />
        <rect x="52" y="62" width="48" height="14" rx="7" fill="#C7E8D6" />
        <rect x="52" y="84" width="60" height="14" rx="7" fill="#F6C3D0" />
        <circle cx="132" cy="106" r="9" fill="#4AAD83" />
      </svg>
    );
  }
  if (type === "checkpoint") {
    return (
      <svg viewBox="0 0 150 150" aria-hidden="true" style={{ width: "100%" }}>
        <circle cx="84" cy="62" r="54" fill="#FFFDFA" opacity="0.65" />
        <path
          d="M84 30l9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3z"
          fill="#4AAD83"
        />
        <circle cx="126" cy="112" r="8" fill="#EDA0B4" />
      </svg>
    );
  }
  if (type === "mixed" || type === "practice") {
    return (
      <svg viewBox="0 0 150 150" aria-hidden="true" style={{ width: "100%" }}>
        <circle cx="86" cy="58" r="52" fill="#FFFDFA" opacity="0.6" />
        <circle cx="66" cy="52" r="20" fill="#C7E8D6" />
        <circle cx="98" cy="70" r="26" fill="#F6C3D0" opacity="0.85" />
        <circle cx="124" cy="40" r="9" fill="#4AAD83" />
      </svg>
    );
  }
  // vocabulary / reading / default — speech bubble with "Aa"
  return (
    <svg viewBox="0 0 150 150" aria-hidden="true" style={{ width: "100%" }}>
      <circle cx="84" cy="58" r="52" fill="#FFFDFA" opacity="0.6" />
      <rect x="48" y="32" width="78" height="54" rx="20" fill="#FFFDFA" />
      <path d="M64 84l-4 18 20-13z" fill="#FFFDFA" />
      <text
        x="87"
        y="68"
        textAnchor="middle"
        fontFamily="Manrope, sans-serif"
        fontSize="26"
        fontWeight="800"
        fill="#1D6146"
      >
        Aa
      </text>
      <circle cx="128" cy="104" r="9" fill="#EDA0B4" />
    </svg>
  );
}

/** Completion mark — calm, adult, no confetti. */
export function ResultArt({ accuracy }: { accuracy: number }) {
  const tone = accuracy >= 70 ? "#2E9068" : "#4AAD83";
  return (
    <svg
      viewBox="0 0 160 120"
      aria-hidden="true"
      style={{ width: 180, height: "auto" }}
    >
      <ellipse cx="80" cy="66" rx="66" ry="50" fill="#E2F3EA" />
      <ellipse cx="108" cy="42" rx="30" ry="26" fill="#FDEEF2" />
      <circle cx="80" cy="60" r="30" fill={tone} />
      <path
        d="M67 60l9 10 18-21"
        fill="none"
        stroke="#FFFDFA"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="38" r="7" fill="#8FD0B1" />
      <circle cx="140" cy="86" r="6" fill="#EDA0B4" />
      <circle cx="36" cy="94" r="4" fill="#F6C3D0" />
    </svg>
  );
}

/** Level mark used on the placement result. */
export function LevelMark({ level }: { level: string }) {
  return (
    <svg
      viewBox="0 0 140 140"
      role="img"
      aria-label={`Уровень ${level}`}
      style={{ width: 150, height: "auto" }}
    >
      <path
        d="M70 6c30 0 58 22 62 50 4 30-16 58-46 72-26 12-56 0-72-24C-2 80 4 46 26 24 38 12 52 6 70 6z"
        fill="#E2F3EA"
      />
      <path
        d="M70 20c24 0 46 18 49 40 3 24-13 46-37 57-20 10-44 0-57-19-12-19-8-46 9-64 10-10 21-14 36-14z"
        fill="#2E9068"
      />
      <text
        x="70"
        y="88"
        textAnchor="middle"
        fontFamily="Manrope, sans-serif"
        fontSize="46"
        fontWeight="800"
        fill="#FFFDFA"
        letterSpacing="-2"
      >
        {level}
      </text>
    </svg>
  );
}
