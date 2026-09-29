import { CEFRLevel } from "../data/types";

/** A1/A2 sage green, B1/B2 dusty purple, C1/C2 warm terracotta -- matches the brand palette. */
export const levelColor = (level: CEFRLevel): string => {
  if (level === "A1" || level === "A2") return "rgba(90,120,90,0.85)";
  if (level === "B1" || level === "B2") return "rgba(120,110,150,0.85)";
  return "rgba(190,140,110,0.85)";
};
