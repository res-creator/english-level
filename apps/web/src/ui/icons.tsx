interface IconProps {
  size?: number;
}

function base(size = 22) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function IconToday({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3.6 4 9.2V20h5.6v-5.2h4.8V20H20V9.2z" />
    </svg>
  );
}

export function IconCourse({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="7" cy="6" r="2.4" />
      <circle cx="17" cy="12" r="2.4" />
      <circle cx="7" cy="18" r="2.4" />
      <path d="M9.4 6h2.6a2.6 2.6 0 0 1 2.6 2.6v.8M14.6 12H12a2.6 2.6 0 0 0-2.6 2.6v.8" />
    </svg>
  );
}

export function IconCheck({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m5 12.5 4.6 4.5L19 7" />
    </svg>
  );
}

export function IconClose({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconArrowLeft({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function IconArrowRight({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IconPlay({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M8 5.5v13l10-6.5z" fill="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconClock({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function IconStack({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="m12 4 8 4.2-8 4.2-8-4.2z" />
      <path d="m4 14 8 4.2 8-4.2" />
    </svg>
  );
}

/** Review: language coming back around. */
export function IconReview({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.4h-4.4" />
    </svg>
  );
}

/** My English: what the learner owns. */
export function IconMine({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 4.6h9.2a2.4 2.4 0 0 1 2.4 2.4V20H7.4A2.4 2.4 0 0 1 5 17.6z" />
      <path d="M16.6 7H19v13H8.6" />
      <path d="M8.2 8.6h5.4M8.2 12h5.4" />
    </svg>
  );
}

/* --- V1.1 navigation. Four destinations, four distinct silhouettes. --- */

/** Today: a new day. */
export function IconSun({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
    </svg>
  );
}

/** Course: the path from one situation to the next. */
export function IconPath({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="16.8" cy="6.6" r="2.6" />
      <circle cx="7.2" cy="17.4" r="2.6" />
      <path d="M14.4 7.6c-4.6 1.2-7 3-7.2 5.4M9.6 16.4c4.6-1.2 7-3 7.2-5.4" />
    </svg>
  );
}

/** My English: what you can already say. */
export function IconSpeechCheck({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H12l-4.4 3.4V16H6.5A2.5 2.5 0 0 1 4 13.5z" />
      <path d="M8.8 10.2l2 2 4.4-4.4" />
    </svg>
  );
}

/** My Space: the room that grows with you. */
export function IconHome({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 10.6 12 4l8 6.6V19a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 19z" />
    </svg>
  );
}

/** Contextual review — never a permanent tab, only a chip. */
export function IconRefresh({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 11.4a8 8 0 1 0-.6 4" />
      <path d="M20 4.6V11h-6" />
    </svg>
  );
}

/** A future situation, not yet reachable. */
export function IconLock({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export function IconSparkle({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3.4l1.9 5.1 5.1 1.9-5.1 1.9L12 17.4l-1.9-5.1L5 10.4l5.1-1.9z" />
    </svg>
  );
}

/** A scene chip: which kind of situation this is — a café order. */
export function IconCup({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" />
      <path d="M17 11h1.6a2.4 2.4 0 0 1 0 4.8H17" />
      <path d="M8.6 3.4c-.8.9-.8 1.8 0 2.7M12 3.4c-.8.9-.8 1.8 0 2.7" />
    </svg>
  );
}

/** A scene chip: meeting a person for the first time. */
export function IconUsers({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="9" cy="8.4" r="3" />
      <path d="M3.6 19.4a5.4 5.4 0 0 1 10.8 0" />
      <path d="M15.5 6a3 3 0 0 1 0 5.8M18.4 19.4a5.2 5.2 0 0 0-3.4-5" />
    </svg>
  );
}

/** A scene chip: finding your way around a place. */
export function IconPin({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}
