import type { Db, LessonItemRow, LessonRow, ModuleRow } from "../db/types.ts";

export function listPublishedModulesByLevel(
  db: Db,
  levelId: string,
): Promise<ModuleRow[]> {
  return db.all<ModuleRow>(
    "SELECT * FROM modules WHERE level_id = ? AND status = 'published' ORDER BY order_index ASC",
    [levelId],
  );
}

export function findPublishedModuleById(
  db: Db,
  moduleId: string,
): Promise<ModuleRow | null> {
  return db.first<ModuleRow>(
    "SELECT * FROM modules WHERE id = ? AND status = 'published'",
    [moduleId],
  );
}

export function listPublishedLessonsByModule(
  db: Db,
  moduleId: string,
): Promise<LessonRow[]> {
  return db.all<LessonRow>(
    "SELECT * FROM lessons WHERE module_id = ? AND status = 'published' ORDER BY order_index ASC",
    [moduleId],
  );
}

export function countPublishedLessonsByModule(
  db: Db,
  moduleId: string,
): Promise<{ n: number } | null> {
  return db.first<{ n: number }>(
    "SELECT COUNT(*) as n FROM lessons WHERE module_id = ? AND status = 'published'",
    [moduleId],
  );
}

export function findPublishedLessonById(
  db: Db,
  lessonId: string,
): Promise<LessonRow | null> {
  return db.first<LessonRow>(
    "SELECT * FROM lessons WHERE id = ? AND status = 'published'",
    [lessonId],
  );
}

export function listLessonItemsByLesson(
  db: Db,
  lessonId: string,
): Promise<LessonItemRow[]> {
  return db.all<LessonItemRow>(
    "SELECT * FROM lesson_items WHERE lesson_id = ? ORDER BY order_index ASC",
    [lessonId],
  );
}
