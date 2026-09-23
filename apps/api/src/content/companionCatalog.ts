/**
 * The three companions. A companion is a study buddy, not a pet: it has no
 * needs, no health and no mood, so there is deliberately nothing here to
 * feed, heal or neglect. Only identity and voice.
 */
export interface CompanionDefinition {
  id: string;
  name: string;
  /** One line shown at selection time. */
  tagline: string;
  /** Accent colour token used by the client for its space. */
  tone: "green" | "blush" | "sand";
}

export const COMPANIONS: CompanionDefinition[] = [
  {
    id: "cmp_fox",
    name: "Лис",
    tagline: "Любит короткие заходы и ровный ритм",
    tone: "sand",
  },
  {
    id: "cmp_cat",
    name: "Кот",
    tagline: "Спокойный. Не торопит и не считает пропуски",
    tone: "blush",
  },
  {
    id: "cmp_owl",
    name: "Сова",
    tagline: "Замечает, что ты запомнила надолго",
    tone: "green",
  },
];

export function findCompanionDefinition(
  id: string,
): CompanionDefinition | undefined {
  return COMPANIONS.find((c) => c.id === id);
}
