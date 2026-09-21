import type {
  LearningGoal,
  SelfReportedCefrLevel,
} from "@english-level/contracts";

/**
 * Minimal label lookup for the two onboarding steps with fixed, short
 * option sets. Not a general i18n system — just enough to satisfy "labels
 * should be localized where practical" without building one. Falls back to
 * English for any language other than Russian.
 */
type Locale = "en" | "ru";

function resolveLocale(interfaceLanguage: string | undefined): Locale {
  return interfaceLanguage === "ru" ? "ru" : "en";
}

const GOAL_LABELS: Record<Locale, Record<LearningGoal, string>> = {
  en: {
    everyday: "Everyday life",
    travel: "Travel",
    work: "Work",
    study: "Study",
    moving_abroad: "Moving abroad",
    movies_internet: "Movies & internet",
  },
  ru: {
    everyday: "Для жизни",
    travel: "Путешествия",
    work: "Работа",
    study: "Учёба",
    moving_abroad: "Переезд",
    movies_internet: "Фильмы и интернет",
  },
};

export function goalLabel(
  goal: LearningGoal,
  interfaceLanguage: string | undefined,
): string {
  return GOAL_LABELS[resolveLocale(interfaceLanguage)][goal];
}

const LEVEL_LABELS: Record<
  Locale,
  Record<Exclude<SelfReportedCefrLevel, null>, string> & { unknown: string }
> = {
  en: {
    unknown: "I don't know",
    A1: "A1",
    A2: "A2",
    B1: "B1",
    B2: "B2",
  },
  ru: {
    unknown: "Не знаю",
    A1: "A1",
    A2: "A2",
    B1: "B1",
    B2: "B2",
  },
};

export function levelLabel(
  level: Exclude<SelfReportedCefrLevel, null> | "unknown",
  interfaceLanguage: string | undefined,
): string {
  return LEVEL_LABELS[resolveLocale(interfaceLanguage)][level];
}
