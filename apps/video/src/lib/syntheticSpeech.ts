/**
 * A smooth, deterministic stand-in amplitude curve for a speaking window,
 * used only until real recorded voiceover exists for this scene. Reuses
 * the exact same smoothing/hysteresis/hold state machine real audio goes
 * through (lib/lipSync.ts `statesFromAmplitudes`) so swapping in a real
 * track later changes nothing about how the mouth behaves -- only the
 * amplitude source changes.
 */
export const syntheticAmplitudeAt = (frame: number, seed: number): number => {
  // Layered sines at non-integer-ratio frequencies avoid an obviously
  // looping/robotic pattern over a ~1-2s speaking window.
  const a =
    Math.sin(frame * 0.42 + seed) * 0.5 +
    Math.sin(frame * 0.71 + seed * 1.7) * 0.3 +
    Math.sin(frame * 1.13 + seed * 0.6) * 0.2;
  return Math.max(0, (a + 1) / 2); // fold into 0-1ish range
};
