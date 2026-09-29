/** Normalized pivot (0-1) on the shared rig canvas -- see docs/rig-spec-brunette.md. */
export interface Pivot {
  x: number;
  y: number;
}

export interface RigConfig {
  /** public/ folder holding this character's rig layers, e.g. "characters/host/rig". */
  basePath: string;
  /** Rig canvas size the pivots below are normalized against (1000x1340 per the spec). */
  canvasWidth: number;
  canvasHeight: number;
  torso: string;
  headHairBack: string;
  headBase: string;
  eyebrows: string;
  eyesOpen: string;
  eyesClosed: string;
  mouthClosed: string;
  mouthMid: string;
  mouthOpen: string;
  headHairFront: string;
  neckPivot: Pivot;
  /** Waist-ish point the whole-body idle sway rotates around. Defaults to (0.5, 0.485) if omitted. */
  bodyPivot?: Pivot;
  armRight: {
    upper: string;
    fore: string;
    hand: string;
    shoulderPivot: Pivot;
    elbowPivot: Pivot;
    wristPivot: Pivot;
  };
  armLeft: {
    upper: string;
    fore: string;
    hand: string;
    shoulderPivot: Pivot;
    elbowPivot: Pivot;
    wristPivot: Pivot;
  };
}
