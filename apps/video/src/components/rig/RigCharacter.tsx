import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { RigConfig } from "../../data/rigTypes";

interface RigCharacterProps {
  rig: RigConfig;
  left: number;
  top: number;
  width: number;
  audioSrc: string;
  isTalking?: boolean;
  gestureArm?: "left" | "right" | "none";
}

const BLINK_PERIOD_SECONDS = 3.4;
const BLINK_DURATION_FRAMES = 5;

/** A layer image filling its parent box exactly -- every rig PNG shares one canvas size. */
const Layer: React.FC<{ src: string }> = ({ src }) => (
  <Img
    src={staticFile(src)}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
  />
);

/** Wraps children in a div that rotates around `pivot` (0-1 canvas fraction). */
const Joint: React.FC<{
  pivot: { x: number; y: number };
  angleDeg: number;
  children: React.ReactNode;
}> = ({ pivot, angleDeg, children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transformOrigin: `${pivot.x * 100}% ${pivot.y * 100}%`,
      transform: `rotate(${angleDeg}deg)`,
    }}
  >
    {children}
  </div>
);

export const RigCharacter: React.FC<RigCharacterProps> = ({
  rig,
  left,
  top,
  width,
  audioSrc,
  isTalking = false,
  gestureArm = "none",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const base = (p: string) => `${rig.basePath}/${p}`;

  // Idle head sway/bob (small, around the neck pivot).
  const headAngle = Math.sin(t * 1.1) * 2.5;
  const headBobPx = Math.sin(t * 1.6) * 3;

  // Blink.
  const cyclePos = t % BLINK_PERIOD_SECONDS;
  const blinkFrame = cyclePos < BLINK_DURATION_FRAMES / fps ? cyclePos * fps : -1;
  const eyesClosed = blinkFrame >= 0 && blinkFrame < BLINK_DURATION_FRAMES;

  // Mouth driven by voiceover amplitude.
  const audioData = useAudioData(staticFile(audioSrc));
  let openAmount = 0;
  if (isTalking && audioData) {
    const viz = visualizeAudio({ audioData, frame, fps, numberOfSamples: 16 });
    const amplitude = viz.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
    openAmount = Math.min(1, amplitude * 3.2);
  }
  const mouthSrc = !isTalking || openAmount < 0.12 ? rig.mouthClosed : openAmount < 0.55 ? rig.mouthMid : rig.mouthOpen;

  // One-arm idle gesture: shoulder lifts, elbow counter-bends for a natural raise.
  const gestureCycle = (Math.sin(t * 0.7) + 1) / 2; // 0..1
  const shoulderLift = gestureCycle * -22; // degrees, negative = arm rises outward
  const elbowBend = gestureCycle * 18;

  const rightShoulderAngle = gestureArm === "right" ? shoulderLift : 0;
  const rightElbowAngle = gestureArm === "right" ? elbowBend : 0;
  const leftShoulderAngle = gestureArm === "left" ? -shoulderLift : 0;
  const leftElbowAngle = gestureArm === "left" ? -elbowBend : 0;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: `${left * 100}%`,
          top: `${top * 100}%`,
          width: `${width * 100}%`,
          // aspectRatio (not a computed height%) keeps this box's actual
          // pixel proportions locked to the rig canvas regardless of the
          // parent frame's own aspect ratio -- width% and height% resolve
          // against different bases (frame width vs. frame height), so a
          // manually computed height% here would silently distort a
          // portrait canvas inside a 16:9 (landscape) frame.
          aspectRatio: `${rig.canvasWidth} / ${rig.canvasHeight}`,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Layer src={base(rig.torso)} />

          {/* Right arm (back, paints first among the torso's children). */}
          <Joint pivot={rig.armRight.shoulderPivot} angleDeg={rightShoulderAngle}>
            <Layer src={base(rig.armRight.upper)} />
            <Joint pivot={rig.armRight.elbowPivot} angleDeg={rightElbowAngle}>
              <Layer src={base(rig.armRight.fore)} />
              <Joint pivot={rig.armRight.wristPivot} angleDeg={0}>
                <Layer src={base(rig.armRight.hand)} />
              </Joint>
            </Joint>
          </Joint>

          {/* Head group. */}
          <Joint pivot={rig.neckPivot} angleDeg={headAngle}>
            <div style={{ position: "absolute", inset: 0, transform: `translateY(${headBobPx}px)` }}>
              <Layer src={base(rig.headHairBack)} />
              <Layer src={base(rig.headBase)} />
              <Layer src={base(rig.eyebrows)} />
              <Layer src={base(eyesClosed ? rig.eyesClosed : rig.eyesOpen)} />
              <Layer src={base(mouthSrc)} />
              <Layer src={base(rig.headHairFront)} />
            </div>
          </Joint>

          {/* Left arm (front, paints last so it's on top). */}
          <Joint pivot={rig.armLeft.shoulderPivot} angleDeg={leftShoulderAngle}>
            <Layer src={base(rig.armLeft.upper)} />
            <Joint pivot={rig.armLeft.elbowPivot} angleDeg={leftElbowAngle}>
              <Layer src={base(rig.armLeft.fore)} />
              <Joint pivot={rig.armLeft.wristPivot} angleDeg={0}>
                <Layer src={base(rig.armLeft.hand)} />
              </Joint>
            </Joint>
          </Joint>
        </div>
      </div>
    </AbsoluteFill>
  );
};
