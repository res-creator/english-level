import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ModuleSeedSchema,
  LessonSeedSchema,
  LearningItemSeedSchema,
  SieLearningItemSeedSchema,
  ItemRelationSeedSchema,
  GrammarPatternSeedSchema,
  GrammarRelationSeedSchema,
  LessonItemSeedSchema,
} from "./schemas.ts";
import type { ContentBundle } from "./contentBundle.ts";

export type { ContentBundle } from "./contentBundle.ts";

const CONTENT_DIR = fileURLToPath(
  new URL("../../../../seeds/content/", import.meta.url),
);

function readJson(fileName: string): unknown {
  const raw = readFileSync(`${CONTENT_DIR}${fileName}`, "utf-8");
  return JSON.parse(raw);
}

function parseArray<T>(
  fileName: string,
  schema: { parse: (v: unknown) => T },
): T[] {
  const raw = readJson(fileName);
  if (!Array.isArray(raw)) {
    throw new Error(`${fileName}: expected a JSON array at the top level`);
  }
  return raw.map((entry, index) => {
    try {
      return schema.parse(entry);
    } catch (err) {
      throw new Error(
        `${fileName}[${index}] failed validation: ${(err as Error).message}`,
      );
    }
  });
}

function assertUnique(ids: string[], label: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`duplicate stable ID in ${label}: "${id}"`);
    }
    seen.add(id);
  }
}

/**
 * Loads every seed file, validates each row with its Zod schema, and
 * cross-validates references (lessons -> modules, relations -> items/
 * patterns, lesson_items -> lessons/content) — failing loudly (throwing,
 * with a specific message) on the first problem found, rather than
 * silently importing broken content. Pure/read-only: no DB access here.
 */
export function loadSeedContent(): ContentBundle {
  const modules = [
    ...parseArray("sie-a1-modules.json", ModuleSeedSchema),
    ...parseArray("a1-modules.json", ModuleSeedSchema),
    ...parseArray("a2-modules.json", ModuleSeedSchema),
  ];
  const lessons = [
    ...parseArray("sie-a1-lessons.json", LessonSeedSchema),
    ...parseArray("a1-lessons.json", LessonSeedSchema),
    ...parseArray("a2-lessons.json", LessonSeedSchema),
  ];
  const learningItems = [
    // Stricter schema: sie-a1 is the one live "one continuous situation"
    // track, so every item here must carry an authored npcReplyCorrect —
    // see schemas.ts's SieLearningItemSeedSchema doc comment.
    ...parseArray("sie-a1-items.json", SieLearningItemSeedSchema),
    ...parseArray("a1-learning-items.json", LearningItemSeedSchema),
    ...parseArray("a2-learning-items.json", LearningItemSeedSchema),
  ];
  const itemRelations = [
    ...parseArray("a1-item-relations.json", ItemRelationSeedSchema),
    ...parseArray("a2-item-relations.json", ItemRelationSeedSchema),
  ];
  const grammarPatterns = [
    ...parseArray("sie-a1-grammar.json", GrammarPatternSeedSchema),
    ...parseArray("a1-grammar.json", GrammarPatternSeedSchema),
    ...parseArray("a2-grammar.json", GrammarPatternSeedSchema),
  ];
  const grammarRelations = parseArray(
    "grammar-relations.json",
    GrammarRelationSeedSchema,
  );
  const lessonItems = [
    ...parseArray("sie-a1-lesson-items.json", LessonItemSeedSchema),
    ...parseArray("a1-lesson-items.json", LessonItemSeedSchema),
    ...parseArray("a2-lesson-items.json", LessonItemSeedSchema),
  ];

  assertUnique(
    modules.map((m) => m.id),
    "modules",
  );
  assertUnique(
    lessons.map((l) => l.id),
    "lessons",
  );
  assertUnique(
    learningItems.map((i) => i.id),
    "learning_items",
  );
  assertUnique(
    grammarPatterns.map((g) => g.id),
    "grammar_patterns",
  );
  assertUnique(
    lessonItems.map((li) => li.id),
    "lesson_items",
  );
  for (const item of learningItems) {
    assertUnique(
      item.examples.map((e) => e.id),
      `examples of ${item.id}`,
    );
  }

  const moduleIds = new Set(modules.map((m) => m.id));
  const lessonIds = new Set(lessons.map((l) => l.id));
  const itemIds = new Set(learningItems.map((i) => i.id));
  const grammarIds = new Set(grammarPatterns.map((g) => g.id));

  for (const lesson of lessons) {
    if (!moduleIds.has(lesson.moduleId)) {
      throw new Error(
        `lesson "${lesson.id}" references missing module "${lesson.moduleId}"`,
      );
    }
  }
  for (const rel of itemRelations) {
    if (!itemIds.has(rel.fromItemId) || !itemIds.has(rel.toItemId)) {
      throw new Error(
        `item relation references a missing item: ${JSON.stringify(rel)}`,
      );
    }
  }
  for (const rel of grammarRelations) {
    if (
      !grammarIds.has(rel.fromPatternId) ||
      !grammarIds.has(rel.toPatternId)
    ) {
      throw new Error(
        `grammar relation references a missing pattern: ${JSON.stringify(rel)}`,
      );
    }
  }
  for (const link of lessonItems) {
    if (!lessonIds.has(link.lessonId)) {
      throw new Error(
        `lesson_item "${link.id}" references missing lesson "${link.lessonId}"`,
      );
    }
    const pool = link.contentType === "learning_item" ? itemIds : grammarIds;
    if (!pool.has(link.contentId)) {
      throw new Error(
        `lesson_item "${link.id}" references missing ${link.contentType} "${link.contentId}"`,
      );
    }
  }

  // Deterministic ordering must not have gaps/collisions per parent, since
  // both modules-per-level and lessons-per-module rely on a DB unique
  // index on (parent, order_index).
  for (const [levelCode, group] of Object.entries(
    groupBy(modules, (m) => m.levelCode),
  )) {
    assertContiguousOrder(
      group.map((m) => m.order),
      `modules in level ${levelCode}`,
    );
  }
  for (const [moduleId, group] of Object.entries(
    groupBy(lessons, (l) => l.moduleId),
  )) {
    assertContiguousOrder(
      group.map((l) => l.order),
      `lessons in module ${moduleId}`,
    );
  }
  // lesson_items already has a DB-level UNIQUE index on (lesson_id,
  // order_index), so a duplicate here would fail at seed-apply time
  // anyway — this just catches it earlier, at load time, with a specific
  // lesson/order in the message instead of a raw SQLite constraint
  // error, the same way modules/lessons are already checked above.
  for (const [lessonId, group] of Object.entries(
    groupBy(lessonItems, (li) => li.lessonId),
  )) {
    assertContiguousOrder(
      group.map((li) => li.order),
      `lesson_items in lesson ${lessonId}`,
    );
  }

  return {
    modules,
    lessons,
    learningItems,
    itemRelations,
    grammarPatterns,
    grammarRelations,
    lessonItems,
  };
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    (result[k] ??= []).push(item);
  }
  return result;
}

function assertContiguousOrder(orders: number[], label: string): void {
  const sorted = [...orders].sort((a, b) => a - b);
  const seen = new Set<number>();
  for (const o of sorted) {
    if (seen.has(o)) {
      throw new Error(`duplicate order_index ${o} among ${label}`);
    }
    seen.add(o);
  }
}
