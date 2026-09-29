import { RigConfig } from "../rigTypes";

/**
 * Talking-bust rig for the host ("brunette in blue"). Pivots match the
 * neutral-pose coordinates in docs/rig-spec-brunette.md exactly (converted
 * to 0-1 fractions of the 1000x1340 canvas). Legs/hips intentionally
 * excluded from this first pass -- see that doc.
 */
export const brunetteBustRig: RigConfig = {
  basePath: "characters/host/rig",
  canvasWidth: 1000,
  canvasHeight: 1340,
  torso: "torso.png",
  headHairBack: "head_hair_back.png",
  headBase: "head_base.png",
  eyebrows: "eyebrows_neutral.png",
  eyesOpen: "eyes_open.png",
  eyesClosed: "eyes_closed.png",
  mouthClosed: "mouth_closed.png",
  mouthMid: "mouth_mid.png",
  mouthOpen: "mouth_open.png",
  headHairFront: "head_hair_front.png",
  neckPivot: { x: 0.5, y: 300 / 1340 },
  armRight: {
    upper: "arm_right_upper.png",
    fore: "arm_right_fore.png",
    hand: "hand_right.png",
    shoulderPivot: { x: 360 / 1000, y: 350 / 1340 },
    elbowPivot: { x: 340 / 1000, y: 560 / 1340 },
    wristPivot: { x: 330 / 1000, y: 760 / 1340 },
  },
  armLeft: {
    upper: "arm_left_upper.png",
    fore: "arm_left_fore.png",
    hand: "hand_left.png",
    shoulderPivot: { x: 640 / 1000, y: 350 / 1340 },
    elbowPivot: { x: 660 / 1000, y: 560 / 1340 },
    wristPivot: { x: 670 / 1000, y: 760 / 1340 },
  },
};
