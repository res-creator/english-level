import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PoseCharacter, EyeState } from "../components/pose/PoseCharacter";
import { characterA, characterB } from "../data/poseCharacters";
import { statesFromAmplitudes, MouthState } from "../lib/lipSync";
import { syntheticAmplitudeAt } from "../lib/syntheticSpeech";

const FPS = 30;
const sec = (s: number) => Math.round(s * FPS);

/**
 * Scene grammar (animation-language.md §9), as explicit beat boundaries in
 * seconds -- not a timer loop. Every animated value below is derived from
 * these, so changing the pacing means editing this table, not the JSX.
 * This is placeholder dialogue/timing (no real script or voiceover was
 * provided yet) purely to prove the pose-based mechanic out end to end.
 */
const BEATS = {
  establishingEnd: 1.8,
  speakerAStart: 1.8,
  speakerAEnd: 5.2,
  reactionBStart: 4.4, // overlaps the tail of A's line -- timed to A's key word, not after A finishes
  reactionBEnd: 5.2,
  speakerBStart: 5.2,
  speakerBEnd: 9.6,
  emphasisStart: 8.4, // the "go ahead" accent inside B's line
  emphasisEnd: 9.6,
  reactionAStart: 9.6,
  reactionAEnd: 10.4,
  resolutionEnd: 13.5,
};

export const DIALOGUE_POSE_DEMO_DURATION_SECONDS = BEATS.resolutionEnd;

/** Eases a value in over `inSec`, holds, eases out over `outSec`, else 0. */
const windowedEase = (t: number, start: number, end: number, inSec: number, outSec: number): number => {
  if (t < start || t > end) return 0;
  const easeIn = interpolate(t, [start, start + inSec], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const easeOut = interpolate(t, [end - outSec, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(easeIn, easeOut);
};

const speakingMouthState = (
  isTalking: boolean,
  frame: number,
  windowStartFrame: number,
  durationFrames: number,
  seed: number,
): MouthState => {
  if (!isTalking) return "closed";
  // Precompute just this speaking window's states each call -- cheap
  // (a few hundred frames at most) and keeps this a pure function of the
  // beat table rather than needing cross-frame memoized state.
  const amplitudes: number[] = new Array(durationFrames);
  for (let f = 0; f < durationFrames; f++) {
    amplitudes[f] = syntheticAmplitudeAt(f, seed);
  }
  const states = statesFromAmplitudes(amplitudes);
  const localFrame = frame - windowStartFrame;
  return states[Math.max(0, Math.min(localFrame, states.length - 1))];
};

export const DialoguePoseDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // -- Camera: static by default, one push-in at establishing, one mild --
  // -- reframe toward whichever character is speaking, one slightly     --
  // -- stronger emphasis push during the accent phrase, then ease back. --
  let cameraScale = 1;
  let cameraTranslateX = 0;

  if (t < BEATS.establishingEnd) {
    // Establishing: hold wide, no push yet (the push happens as we hand off to speaker A).
    cameraScale = 1;
    cameraTranslateX = 0;
  } else if (t < BEATS.speakerAEnd) {
    const settle = interpolate(t, [BEATS.speakerAStart, BEATS.speakerAStart + 0.6], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    cameraScale = interpolate(settle, [0, 1], [1, 1.012]);
    cameraTranslateX = interpolate(settle, [0, 1], [0, -10]); // weight toward A (left)
  } else if (t < BEATS.emphasisStart) {
    cameraScale = 1.012;
    cameraTranslateX = interpolate(
      t,
      [BEATS.speakerBStart, BEATS.speakerBStart + 0.6],
      [-10, 10],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ); // hand off weight to B (right)
  } else if (t < BEATS.emphasisEnd) {
    const emphasisEase = windowedEase(t, BEATS.emphasisStart, BEATS.emphasisEnd, 0.3, 0.3);
    cameraScale = interpolate(emphasisEase, [0, 1], [1.012, 1.03]);
    cameraTranslateX = interpolate(emphasisEase, [0, 1], [10, 16]);
  } else {
    // Resolution: ease everything back to the establishing framing.
    const back = interpolate(t, [BEATS.reactionAEnd, BEATS.resolutionEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    });
    cameraScale = interpolate(back, [0, 1], [1.03, 1]);
    cameraTranslateX = interpolate(back, [0, 1], [16, 0]);
  }

  // -- Character A --
  const aIsTalking = t >= BEATS.speakerAStart && t < BEATS.speakerAEnd;
  const aMouth = speakingMouthState(
    aIsTalking,
    frame,
    sec(BEATS.speakerAStart),
    sec(BEATS.speakerAEnd - BEATS.speakerAStart),
    1,
  );
  const aEye: EyeState = t >= BEATS.reactionAStart && t < BEATS.reactionAEnd ? "reaction" : "open";

  // -- Character B --
  const bIsTalking = t >= BEATS.speakerBStart && t < BEATS.speakerBEnd;
  const bMouth = speakingMouthState(
    bIsTalking,
    frame,
    sec(BEATS.speakerBStart),
    sec(BEATS.speakerBEnd - BEATS.speakerBStart),
    7,
  );
  const bEye: EyeState = t >= BEATS.reactionBStart && t < BEATS.reactionBEnd ? "reaction" : "open";

  // Pose swap ONLY on the semantic accent (the "go ahead" phrase), crossfaded in/out.
  const bEmphasisAmount = windowedEase(t, BEATS.emphasisStart, BEATS.emphasisEnd, 4 / fps, 4 / fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "#f4efe6" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${cameraScale}) translateX(${cameraTranslateX}px)`,
          transformOrigin: "50% 45%",
        }}
      >
        {/*
          width/top sized off the placeholder art's real content bbox
          (head-to-torso-bottom is ~59% of the 800x1000 canvas -- the rest
          is transparent margin) so each character's actual visible size
          lands around ~52% of frame height, not just "some box that size."
          Recompute if a new art pack changes the content bounding box.
        */}
        <PoseCharacter
          config={characterA}
          left={0.03}
          top={0.1}
          width={0.46}
          emphasisAmount={0}
          eyeState={aEye}
          mouthState={aMouth}
        />
        <PoseCharacter
          config={characterB}
          left={0.51}
          top={0.1}
          width={0.46}
          emphasisAmount={bEmphasisAmount}
          eyeState={bEye}
          mouthState={bMouth}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
