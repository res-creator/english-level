import { AudioData, visualizeAudio } from "@remotion/media-utils";

export type MouthState = "closed" | "mid" | "open";

const SMOOTH_WINDOW_FRAMES = 2; // +/- frames averaged, ~166ms at 30fps
const MIN_HOLD_FRAMES = 4; // a state must hold this many frames before it can change again
const MID_UP = 0.14;
const MID_DOWN = 0.08;
const OPEN_UP = 0.55;
const OPEN_DOWN = 0.4;

// visualizeAudio's raw bins run much lower than 0-1 for normal speech
// levels; this gain matches the original per-frame implementation so the
// 0-1-scale thresholds below actually mean something.
const AMPLITUDE_GAIN = 3.2;

const rawAmplitudeAt = (audioData: AudioData, fps: number, frame: number): number => {
  const viz = visualizeAudio({ audioData, frame: Math.max(0, frame), fps, numberOfSamples: 16 });
  const amplitude = viz.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
  return Math.min(1, amplitude * AMPLITUDE_GAIN);
};

/**
 * Precomputes the mouth state for every frame of the clip in one
 * deterministic pass. This must be a pure function of `audioData` (not
 * sequential React state) because Remotion renders frames across parallel
 * workers -- there is no guarantee frame N-1 rendered before frame N, so
 * any hysteresis/hold-time logic has to look at the whole track at once
 * rather than "the previously rendered frame's state".
 */
export const computeMouthStates = (
  audioData: AudioData,
  fps: number,
  durationInFrames: number,
): MouthState[] => {
  // Moving-average amplitude removes per-sample jitter before we even get
  // to the state machine, so a single loud/quiet frame can't flip the mouth.
  const smoothed: number[] = new Array(durationInFrames);
  for (let f = 0; f < durationInFrames; f++) {
    let sum = 0;
    let count = 0;
    for (let d = -SMOOTH_WINDOW_FRAMES; d <= SMOOTH_WINDOW_FRAMES; d++) {
      const ff = f + d;
      if (ff < 0 || ff >= durationInFrames) continue;
      sum += rawAmplitudeAt(audioData, fps, ff);
      count++;
    }
    smoothed[f] = sum / count;
  }

  const states: MouthState[] = new Array(durationInFrames);
  let state: MouthState = "closed";
  let framesInState = MIN_HOLD_FRAMES; // allow the very first transition immediately
  for (let f = 0; f < durationInFrames; f++) {
    const amp = smoothed[f];

    // Hysteresis: the threshold to leave a state is different from the
    // threshold to enter it, so amplitude hovering right at one cutoff
    // doesn't chatter between two states.
    let desired: MouthState = state;
    if (state === "closed") {
      if (amp > MID_UP) desired = amp > OPEN_UP ? "open" : "mid";
    } else if (state === "mid") {
      if (amp > OPEN_UP) desired = "open";
      else if (amp < MID_DOWN) desired = "closed";
    } else {
      if (amp < OPEN_DOWN) desired = amp < MID_DOWN ? "closed" : "mid";
    }

    if (desired !== state && framesInState >= MIN_HOLD_FRAMES) {
      state = desired;
      framesInState = 0;
    } else {
      framesInState++;
    }
    states[f] = state;
  }

  return states;
};
