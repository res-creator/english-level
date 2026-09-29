import { Easing, interpolate } from "remotion";

export interface CameraState {
  scale: number;
  translateYPx: number;
}

/**
 * Subtle push-in/reframe cycle: eases toward a slightly closer, slightly
 * higher framing (favoring the speaker's face) and back, never a hard cut
 * or abrupt zoom. In the real multi-speaker segment this should be driven
 * by actual beat/speaker-turn boundaries (SegmentConfig.beats[]) rather
 * than a timer -- RigTest has no beat data (one continuous line), so it's
 * simulated here on a fixed cycle purely to prove the camera mechanic out.
 */
export const cameraStateAt = (
  t: number,
  cycleSeconds: number,
  maxScale: number,
  maxLiftPx: number,
): CameraState => {
  const phase = (t % cycleSeconds) / cycleSeconds; // 0..1
  // Ease in for the first half (push in), ease out for the second (settle back).
  const eased =
    phase < 0.5
      ? Easing.inOut(Easing.ease)(phase * 2)
      : 1 - Easing.inOut(Easing.ease)((phase - 0.5) * 2);

  return {
    scale: interpolate(eased, [0, 1], [1, maxScale]),
    translateYPx: interpolate(eased, [0, 1], [0, -maxLiftPx]),
  };
};
