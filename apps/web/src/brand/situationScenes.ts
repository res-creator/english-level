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
export type SceneId =
  "cafe" | "street" | "meeting" | "shop" | "restaurant" | "office" | "clinic";
export type CastId =
  "maya" | "alex" | "emma" | "daniel" | "leo" | "rosa" | "drkim";

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
  sit_a1_people_02: { scene: "meeting", cast: "rosa" },
  sit_a1_shop_01: { scene: "shop", cast: "emma" },
  sit_a1_travel_02: { scene: "street", cast: "rosa" },
  sit_a1_social_01: { scene: "cafe", cast: "alex" },
  sit_a1_daily_02: { scene: "cafe", cast: "maya" },
  sit_a1_health_01: { scene: "meeting", cast: "alex" },
  sit_a2_people_01: { scene: "meeting", cast: "alex" },
  sit_a2_people_02: { scene: "meeting", cast: "daniel" },
  sit_a2_cafe_01: { scene: "cafe", cast: "maya" },
  sit_a2_restaurant_01: { scene: "restaurant", cast: "leo" },
  sit_a2_restaurant_02: { scene: "restaurant", cast: "leo" },
  sit_a2_travel_01: { scene: "street", cast: "rosa" },
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
  sit_a1_people_02: "Hi, I'm Rosa. I live in apartment 3. What's your name?",
  sit_a1_shop_01: "Hi! Are you looking for something?",
  sit_a1_travel_02: "The ticket machine is free. Where are you going?",
  sit_a1_social_01:
    "It’s nice to see you again. What do you like doing in your free time?",
  sit_a1_daily_02: "What is your apartment like?",
  sit_a1_health_01: "You don’t look well. Are you okay?",
  sit_a2_people_01:
    "Good to see you again! What do you do for work these days?",
  sit_a2_people_02:
    "Hi, I'm Daniel. Glad you made it to the party. How do you know Alex?",
  sit_a2_cafe_01:
    "I've got your small coffee down. Is that right before you pay?",
  sit_a2_restaurant_01:
    "Good evening. Welcome to The Lantern. Are you looking to book a table?",
  sit_a2_restaurant_02: "Hi! Are you ready to order?",
  sit_a2_travel_01:
    "Hi, are you near the station? I'm waiting by the main entrance.",
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
  office: "На работе",
  clinic: "У врача",
};

export function sceneLabelText(scene: SceneId): string {
  return `Ситуация: ${SCENE_LABEL[scene]}`;
}
