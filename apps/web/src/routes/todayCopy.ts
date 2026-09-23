import type { EpisodeDTO, TodayAction } from "@english-level/contracts";

/**
 * Today's wording, kept pure so it can be tested without a browser. The
 * server decides *what* to do; this decides only how to say it — and it
 * never says "session 3 of 3" when the Mission is what's actually next.
 */
export function resolveTodayCta(
  action: TodayAction,
  episode: EpisodeDTO | null,
): string {
  if (action === "mission") return "Пройти миссию";
  if (action === "review") return "Повторить";
  if (!episode) return "Открыть курс";
  return episode.sessionsDone > 0 ? "Продолжить" : "Начать";
}

export function resolveTodayEyebrow(
  action: TodayAction,
  episode: EpisodeDTO | null,
): string {
  if (action === "mission") return "Проверим на деле";
  if (action === "review") return "Сегодня";
  if (episode && episode.sessionsDone > 0) return "Продолжаем ситуацию";
  return "Сегодняшняя ситуация";
}

/** Russian plural agreement, for counts the learner actually sees. */
export function plural(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
