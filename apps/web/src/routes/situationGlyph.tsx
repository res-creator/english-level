import type { ReactNode } from "react";

/**
 * A tiny symbol for each situation, so a node on the path is recognisable
 * before its title is read: a cup for the café, a hand for meeting
 * someone, a pin for finding your way.
 *
 * These are interface icons, drawn as SVG — never emoji, which render
 * differently on every device and break the typography.
 *
 * Anything unmapped falls back to its position number, so new content
 * shows up on the path immediately instead of waiting for artwork.
 */
const GLYPHS: Record<string, ReactNode> = {
  les_sie_a1_e1: <HandWave />,
  les_sie_a1_e2: <Cup />,
  les_sie_a1_e3: <Sun />,
  les_sie_a1_e4: <Pin />,
  les_sie_a1_e5: <Umbrella />,
};

export function situationGlyph(episodeId: string, position: number): ReactNode {
  if (GLYPHS[episodeId]) return GLYPHS[episodeId];
  // Result screens do not have a course-path position. Showing their sentinel
  // value (0) exposes an implementation detail as if it were a learner score.
  if (position <= 0) return <Pin />;
  return <span className="node2__num">{position}</span>;
}

function stroke(size = 26) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

function HandWave() {
  return (
    <svg {...stroke()}>
      <path d="M9 12.5V5.6a1.3 1.3 0 0 1 2.6 0v5.6" />
      <path d="M11.6 11V4.4a1.3 1.3 0 0 1 2.6 0v6.6" />
      <path d="M14.2 11.4V6.6a1.3 1.3 0 0 1 2.6 0V14a6 6 0 0 1-6 6h-.6a5 5 0 0 1-4.3-2.5l-2-3.4a1.3 1.3 0 0 1 2-1.6l1.7 1.6" />
    </svg>
  );
}

function Cup() {
  return (
    <svg {...stroke()}>
      <path d="M5 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" />
      <path d="M17 11h1.6a2.4 2.4 0 0 1 0 4.8H17" />
      <path d="M8.6 3.4c-.8.9-.8 1.8 0 2.7M12 3.4c-.8.9-.8 1.8 0 2.7" />
    </svg>
  );
}

function Sun() {
  return (
    <svg {...stroke()}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.6v2M12 18.4V21M3.6 12h2M18.4 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
    </svg>
  );
}

function Pin() {
  return (
    <svg {...stroke()}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function Umbrella() {
  return (
    <svg {...stroke()}>
      <path d="M3.2 12a8.8 8.8 0 0 1 17.6 0z" />
      <path d="M12 12v6.4a2.4 2.4 0 0 0 4.8 0" />
    </svg>
  );
}
