import type { ReactNode } from "react";
import { CastMember, type CastId, type CastState } from "../brand/cast.tsx";
import { Kvo, type KvoState } from "../brand/Kvo.tsx";
import { SceneBackdrop } from "../brand/scenes.tsx";
import type { SceneId } from "../brand/situationScenes.ts";
import { ArtLayer } from "../brand/Art.tsx";
import { artName } from "../brand/artRegistry.ts";

/**
 * A situation is one continuous visual conversation.
 *
 * The backdrop and the person never change while you are inside a
 * situation — only their expression, the bubbles and the task below do.
 * Nothing here slides or swaps the whole screen, because a page
 * transition reads as "somewhere else" and destroys the illusion in a
 * single frame.
 *
 * Kvo is secondary by construction: he leans in from the edge, below the
 * scene's own frame, in a bubble of a different shape. He is beside you,
 * not in the room — and he never replaces the person you are talking to.
 */

export interface DialogueLine {
  id: string;
  /** Who said it. `you` renders on the right, in violet. */
  from: "them" | "you";
  /** English is always set in the serif; Russian never appears here. */
  text: string;
  /** A turn you haven't completed yet — shown as a pending gap. */
  pending?: boolean;
}

interface Props {
  scene: SceneId;
  cast: CastId;
  castState?: CastState;
  /** Newest last. Only the last three are rendered; older ones fade. */
  dialogue: DialogueLine[];
  /** At most one per mini-scene. Anything more and Kvo starts nagging. */
  kvoHint?: string | null;
  kvoState?: KvoState;
  /** Chip over the scene, e.g. «Ситуация: В кафе». */
  label?: ReactNode;
  compact?: boolean;
}

/** Three is the most a glance can hold; beyond that it reads as a chat log
 * rather than a conversation you are inside. */
const VISIBLE_LINES = 3;

export function SceneStage({
  scene,
  cast,
  castState = "speaking",
  dialogue,
  kvoHint = null,
  kvoState = "idle",
  label,
  compact = false,
}: Props) {
  const visible = dialogue.slice(-VISIBLE_LINES);
  const newestIndex = visible.length - 1;

  return (
    <div className={compact ? "scene scene--compact" : "scene"}>
      {/* Layer 1 — the place. Real artwork when it exists, the coded
          backdrop underneath when it doesn't. */}
      <ArtLayer
        name={artName.sceneBackground(scene)}
        priority
        fallback={<SceneBackdrop scene={scene} />}
      />

      {label ? <div className="scene__label">{label}</div> : null}

      {/* Layer 2 — the person. */}
      <div className="scene__person">
        <CastMember cast={cast} state={castState} width={compact ? 178 : 210} />
      </div>

      {/* Layer 3 — anything that belongs in front of the person: the near
          edge of a counter, a plant, the rim of a table. Optional. */}
      <ArtLayer
        name={artName.sceneForeground(scene)}
        className="scene__foreground"
        position="center bottom"
      />

      {/* Layer 4 — the conversation. Always real DOM, always on top, so
          artwork can never swallow a bubble. */}
      <div className="scene__dialogue">
        {visible.map((line, index) => (
          <Bubble
            key={line.id}
            line={line}
            // Older turns stay faintly visible: the conversation has a
            // past, but only the current turn asks for attention.
            depth={newestIndex - index}
          />
        ))}
      </div>

      {kvoHint ? (
        <div className="scene__kvo">
          <span className="kvo-bubble">{kvoHint}</span>
          <Kvo size={compact ? 62 : 76} state={kvoState} flip />
        </div>
      ) : null}
    </div>
  );
}

function Bubble({ line, depth }: { line: DialogueLine; depth: number }) {
  const classes = [
    "bubble",
    line.from === "you" ? "bubble--you" : "bubble--them",
    depth > 0 ? `bubble--past-${Math.min(depth, 2)}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {line.pending ? (
        <span className="bubble__pending" aria-label="Твой ход">
          <i />
          <i />
          <i />
        </span>
      ) : (
        <span className="en">{line.text}</span>
      )}
    </div>
  );
}
