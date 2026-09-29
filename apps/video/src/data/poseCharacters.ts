export interface PoseCharacterConfig {
  /** public/ folder for this character's pose-based assets. */
  basePath: string;
  /** Canvas size every asset in this folder shares. */
  canvasWidth: number;
  canvasHeight: number;
  poseNeutral: string;
  poseEmphasis: string;
  eyesOpen: string;
  eyesClosed: string;
  eyesReaction: string;
  mouthClosed: string;
  mouthMid: string;
  mouthOpen: string;
}

const STANDARD_STATES = {
  poseNeutral: "poseNeutral.png",
  poseEmphasis: "poseEmphasis.png",
  eyesOpen: "eyesOpen.png",
  eyesClosed: "eyesClosed.png",
  eyesReaction: "eyesReaction.png",
  mouthClosed: "mouthClosed.png",
  mouthMid: "mouthMid.png",
  mouthOpen: "mouthOpen.png",
} as const;

// Character A -- "brunette in blue" (the approved host). poseNeutral is
// the rig pack's own authored neutral flattened to one image (torso, both
// arms, head group all at their 0deg neutral angles -- pure recomposite,
// no new art). poseEmphasis rotates the whole left arm (upper+forearm+hand
// composited as one rigid unit first) up around the real shoulder pivot --
// a static, one-time offline transform baked into a PNG, not a runtime
// rig. Eyes/mouth states reuse the real rig-pack layers directly (eyebrows
// travel with the eyes overlay so a reaction can change them independently
// of the held body pose). Built by
// apps/video/public/characters/dialogue-a/ -- see git history for the
// build script if these need regenerating from a new rig pack.
export const characterA: PoseCharacterConfig = {
  basePath: "characters/dialogue-a",
  canvasWidth: 1000,
  canvasHeight: 1340,
  ...STANDARD_STATES,
};

// Character B -- the approved "blonde guy in red" portrait. poseNeutral
// is that portrait unchanged. poseEmphasis is the same portrait with a
// small whole-image scale+shift (a lean toward camera) -- deliberately
// NOT a limb rotation, since this character has no separate arm layers
// and a single-rigid-rotation test on a fabricated limb crop looked
// broken (see conversation history). Eyes-closed/reaction and the two
// mouth-open states are small patches painted at this portrait's own
// calibrated face position, in colors sampled directly from the
// portrait, replacing the baked-in open-eyes/closed-mouth pixels there --
// not a stretch/squash of existing art, new (if simple) brushwork placed
// precisely, same as how a real illustrator would add alternate states to
// a single flat portrait.
export const characterB: PoseCharacterConfig = {
  basePath: "characters/dialogue-b",
  canvasWidth: 1493,
  canvasHeight: 2000,
  ...STANDARD_STATES,
};
