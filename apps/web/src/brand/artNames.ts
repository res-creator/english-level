/**
 * How every illustration slot is named.
 *
 * Kept free of any build-tool magic so the manifest, the tests and the
 * components all read the same names — a picture can never end up filed
 * under a name nothing looks for.
 */
/** Slot names, built the same way everywhere so the manifest and the
 * components can never drift apart. */
export const artName = {
  /** Full-bleed backdrop behind a hero screen. */
  heroBackdrop: (screen: string) => `hero-${screen}-bg`,
  /** The subject that floats over that backdrop. */
  heroSubject: (screen: string) => `hero-${screen}-art`,
  kvo: (variant: string, state: string) => `kvo-${variant}-${state}`,
  cast: (cast: string, state: string) => `cast-${cast}-${state}`,
  sceneBackground: (scene: string) => `scene-${scene}-bg`,
  /** Optional layer that sits *in front* of the person — a counter edge,
   * a plant, the near side of a table. */
  sceneForeground: (scene: string) => `scene-${scene}-fg`,
  spaceStage: (stage: number) => `space-stage-${stage}`,
  spaceForeground: () => `space-fg`,
  spaceObject: (rewardId: string) => `space-object-${rewardId}`,
};
