import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { RigCharacter } from "../components/rig/RigCharacter";
import { brunetteBustRig } from "../data/rigs/brunetteBust";

const VOICEOVER = "audio/directions.mp3";

/**
 * Rig proof-of-concept: blink, idle head sway, audio-driven mouth swap,
 * one-arm gesture. Isolated from the real segment composition on purpose --
 * swap the placeholder art under public/characters/host/rig for the real
 * layers once they're ready and this keeps working unchanged.
 */
export const RigTest: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#eef1ea" }}>
      <Audio src={staticFile(VOICEOVER)} />
      <RigCharacter
        rig={brunetteBustRig}
        left={0.32}
        top={0.05}
        width={0.36}
        audioSrc={VOICEOVER}
        isTalking
        gestureArm="left"
      />
    </AbsoluteFill>
  );
};
