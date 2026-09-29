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
  sit_a2_travel_02: { scene: "street", cast: "rosa" },
  sit_a2_daily_01: { scene: "meeting", cast: "alex" },
  sit_a2_daily_02: { scene: "cafe", cast: "alex" },
  sit_a2_shop_01: { scene: "shop", cast: "emma" },
  sit_a2_shop_02: { scene: "shop", cast: "emma" },
  sit_a2_work_01: { scene: "office", cast: "daniel" },
  sit_a2_work_02: { scene: "office", cast: "daniel" },
  sit_a2_social_01: { scene: "cafe", cast: "alex" },
  sit_a2_problems_01: { scene: "street", cast: "rosa" },
  sit_a2_problems_02: { scene: "restaurant", cast: "leo" },
  sit_a2_health_01: { scene: "shop", cast: "emma" },
  sit_b1_people_01: { scene: "cafe", cast: "alex" },
  sit_b1_people_02: { scene: "cafe", cast: "alex" },
  sit_b1_cafe_01: { scene: "cafe", cast: "maya" },
  sit_b1_restaurant_01: { scene: "restaurant", cast: "leo" },
  sit_b1_restaurant_02: { scene: "restaurant", cast: "leo" },
  sit_b1_travel_01: { scene: "street", cast: "rosa" },
  sit_b1_travel_02: { scene: "street", cast: "rosa" },
  sit_b1_daily_01: { scene: "meeting", cast: "alex" },
  sit_b1_daily_02: { scene: "meeting", cast: "alex" },
  sit_b1_shop_01: { scene: "shop", cast: "emma" },
  sit_b1_shop_02: { scene: "shop", cast: "emma" },
  sit_b1_health_01: { scene: "clinic", cast: "drkim" },
  sit_b1_work_01: { scene: "office", cast: "daniel" },
  sit_b1_work_02: { scene: "office", cast: "daniel" },
  sit_b1_work_03: { scene: "office", cast: "daniel" },
  sit_b1_social_01: { scene: "cafe", cast: "alex" },
  sit_b1_social_02: { scene: "cafe", cast: "alex" },
  sit_b1_problems_01: { scene: "shop", cast: "emma" },
  sit_b1_problems_02: { scene: "restaurant", cast: "leo" },
  sit_b2_people_01: { scene: "cafe", cast: "alex" },
  sit_b2_restaurant_01: { scene: "restaurant", cast: "leo" },
  sit_b2_restaurant_02: { scene: "restaurant", cast: "leo" },
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
  sit_a2_travel_02:
    "The museum? Go straight along King Street and turn left at the bridge.",
  sit_a2_daily_01: "How was your weekend? Did you do anything fun?",
  sit_a2_daily_02: "Are you free next week? I could use a day out.",
  sit_a2_shop_01: "Hello. Is there anything I can help you with today?",
  sit_a2_shop_02: "We have a few offers on this week. Are you looking at anything in particular?",
  sit_a2_work_01: "We have a few minutes before the meeting. What do you do at work?",
  sit_a2_work_02:
    "I’m getting a few things ready for the team this week. What are you working on?",
  sit_a2_social_01:
    "I’m free this weekend. Is there anything you’d like to do together?",
  sit_a2_problems_01:
    "You’re checking your pockets and looking around. Did you lose something?",
  sit_a2_problems_02:
    "Here’s the itemised bill and receipt. Would you like a moment to check them?",
  sit_a2_health_01:
    "Hello. These simple remedies are on this shelf. What are you looking for?",
  sit_b1_people_01:
    "I ran into Maya this morning. She had some exciting news about the bookshop.",
  sit_b1_people_02:
    "I was at the evening market yesterday. I think the live music should end at seven.",
  sit_b1_cafe_01:
    "I'm putting together the café's drinks board. We have two new drinks—which one would you feature?",
  sit_b1_restaurant_01:
    "I can see you're checking the menu carefully. Would you like me to check an ingredient with the kitchen?",
  sit_b1_restaurant_02:
    "I'm sorry to keep you waiting. Your main course should be here already; what seems to be the problem?",
  sit_b1_travel_01:
    "I see you're checking the Northbridge trains. Is something wrong with your service?",
  sit_b1_travel_02:
    "You've got some time before your train. What would make the stop worthwhile for you?",
  sit_b1_daily_01:
    "Have you ever had a trip that didn't go quite as planned?",
  sit_b1_daily_02:
    "Last year brought a big change for you. What's different about your everyday life now?",
  sit_b1_shop_01:
    "Hello. I can help with your account today. What seems to be wrong with the bill?",
  sit_b1_shop_02:
    "These two tablets are our most popular models. What matters most to you?",
  sit_b1_health_01:
    "Hello, I'm Dr. Kim. Tell me what has been bothering you.",
  sit_b1_work_01:
    "Thanks for meeting me. Which part of the event project do you want me to handle?",
  sit_b1_work_02:
    "I'm finishing the event schedule before lunch. What do you need?",
  sit_b1_work_03:
    "Thanks for applying for the team coordinator role. Could you tell me about your recent experience?",
  sit_b1_social_01:
    "Maya and Daniel both want to meet this weekend, but their schedules are different. Where should we start?",
  sit_b1_social_02:
    "Maya is planning a housewarming dinner on Friday. She asked whether you'd like to come.",
  sit_b1_problems_01:
    "Customer service, Emma speaking. I have your order record open. What went wrong?",
  sit_b1_problems_02:
    "I've checked your booking. The set-menu deposit is normally non-refundable. What would you like me to review?",
  sit_b2_people_01:
    "The council wants to make the town centre car-free every weekend. I think it would make the area much better.",
  sit_b2_restaurant_01:
    "I’m ready to take the group’s order. Shall we go through everyone’s choices and any dietary requirements?",
  sit_b2_restaurant_02:
    "I know dinner did not go as planned. I’ve brought the revised bill; would you check whether it now reflects what happened?",
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
