import React, { useMemo } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData } from "@remotion/media-utils";
import { RigConfig } from "../../data/rigTypes";
import { computeMouthStates } from "../../lib/lipSync";

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
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const base = (p: string) => `${rig.basePath}/${p}`;

  // Idle head sway/bob (small, around the neck pivot).
  const headAngle = Math.sin(t * 1.1) * 2.5;
  const headBobPx = Math.sin(t * 1.6) * 3;

  // Idle body sway: torso+arms+head all sway together (see the wrapping div
  // below), deliberately a different frequency/phase than the head's own
  // motion above so the two never lock into sync. Amplitude is kept tiny
  // and there's no vertical component, so it reads as a weight shift, not
  // floating.
  const bodySwayDeg = Math.sin(t * 0.35 + 0.6) * 0.8;
  const bodySwayXPx = Math.sin(t * 0.27) * 2;
  const bodyPivot = rig.bodyPivot ?? { x: 0.5, y: 0.485 };

  // Blink.
  const cyclePos = t % BLINK_PERIOD_SECONDS;
  const blinkFrame = cyclePos < BLINK_DURATION_FRAMES / fps ? cyclePos * fps : -1;
  const eyesClosed = blinkFrame >= 0 && blinkFrame < BLINK_DURATION_FRAMES;

  // Mouth: precompute the whole clip's states once (pure function of the
  // audio track -- see lib/lipSync for why this can't be per-frame React
  // state) and just look up this frame's answer.
  const audioData = useAudioData(staticFile(audioSrc));
  const mouthStates = useMemo(
    () => (audioData ? computeMouthStates(audioData, fps, durationInFrames) : null),
    [audioData, fps, durationInFrames],
  );
  const mouthState = isTalking && mouthStates ? mouthStates[Math.min(frame, mouthStates.length - 1)] : "closed";
  const mouthSrc = mouthState === "open" ? rig.mouthOpen : mouthState === "mid" ? rig.mouthMid : rig.mouthClosed;

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
          {/*
            Whole-body idle sway: everything (torso, both arm chains, head
            group) nested under one gentle rotation around the waist, so a
            real weight-shift carries the head with it. Deliberately a
            different frequency/phase than the head's own sway above, and
            no vertical component (translateX-only), so it doesn't combine
            into "floating".
          */}
          <Joint pivot={bodyPivot} angleDeg={bodySwayDeg}>
            <div style={{ position: "absolute", inset: 0, transform: `translateX(${bodySwayXPx}px)` }}>
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
          </Joint>
        </div>
      </div>
    </AbsoluteFill>
  );
};
