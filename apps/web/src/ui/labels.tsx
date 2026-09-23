import type { LessonProgressStatus } from "@english-level/contracts";

const LEVEL_TITLE: Record<string, string> = {
  A1: "A1 · Начальный",
  A2: "A2 · Элементарный",
  B1: "B1 · Средний",
  B2: "B2 · Выше среднего",
};

export function levelTitle(level: string): string {
  return LEVEL_TITLE[level] ?? level;
}

export function LevelPill({ level }: { level: string }) {
  return <span className="pill">{levelTitle(level)}</span>;
}

/** Lesson type labels — the learning-content names stay English
 * (Vocabulary, Grammar…), the *category* the learner reads is Russian. */
export const LESSON_TYPE_LABELS: Record<string, string> = {
  vocabulary: "Слова",
  grammar: "Грамматика",
  mixed: "Практика",
  reading: "Чтение",
  practice: "Практика",
  checkpoint: "Проверка",
};

export function lessonTypeLabel(type: string): string {
  return LESSON_TYPE_LABELS[type] ?? type;
}

const STATUS_LABEL: Record<LessonProgressStatus, string> = {
  completed: "Пройден",
  in_progress: "Начат",
  not_started: "Не начат",
};

export function LessonStatusTag({ status }: { status: LessonProgressStatus }) {
  if (status === "completed") {
    return <span className="tag tag-green">✓ {STATUS_LABEL.completed}</span>;
  }
  if (status === "in_progress") {
    return <span className="tag tag-blush">{STATUS_LABEL.in_progress}</span>;
  }
  return null;
}
