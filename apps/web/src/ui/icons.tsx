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
