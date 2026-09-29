import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { PoseCharacterConfig } from "../../data/poseCharacters";
import { MouthState } from "../../lib/lipSync";

export type EyeState = "open" | "closed" | "reaction";

interface PoseCharacterProps {
  config: PoseCharacterConfig;
  left: number;
  top: number;
  width: number;
  /**
   * 0 = fully the neutral held pose, 1 = fully the emphasis pose. A plain
   * 0 or 1 outside of a transition window; the composition eases this
   * through intermediate values for the 2-4 frame crossfade the animation
   * language calls for around a pose swap (see animation-language.md §7)
   * -- this component doesn't decide *when* to transition, only how to
   * render whatever blend it's given.
   */
  emphasisAmount: number;
  eyeState: EyeState;
  mouthState: MouthState;
}

const Layer: React.FC<{ src: string; opacity?: number }> = ({ src, opacity = 1 }) => (
  <Img
    src={staticFile(src)}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity }}
  />
);

/**
 * Pose-based character rendering: a held full-body pose image (crossfaded
 * between "neutral" and "emphasis" only when the scene calls for a pose
 * swap) plus small eye/mouth overlays for face state. Deliberately has no
 * joints, no per-limb rotation, no skeletal rig -- per the project's
 * animation-language skill, pose-based is the default and a rig is only
 * for an asset actually prepared for one.
 */
export const PoseCharacter: React.FC<PoseCharacterProps> = ({
  config,
  left,
  top,
  width,
  emphasisAmount,
  eyeState,
  mouthState,
}) => {
  const base = (p: string) => `${config.basePath}/${p}`;
  const eyesSrc =
    eyeState === "closed" ? config.eyesClosed : eyeState === "reaction" ? config.eyesReaction : config.eyesOpen;
  const mouthSrc =
    mouthState === "open" ? config.mouthOpen : mouthState === "mid" ? config.mouthMid : config.mouthClosed;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: `${left * 100}%`,
          top: `${top * 100}%`,
          width: `${width * 100}%`,
          aspectRatio: `${config.canvasWidth} / ${config.canvasHeight}`,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Layer src={base(config.poseNeutral)} opacity={1 - emphasisAmount} />
          <Layer src={base(config.poseEmphasis)} opacity={emphasisAmount} />
          <Layer src={base(eyesSrc)} />
          <Layer src={base(mouthSrc)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
