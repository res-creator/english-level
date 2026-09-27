/**
 * The recurring cast.
 *
 * The same six people come back across levels — Майя is always the
 * barista at the café near home, Алекс is always the person you met
 * first. What changes is how hard the conversation is, not who is in it.
 * That continuity is the product: by A2 you are not meeting a stranger,
 * you are handling a harder moment with someone you know.
 *
 * `drkim` is the one deliberate exception (CONTENT_MASTER_PLAN_A1_B2_V2.md
 * §3 / CONTENT_PRODUCTION_PLAN.md §2): a minimal-footprint clinical NPC
 * for the Health strand's B1/B2 situations, where none of the recurring
 * six can honestly carry a doctor's register. Not a "friend" character —
 * she doesn't recur outside those two situations.
 *
 * Editorial 2D: flat shapes, one soft shadow, no outlines, adult
 * proportions, small eyes. Not photoreal, not anime, not Pixar. Every
 * member is drawn by the same component — only the tokens change — so
 * the cast can never drift apart stylistically.
 */
import { Art } from "./Art.tsx";
import { artName } from "./artRegistry.ts";

export type CastId =
  | "maya"
  | "alex"
  | "emma"
  | "daniel"
  | "leo"
  | "rosa"
  | "drkim";

/** The four states a scene needs. `showing` is only meaningful where the
 * situation actually involves handing something over. */
export type CastState = "speaking" | "listening" | "smiling" | "showing";

interface CastLook {
  id: CastId;
  name: string;
  role: string;
  skin: string;
  skinShade: string;
  hair: string;
  clothes: string;
  clothesDark: string;
  /** What makes them recognisable in silhouette. */
  silhouette: "bun" | "short" | "glasses" | "crop" | "beard" | "curls";
  accent?: string;
}

export const CAST: Record<CastId, CastLook> = {
  maya: {
    id: "maya",
    name: "Майя",
    role: "бариста в кофейне у дома",
    skin: "#b5713f",
    skinShade: "#9c5c2e",
    hair: "#20142b",
    clothes: "#5b2fe0",
    clothesDark: "#4420b3",
    silhouette: "bun",
    accent: "#ffb27a",
  },
  alex: {
    id: "alex",
    name: "Алекс",
    role: "новый знакомый, потом друг",
    skin: "#f0c39a",
    skinShade: "#dcab7c",
    hair: "#7b4a25",
    clothes: "#6b42ee",
    clothesDark: "#5124cc",
    silhouette: "short",
  },
  emma: {
    id: "emma",
    name: "Эмма",
    role: "продавщица в магазине на углу",
    skin: "#eec19c",
    skinShade: "#d9a97f",
    hair: "#b9b3c6",
    clothes: "#3f1fa3",
    clothesDark: "#2c1673",
    silhouette: "glasses",
  },
  daniel: {
    id: "daniel",
    name: "Дэниел",
    role: "коллега по работе",
    skin: "#e8b88c",
    skinShade: "#d2a077",
    hair: "#18121f",
    clothes: "#ffffff",
    clothesDark: "#e4dcfa",
    silhouette: "crop",
  },
  leo: {
    id: "leo",
    name: "Лео",
    role: "официант в ресторане",
    skin: "#54301c",
    skinShade: "#44250f",
    hair: "#150d14",
    clothes: "#241d31",
    clothesDark: "#17121f",
    silhouette: "beard",
  },
  rosa: {
    id: "rosa",
    name: "Роза",
    role: "соседка, знает весь район",
    skin: "#d79a6d",
    skinShade: "#bf8355",
    hair: "#e9e4f2",
    clothes: "#ffb27a",
    clothesDark: "#ff9c53",
    silhouette: "curls",
  },
  drkim: {
    id: "drkim",
    name: "Доктор Ким",
    role: "врач в клинике",
    skin: "#e0ac7e",
    skinShade: "#c8925f",
    hair: "#0f0d12",
    clothes: "#ffffff",
    clothesDark: "#dfe6f0",
    silhouette: "glasses",
  },
};

interface Props {
  cast: CastId;
  state?: CastState;
  /** Width in px; the drawing keeps its own aspect. */
  width?: number;
}

/**
 * One person, shown from the chest up as they are in a real counter
 * conversation. The expression is the only thing that changes between
 * activities — the pose, the lighting and the framing are locked, which
 * is what keeps a situation feeling like one continuous scene.
 */
export function CastMember(props: Props) {
  const { cast, state = "speaking", width = 240 } = props;
  const look = CAST[cast];
  return (
    <Art
      name={artName.cast(cast, state)}
      alt={look.name}
      fit="contain"
      position="center bottom"
      priority
      style={{ width, height: width * 1.05 }}
      fallback={<CastGlyph {...props} />}
    />
  );
}

/** How every state of every cast member is named, so a situation can warm
 * its whole set before the first activity appears. */
export function castArtNames(cast: CastId): string[] {
  const states: CastState[] = ["speaking", "listening", "smiling", "showing"];
  return states.map((state) => artName.cast(cast, state));
}

/** The coded placeholder, kept simple on purpose. */
function CastGlyph({ cast, state = "speaking", width = 240 }: Props) {
  const look = CAST[cast];
  const height = width * 1.05;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 210"
      fill="none"
      role="img"
      aria-label={look.name}
    >
      {/* Shoulders / clothing */}
      <path d="M22 210c0-36 26-58 78-58s78 22 78 58z" fill={look.clothes} />
      {look.id === "maya" ? (
        <path d="M74 156h52l6 54H68z" fill={look.accent} opacity=".95" />
      ) : null}
      <path d="M78 150h44v14a22 22 0 0 1-44 0z" fill={look.skinShade} />

      {/* Hair behind the head */}
      <HairBack look={look} />

      {/* Head */}
      <ellipse cx="100" cy="98" rx="44" ry="52" fill={look.skin} />
      <ellipse cx="60" cy="102" rx="7" ry="10" fill={look.skinShade} />
      <ellipse cx="140" cy="102" rx="7" ry="10" fill={look.skinShade} />

      <HairFront look={look} />

      <Features look={look} state={state} />
    </svg>
  );
}

function HairBack({ look }: { look: CastLook }) {
  switch (look.silhouette) {
    case "bun":
      return (
        <>
          <circle cx="100" cy="36" r="20" fill={look.hair} />
          <ellipse cx="100" cy="92" rx="47" ry="54" fill={look.hair} />
        </>
      );
    case "curls":
      return (
        <g fill={look.hair}>
          <circle cx="66" cy="72" r="20" />
          <circle cx="134" cy="72" r="20" />
          <circle cx="100" cy="54" r="24" />
          <ellipse cx="100" cy="96" rx="48" ry="52" />
        </g>
      );
    case "glasses":
      return <ellipse cx="100" cy="94" rx="48" ry="52" fill={look.hair} />;
    default:
      return <ellipse cx="100" cy="92" rx="46" ry="50" fill={look.hair} />;
  }
}

function HairFront({ look }: { look: CastLook }) {
  switch (look.silhouette) {
    case "bun":
      return (
        <path
          d="M56 84c4-28 22-40 44-40s40 12 44 40c-14-14-28-18-44-18s-30 4-44 18z"
          fill={look.hair}
        />
      );
    case "short":
      return (
        <path
          d="M56 88c2-30 20-42 44-42s42 12 44 42c-12-18-26-24-44-24s-32 6-44 24z"
          fill={look.hair}
        />
      );
    case "crop":
      return (
        <path
          d="M58 82c6-24 22-34 42-34s36 10 42 34c-14-10-26-14-42-14s-28 4-42 14z"
          fill={look.hair}
        />
      );
    case "beard":
      return (
        <>
          <path
            d="M58 84c6-26 22-36 42-36s36 10 42 36c-14-12-26-16-42-16s-28 4-42 16z"
            fill={look.hair}
          />
          <path
            d="M62 112c6 26 20 40 38 40s32-14 38-40c-8 16-22 24-38 24s-30-8-38-24z"
            fill={look.hair}
          />
        </>
      );
    case "curls":
      return (
        <path
          d="M58 86c4-26 20-38 42-38s38 12 42 38c-14-14-26-18-42-18s-28 4-42 18z"
          fill={look.hair}
        />
      );
    case "glasses":
      return (
        <>
          <path
            d="M54 90c4-28 22-40 46-40s42 12 46 40c-14-16-28-20-46-20s-32 4-46 20z"
            fill={look.hair}
          />
          <g stroke="#241d31" strokeWidth="3" fill="none" opacity=".9">
            <circle cx="83" cy="100" r="13" />
            <circle cx="117" cy="100" r="13" />
            <path d="M96 100h8" />
          </g>
        </>
      );
  }
}

/** Eyes, brows and mouth — the only part that changes between steps. */
function Features({ look, state }: { look: CastLook; state: CastState }) {
  const ink = "#241d31";
  const smiling = state === "smiling" || state === "showing";
  return (
    <g>
      <path
        d={
          state === "listening"
            ? "M72 86c4-4 10-4 14-1M114 85c4-3 10-3 14 1"
            : "M72 87c4-3 10-3 14 0M114 87c4-3 10-3 14 0"
        }
        stroke={ink}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity=".85"
      />
      {smiling ? (
        <>
          <path
            d="M74 102c3-4 9-4 12 0"
            stroke={ink}
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M114 102c3-4 9-4 12 0"
            stroke={ink}
            strokeWidth="3.4"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <ellipse cx="80" cy="102" rx="4" ry="5" fill={ink} />
          <ellipse cx="120" cy="102" rx="4" ry="5" fill={ink} />
        </>
      )}
      <path
        d="M98 108c0 8 4 10 6 10"
        stroke={look.skinShade}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {state === "speaking" ? (
        <ellipse cx="100" cy="128" rx="8" ry="6" fill={ink} />
      ) : (
        <path
          d={smiling ? "M88 126c6 8 18 8 24 0" : "M90 128c6 4 14 4 20 0"}
          stroke={ink}
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
}
