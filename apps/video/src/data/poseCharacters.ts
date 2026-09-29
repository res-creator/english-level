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

// Placeholder pose-based art (see apps/video/docs/ for the pending real
// asset request) -- generated so the pose-swap/face-state mechanic could
// be proven out before real character art exists. Swap the PNGs under
// public/characters/pose-demo-a|b/ for real ones; nothing here or in
// PoseCharacter.tsx needs to change to pick them up.
export const characterA: PoseCharacterConfig = {
  basePath: "characters/pose-demo-a",
  canvasWidth: 800,
  canvasHeight: 1000,
  poseNeutral: "poseNeutral.png",
  poseEmphasis: "poseEmphasis.png",
  eyesOpen: "eyesOpen.png",
  eyesClosed: "eyesClosed.png",
  eyesReaction: "eyesReaction.png",
  mouthClosed: "mouthClosed.png",
  mouthMid: "mouthMid.png",
  mouthOpen: "mouthOpen.png",
};

export const characterB: PoseCharacterConfig = {
  ...characterA,
  basePath: "characters/pose-demo-b",
};
