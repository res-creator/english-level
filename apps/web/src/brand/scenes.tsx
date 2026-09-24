import type { SceneId } from "./situationScenes.ts";

/**
 * Places. A situation happens somewhere, and that somewhere never changes
 * while you are in it — same counter, same window, same light. The
 * backdrop is deliberately flat and quiet: three or four pieces of
 * context, nothing that competes with the person in front of you.
 */
export function SceneBackdrop({ scene }: { scene: SceneId }) {
  return (
    <svg
      className="scene__backdrop"
      viewBox="0 0 390 300"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      aria-hidden="true"
    >
      <rect width="390" height="300" fill="#efe9ff" />
      {scene === "cafe" ? <Cafe /> : null}
      {scene === "street" ? <Street /> : null}
      {scene === "meeting" ? <Meeting /> : null}
      {scene === "shop" ? <Shop /> : null}
      {scene === "restaurant" ? <Restaurant /> : null}
    </svg>
  );
}

function Lamp({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} 0v28`} stroke="#8b6bf3" strokeWidth="2" />
      <path d={`M${x - 18} 44a18 16 0 0 1 36 0z`} fill="#ffb27a" />
      <ellipse cx={x} cy="58" rx="30" ry="18" fill="#ffb27a" opacity=".22" />
    </g>
  );
}

function Cafe() {
  return (
    <g>
      <Lamp x={96} />
      {/* Shelf with cups */}
      <rect x="10" y="86" width="86" height="6" rx="3" fill="#ffffff" />
      <g fill="#ffffff">
        <rect x="16" y="66" width="26" height="20" rx="4" />
        <rect x="48" y="66" width="26" height="20" rx="4" />
      </g>
      <g fill="#ffb27a">
        <rect x="16" y="74" width="26" height="5" />
        <rect x="48" y="74" width="26" height="5" />
      </g>
      <g fill="#6b4126">
        <rect x="16" y="66" width="26" height="6" rx="3" />
        <rect x="48" y="66" width="26" height="6" rx="3" />
      </g>
      <path d="M80 66l4-14 4 14z" fill="#7bbd9b" />
      <rect x="78" y="66" width="12" height="12" rx="3" fill="#ff9c53" />

      {/* Window */}
      <path
        d="M268 46h84v112h-84z"
        fill="#f6f1ff"
        stroke="#ffffff"
        strokeWidth="6"
      />
      <path d="M310 46v112M268 100h84" stroke="#ffffff" strokeWidth="5" />

      {/* Takeaway cup on the sill */}
      <rect x="318" y="112" width="26" height="40" rx="4" fill="#ffffff" />
      <rect x="318" y="126" width="26" height="12" fill="#ffb27a" />
      <rect x="315" y="104" width="32" height="10" rx="4" fill="#5b2fe0" />

      {/* Mug on the counter */}
      <rect x="24" y="126" width="46" height="34" rx="6" fill="#ffffff" />
      <rect x="24" y="138" width="46" height="8" fill="#ffb27a" />
      <rect x="26" y="126" width="42" height="9" rx="4" fill="#6b4126" />
      <path
        d="M70 134h8a9 9 0 0 1 0 18h-8"
        stroke="#ffffff"
        strokeWidth="6"
        fill="none"
      />

      {/* Counter */}
      <rect y="160" width="390" height="140" fill="#5b2fe0" />
      <g stroke="#6b42ee" strokeWidth="3" opacity=".8">
        <path d="M70 168v40M160 168v40M250 168v40M330 168v40" />
      </g>
    </g>
  );
}

function Street() {
  return (
    <g>
      <rect width="390" height="300" fill="#e7e0fb" />
      <g fill="#c9bcf2">
        <rect x="18" y="70" width="52" height="110" rx="6" />
        <rect x="86" y="44" width="46" height="136" rx="6" />
        <rect x="256" y="58" width="54" height="122" rx="6" />
        <rect x="324" y="82" width="50" height="98" rx="6" />
      </g>
      <g fill="#ffe0c7">
        <rect x="28" y="84" width="14" height="16" rx="3" />
        <rect x="96" y="60" width="14" height="16" rx="3" />
        <rect x="266" y="74" width="14" height="16" rx="3" />
        <rect x="336" y="98" width="14" height="16" rx="3" />
      </g>
      <Lamp x={200} />
      <path d="M150 130h90v50h-90z" fill="#d9cdfc" />
      <rect y="180" width="390" height="120" fill="#5b2fe0" />
      <path
        d="M0 218h390"
        stroke="#8b6bf3"
        strokeWidth="6"
        strokeDasharray="22 18"
      />
    </g>
  );
}

function Meeting() {
  return (
    <g>
      <rect width="390" height="300" fill="#f1ecff" />
      <Lamp x={300} />
      <rect x="18" y="52" width="92" height="66" rx="8" fill="#ffffff" />
      <g fill="#d9cdfc">
        <rect x="30" y="66" width="58" height="6" rx="3" />
        <rect x="30" y="80" width="44" height="6" rx="3" />
      </g>
      <rect x="26" y="96" width="26" height="18" rx="4" fill="#ffb27a" />
      <path d="M262 118l10-32 10 32z" fill="#7bbd9b" />
      <rect x="258" y="118" width="28" height="24" rx="5" fill="#ff9c53" />
      <rect y="150" width="390" height="150" fill="#6b42ee" />
    </g>
  );
}

function Shop() {
  return (
    <g>
      <rect width="390" height="300" fill="#f1ecff" />
      <rect x="16" y="40" width="358" height="8" rx="4" fill="#ffffff" />
      <g fill="#ffb27a">
        <rect x="34" y="54" width="34" height="34" rx="6" />
        <rect x="250" y="54" width="34" height="34" rx="6" />
      </g>
      <g fill="#8b6bf3">
        <rect x="82" y="54" width="34" height="34" rx="6" />
        <rect x="298" y="54" width="34" height="34" rx="6" />
      </g>
      <rect x="16" y="108" width="358" height="8" rx="4" fill="#ffffff" />
      <rect y="160" width="390" height="140" fill="#5b2fe0" />
    </g>
  );
}

function Restaurant() {
  return (
    <g>
      <rect width="390" height="300" fill="#ece5ff" />
      <Lamp x={80} />
      <Lamp x={300} />
      <rect x="140" y="58" width="110" height="80" rx="8" fill="#241d31" />
      <g fill="#8b6bf3" opacity=".7">
        <rect x="154" y="74" width="68" height="6" rx="3" />
        <rect x="154" y="90" width="52" height="6" rx="3" />
        <rect x="154" y="106" width="60" height="6" rx="3" />
      </g>
      <rect y="168" width="390" height="132" fill="#3f1fa3" />
    </g>
  );
}

export { sceneForSituation, openingLine } from "./situationScenes.ts";
export type { SceneId, SituationScene } from "./situationScenes.ts";
