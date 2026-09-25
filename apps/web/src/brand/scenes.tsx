/**
 * Places — presentational lookup only.
 *
 * The coded flat-vector scene illustrations that used to live here
 * (cafe counter, street lamps, a sketched shop window) were a
 * placeholder for a scene with no art yet. Once real 3D cast renders
 * (Maya, Alex, Rosa) landed in front of them, their own decorative
 * fragments read as a rendering bug — two mismatched art styles in
 * one frame — rather than as an honest "no art yet" placeholder. The
 * scene stage now falls back to a plain neutral gradient instead (see
 * .scene__backdrop-neutral in styles.css); real per-scene photography
 * would replace it the same way Today/Course/My Space's art already
 * has, via artName.sceneBackground(scene).
 */
export { sceneForSituation, openingLine } from "./situationScenes.ts";
export type { SceneId, SituationScene } from "./situationScenes.ts";
