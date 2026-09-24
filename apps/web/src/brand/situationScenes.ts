/**
 * Which place and which person a situation belongs to.
 *
 * This is presentation, not curriculum: it lives in the frontend so the
 * content model, its ids and its migrations stay exactly as they are.
 *
 * The same person returns in the same context — Майя is the barista in
 * both café situations, so by the fifth one the learner is solving a
 * problem with someone they already know. That continuity is the point,
 * and it also means one chapter needs three places and three people
 * rather than five and five.
 *
 * Anything unmapped falls back to a neutral scene, so new content never
 * waits on artwork.
 */
export type SceneId = "cafe" | "street" | "meeting" | "shop" | "restaurant";
export type CastId = "maya" | "alex" | "emma" | "daniel" | "leo" | "rosa";

export interface SituationScene {
  scene: SceneId;
  cast: CastId;
}

const SITUATION_SCENES: Record<string, SituationScene> = {
  les_sie_a1_e1: { scene: "meeting", cast: "alex" },
  les_sie_a1_e2: { scene: "cafe", cast: "maya" },
  les_sie_a1_e3: { scene: "meeting", cast: "alex" },
  les_sie_a1_e4: { scene: "street", cast: "rosa" },
  // The same barista, the same café — now something has gone wrong.
  les_sie_a1_e5: { scene: "cafe", cast: "maya" },
};

export const FALLBACK_SCENE: SituationScene = {
  scene: "meeting",
  cast: "alex",
};

export function sceneForSituation(episodeId: string): SituationScene {
  return SITUATION_SCENES[episodeId] ?? FALLBACK_SCENE;
}

/** The line that opens a situation, so the scene is already a
 * conversation before the first task appears. */
const OPENING_LINES: Record<string, string> = {
  les_sie_a1_e1: "Hi! I'm Alex. What's your name?",
  les_sie_a1_e2: "Hi! What can I get you?",
  les_sie_a1_e3: "So what do you do all day?",
  les_sie_a1_e4: "Are you looking for something?",
  les_sie_a1_e5: "Sorry — what did you order?",
};

export function openingLine(episodeId: string): string {
  return OPENING_LINES[episodeId] ?? "Hello!";
}

/** The chip over the scene: what kind of situation this is, plainly
 * named — same wording whether you're previewing it or inside it. */
const SCENE_LABEL: Record<SceneId, string> = {
  cafe: "В кафе",
  meeting: "Знакомство",
  street: "В городе",
  shop: "В магазине",
  restaurant: "В ресторане",
};

export function sceneLabelText(scene: SceneId): string {
  return `Ситуация: ${SCENE_LABEL[scene]}`;
}
