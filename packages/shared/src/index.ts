/** The product name, as the learner sees it. */
export const APP_NAME = "Speak in English";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export * from "./telegram.ts";
