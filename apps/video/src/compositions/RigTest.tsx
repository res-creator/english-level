import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { RigCharacter } from "../components/rig/RigCharacter";
import { brunetteBustRig } from "../data/rigs/brunetteBust";
import { cameraStateAt } from "../lib/camera";

const VOICEOVER = "audio/directions.mp3";

// Simulated "between replicas" cadence for this single-speaker test -- see
// lib/camera.ts for why a real multi-speaker segment should drive this from
// beat boundaries instead.
const PUSH_IN_CYCLE_SECONDS = 5;
const PUSH_IN_MAX_SCALE = 1.025;
const PUSH_IN_MAX_LIFT_PX = 8;

/**
 * Rig proof-of-concept: blink, idle head + body sway, smoothed audio-driven
 * mouth swap, one-arm gesture, subtle camera push-in. Isolated from the
 * real segment composition on purpose -- swap the placeholder art under
 * public/characters/host/rig for the real layers once they're ready and
 * this keeps working unchanged.
 */
export const RigTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camera = cameraStateAt(frame / fps, PUSH_IN_CYCLE_SECONDS, PUSH_IN_MAX_SCALE, PUSH_IN_MAX_LIFT_PX);

  return (
    <AbsoluteFill style={{ backgroundColor: "#eef1ea" }}>
      <Audio src={staticFile(VOICEOVER)} />
      <AbsoluteFill
        style={{
          transform: `scale(${camera.scale}) translateY(${camera.translateYPx}px)`,
          transformOrigin: "50% 40%",
        }}
      >
        {/*
          width/top/left are sized so the visible bust (not the padded rig
          canvas -- ~59% of the 1000x1340 canvas is transparent margin below
          the hands) lands at ~50% of frame height, vertically centered.
          Recompute these if a new art pack changes the content bounding box.
        */}
        <RigCharacter
          rig={brunetteBustRig}
          left={0.323}
          top={0.231}
          width={0.353}
          audioSrc={VOICEOVER}
          isTalking
          gestureArm="left"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
