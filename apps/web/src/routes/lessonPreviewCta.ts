import type { LessonProgressStatus } from "@english-level/contracts";

/**
 * The episode CTA is derived from the episode's own persisted progress,
 * which `GET /lessons/:id` returns — never from navigation state. That is
 * what makes "Продолжить" survive a Telegram restart, a reload or a deep
 * link. "Completed" here means the Mission was passed, not that one
 * session finished.
 */
export function resolveStartCtaLabel(
  status: LessonProgressStatus | undefined,
): string {
  if (status === "in_progress") return "Продолжить";
  if (status === "completed") return "Пройти ещё раз";
  return "Начать";
}

export function resolveStartCtaKicker(
  status: LessonProgressStatus | undefined,
): string | null {
  if (status === "in_progress")
    return "Продолжим с того места, где остановились";
  if (status === "completed") return "Эту ситуацию ты уже освоила";
  return null;
}
